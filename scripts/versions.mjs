#!/usr/bin/env node
/**
 * Per-section frontend/backend versions, shown on /admin/about.
 *
 *   node scripts/versions.mjs precommit       bump what the staged files touch (the git hook runs this)
 *   node scripts/versions.mjs init            rebuild every version by replaying git history
 *   node scripts/versions.mjs bump <section> <frontend|backend> <major|minor|patch>
 *   node scripts/versions.mjs bump app <major|minor|patch>
 *   node scripts/versions.mjs install-hook    point git at .githooks/ (npm's `prepare` runs this)
 *
 * ## The rule
 *
 * One bump per section and layer per commit, however many files changed:
 * a commit that **adds** a file in that section/layer bumps the minor version,
 * one that only changes or deletes files bumps the patch. Major bumps are a
 * human decision and only happen through the `bump` command. Which files belong
 * to which section is decided in `version-sections.mjs`.
 *
 * ## The app version follows the sections
 *
 * `package.json`'s `version` is the release number, and it moves by the same
 * rule one level up: a commit that bumped any section's minor bumps the app's
 * minor, one that only bumped patches bumps the app's patch, and a commit that
 * touched nothing versioned leaves it alone. Major is manual here too
 * (`bump app major`). It is written to `package.json` and to the two matching
 * fields in `package-lock.json`, so npm never sees them disagree.
 *
 * It lives in `package.json` rather than in `appVersions.json` because that is
 * where tooling — npm, Vercel, anything that reads a release number — looks.
 *
 * ## Deliberately lenient
 *
 * This is bookkeeping, not a gate. `precommit` never fails a commit: any error
 * is printed as a warning and the commit goes ahead. `SKIP_VERSIONS=1` skips it,
 * and `git commit --no-verify` bypasses hooks altogether.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { SECTIONS, classify } from './version-sections.mjs';

const VERSIONS_FILE = 'src/lib/appVersions.json';
const HISTORY_LIMIT = 100;
const START_VERSION = '1.0.0';
const PACKAGE_FILES = ['package.json', 'package-lock.json'];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

// ---------------------------------------------------------------------------
// Version arithmetic
// ---------------------------------------------------------------------------

function bumpVersion(version, level) {
  const [major, minor, patch] = version.split('.').map(Number);
  if (level === 'major') return `${major + 1}.0.0`;
  if (level === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** Empty state: every section known, nothing versioned yet. */
function emptyState() {
  return {
    updatedAt: null,
    sections: Object.fromEntries(
      SECTIONS.map((s) => [
        s.key,
        {
          label: s.label,
          description: s.description,
          frontend: s.backendOnly ? null : { version: null, updatedAt: null },
          backend: { version: null, updatedAt: null },
        },
      ]),
    ),
    history: [],
  };
}

/**
 * Load the file and reconcile it with `SECTIONS`: labels follow the config, a
 * newly added section appears, a removed one is dropped. Versions are kept.
 */
function load() {
  const fresh = emptyState();
  if (!existsSync(VERSIONS_FILE)) return fresh;

  const saved = JSON.parse(readFileSync(VERSIONS_FILE, 'utf8'));
  for (const [key, section] of Object.entries(fresh.sections)) {
    const old = saved.sections?.[key];
    if (!old) continue;
    if (section.frontend && old.frontend) section.frontend = old.frontend;
    if (old.backend) section.backend = old.backend;
  }
  return { ...fresh, updatedAt: saved.updatedAt ?? null, history: saved.history ?? [] };
}

function save(state) {
  writeFileSync(VERSIONS_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// The app version (package.json)
// ---------------------------------------------------------------------------

/**
 * The project's own `"version"` sits straight after its `"name"` — once in
 * `package.json`, twice in the lockfile (top level and `packages[""]`).
 * Matching that pair rewrites exactly those fields, never a dependency's
 * version, and leaves the rest of each file byte-for-byte as it was.
 */
const OWN_VERSION = /("name":\s*"[^"]+",\s*"version":\s*")([^"]+)(")/g;

function readAppVersion() {
  return JSON.parse(readFileSync('package.json', 'utf8')).version;
}

function writeAppVersion(version) {
  for (const file of PACKAGE_FILES) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    writeFileSync(file, text.replace(OWN_VERSION, `$1${version}$3`));
  }
}

/**
 * The app-level bump one commit's section bumps imply: minor if any section
 * moved its minor (or appeared for the first time), else patch, else nothing.
 * Section majors never propagate — the app's major is its own decision.
 */
function appBumpLevel(bumps) {
  if (bumps.length === 0) return null;
  const grew = bumps.some((b) => b.from === null || b.to.endsWith('.0'));
  return grew ? 'minor' : 'patch';
}

/** Below 1.0.0 the old `0.1.0` placeholder is replaced rather than bumped. */
function nextAppVersion(current, level) {
  if (!current || current.startsWith('0.')) return START_VERSION;
  return bumpVersion(current, level);
}

/**
 * Apply one commit's worth of changes. `changes` is `[status, path]` pairs as
 * `git diff --name-status` reports them (A added, M modified, D deleted, R…
 * renamed). Returns the bumps made, for printing.
 */
function applyChanges(state, changes, at) {
  /** @type {Map<string, { section: string; layer: string; added: boolean; files: number }>} */
  const touched = new Map();

  for (const [status, path] of changes) {
    const where = classify(path);
    if (!where) continue;
    const id = `${where.section}:${where.layer}`;
    const entry = touched.get(id) ?? { ...where, added: false, files: 0 };
    entry.added ||= status.startsWith('A');
    entry.files += 1;
    touched.set(id, entry);
  }

  const bumps = [];
  for (const { section, layer, added, files } of touched.values()) {
    const slot = state.sections[section]?.[layer];
    if (!slot) continue;

    const from = slot.version;
    // A section's first appearance starts it at 1.0.0 rather than bumping.
    const to = from === null ? START_VERSION : bumpVersion(from, added ? 'minor' : 'patch');
    slot.version = to;
    slot.updatedAt = at;
    bumps.push({ at, section, layer, from, to, files });
  }

  if (bumps.length > 0) {
    state.updatedAt = at;
    state.history = [...bumps, ...state.history].slice(0, HISTORY_LIMIT);
  }
  return bumps;
}

const LAYER_SHORT = { frontend: 'FE', backend: 'BE' };

function describe(bumps, state) {
  return bumps
    .map(
      (b) => `${state.sections[b.section].label} ${LAYER_SHORT[b.layer]} ${b.from ?? '—'}→${b.to}`,
    )
    .join(' · ');
}

/** `--name-status` output → `[status, path]`, using the new path of a rename. */
function parseNameStatus(text) {
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('\t');
      return [parts[0], parts[parts.length - 1]];
    });
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function precommit() {
  if (process.env.SKIP_VERSIONS) return;

  const staged = parseNameStatus(git('diff', '--cached', '--name-status', '-M'));
  const state = load();
  const bumps = applyChanges(state, staged, new Date().toISOString());
  if (bumps.length === 0) return;

  save(state);
  git('add', VERSIONS_FILE);

  const from = readAppVersion();
  const to = nextAppVersion(from, appBumpLevel(bumps));
  writeAppVersion(to);
  git('add', ...PACKAGE_FILES.filter((file) => existsSync(file)));

  console.log(`versions: app ${from}→${to} · ${describe(bumps, state)}`);
}

/**
 * Rebuild from scratch by replaying every non-merge commit, oldest first, with
 * the same rule the hook applies. The result is what the file would hold had
 * the hook existed from the first commit — real dates, real history.
 */
function init() {
  const SEP = '\u0001';
  const log = git('log', '--reverse', '--no-merges', '-M', '--name-status', `--format=${SEP}%cI`);

  const state = emptyState();
  let total = 0;
  let app = null;
  for (const block of log.split(SEP).filter(Boolean)) {
    const [date, ...rest] = block.split('\n');
    const bumps = applyChanges(state, parseNameStatus(rest.join('\n')), date.trim());
    total += bumps.length;
    const level = appBumpLevel(bumps);
    if (level) app = nextAppVersion(app, level);
  }
  save(state);
  if (app) writeAppVersion(app);
  console.log(
    `versions: rebuilt from git history (${total} bumps, app ${app ?? 'unchanged'}) → ${VERSIONS_FILE}`,
  );
}

function manualBump(section, layer, level) {
  if (section === 'app') {
    // `bump app <level>` — the level arrives in the second position.
    const appLevel = layer;
    if (!['major', 'minor', 'patch'].includes(appLevel)) {
      throw new Error('usage: bump app <major|minor|patch>');
    }
    const from = readAppVersion();
    const to = bumpVersion(from, appLevel);
    writeAppVersion(to);
    console.log(`versions: app ${from}→${to}`);
    return;
  }

  const state = load();
  const slot = state.sections[section]?.[layer];
  if (!slot || !['major', 'minor', 'patch'].includes(level)) {
    const keys = SECTIONS.map((s) => s.key).join(', ');
    throw new Error(
      `usage: bump <section> <frontend|backend> <major|minor|patch>\nsections: ${keys}`,
    );
  }
  const at = new Date().toISOString();
  const from = slot.version;
  slot.version = bumpVersion(from ?? '0.0.0', level);
  slot.updatedAt = at;
  state.updatedAt = at;
  state.history = [
    { at, section, layer, from, to: slot.version, files: 0 },
    ...state.history,
  ].slice(0, HISTORY_LIMIT);
  save(state);
  console.log(`versions: ${describe(state.history.slice(0, 1), state)}`);
}

/**
 * Points git at the committed `.githooks/` folder, so the hook travels with
 * the repo instead of living in each clone's private `.git/hooks`. Run by npm's
 * `prepare` on every install — which also happens on Vercel, where there may be
 * no git repo at all, hence the silent failure.
 */
function installHook() {
  try {
    git('config', 'core.hooksPath', '.githooks');
  } catch {
    // Not a git checkout (e.g. a deploy build). Nothing to install.
  }
}

// ---------------------------------------------------------------------------

const [command, ...args] = process.argv.slice(2);

try {
  if (command === 'precommit') precommit();
  else if (command === 'init') init();
  else if (command === 'bump') manualBump(...args);
  else if (command === 'install-hook') installHook();
  else throw new Error('usage: versions.mjs <precommit|init|bump|install-hook>');
} catch (error) {
  if (command === 'precommit') {
    // Never block a commit over bookkeeping.
    console.warn(`versions: skipped (${error.message})`);
  } else {
    console.error(error.message);
    process.exitCode = 1;
  }
}
