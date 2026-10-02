import { notFound } from 'next/navigation';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import ContentCard from '@/components/layout/ContentCard';
import CollapsibleCard from '@/components/layout/CollapsibleCard';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import DetailList from '@/components/data/DetailList';
import { getAuthContext } from '@/lib/auth/guards';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import { SITE } from '@/lib/siteConfig';
import { FEATURES, type FeatureName } from '@/lib/features';
import packageJson from '../../../../../package.json';
import versions from '@/lib/appVersions.json';

export const metadata = { title: 'O aplikaciji' };

/**
 * `/admin/about` — what is deployed: the release, when it last changed, and a
 * frontend and backend version for every section of the app.
 *
 * ## Where the numbers come from
 *
 * `src/lib/appVersions.json`, which the pre-commit hook keeps up to date
 * (`scripts/versions.mjs`; the file→section map is `scripts/version-sections.mjs`).
 * It is imported, so each deployment shows the versions it was built with.
 * The build line (commit, branch, environment) comes from variables Vercel sets
 * on every deployment; locally they are absent and the page says so.
 *
 * ## Admin only
 *
 * The `/admin` shell admits teachers too, so the role is checked here. Nothing
 * on the page is secret, but it is a maintenance screen and a teacher has no
 * use for it — so they get the same 404 as any other page that isn't theirs.
 */

type Slot = { version: string | null; updatedAt: string | null } | null;
type Section = { label: string; description: string; frontend: Slot; backend: Slot };

const sections = Object.entries(versions.sections as Record<string, Section>);
const LAYER_LABEL = { frontend: 'Frontend', backend: 'Backend' } as const;

/**
 * Display names for the feature flags, in the order they are listed.
 *
 * A `Record` over `FeatureName`, so adding a flag without naming it here fails
 * to compile. Worded as plain availability on purpose — the card is for
 * keeping track of what is switched on, not for explaining the mechanism.
 */
const FEATURE_LABELS: Record<FeatureName, string> = {
  catalog: 'Katalog kurseva',
  purchases: 'Kupovine i plaćanje',
  quizzes: 'Kvizovi',
  tasks: 'Zadaci i pregled',
  certificates: 'Certifikati',
  notifications: 'Obavještenja',
  support: 'Podrška',
  blog: 'Blog',
  newsletter: 'Newsletter',
  teachers: 'Predavači',
  themeSwitch: 'Tamni način',
  googleAuth: 'Prijava putem Google naloga',
};

/** How many history entries "Nedavne promjene" shows. */
const RECENT_LIMIT = 20;

/** Declared range → plain version: `^9.2.0` → `9.2.0`. */
function dependencyVersion(name: keyof typeof packageJson.dependencies): string {
  return packageJson.dependencies[name].replace(/^[\^~]/, '');
}

export default async function AboutAppPage() {
  const auth = await getAuthContext();
  if (auth?.profile.role !== 'admin') notFound();

  const commit = process.env.VERCEL_GIT_COMMIT_SHA;
  const branch = process.env.VERCEL_GIT_COMMIT_REF;
  const environment = process.env.VERCEL_ENV ?? 'lokalno';

  return (
    <PageContainer>
      <PageHeader
        title="O aplikaciji"
        description={`Izdanje, verzije po cjelinama i posljednje izmjene platforme ${SITE.name}.`}
      />

      <ContentCard title="Izdanje">
        <DetailList
          items={[
            { label: 'Verzija aplikacije', value: <Mono>{packageJson.version}</Mono> },
            {
              label: 'Posljednja izmjena',
              value: versions.updatedAt
                ? `${formatDateTime(versions.updatedAt)} (${formatRelativeTime(versions.updatedAt)})`
                : '—',
            },
            { label: 'Okruženje', value: environment },
            {
              label: 'Commit',
              value: commit ? (
                <Mono>
                  {commit.slice(0, 7)}
                  {branch ? ` · ${branch}` : ''}
                </Mono>
              ) : (
                'nije dostupno lokalno'
              ),
            },
            {
              label: 'Tehnologije',
              value: `Next.js ${dependencyVersion('next')} · React ${dependencyVersion('react')} · MUI ${dependencyVersion('@mui/material')} · Supabase JS ${dependencyVersion('@supabase/supabase-js')}`,
            },
          ]}
        />
      </ContentCard>

      {/* The three reference sections start collapsed: they are long, and the
          release card above is what most visits are for. */}
      <CollapsibleCard title="Verzije po cjelinama" disablePadding>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cjelina</TableCell>
                <TableCell>{LAYER_LABEL.frontend}</TableCell>
                <TableCell>{LAYER_LABEL.backend}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sections.map(([key, section]) => (
                <TableRow key={key}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {section.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {section.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <VersionCell slot={section.frontend} />
                  </TableCell>
                  <TableCell>
                    <VersionCell slot={section.backend} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CollapsibleCard>

      <CollapsibleCard title="Nedavne promjene" disablePadding>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Vrijeme</TableCell>
                <TableCell>Cjelina</TableCell>
                <TableCell>Sloj</TableCell>
                <TableCell align="center" sx={{ width: 180 }}>
                  Verzija
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {versions.history.slice(0, RECENT_LIMIT).map((entry, index) => {
                const section = versions.sections[
                  entry.section as keyof typeof versions.sections
                ] as Section | undefined;
                return (
                  <TableRow key={`${entry.at}-${entry.section}-${entry.layer}-${index}`}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(entry.at)}</TableCell>
                    <TableCell>{section?.label ?? entry.section}</TableCell>
                    <TableCell>
                      {LAYER_LABEL[entry.layer as keyof typeof LAYER_LABEL] ?? entry.layer}
                    </TableCell>
                    <TableCell sx={{ width: 180 }}>
                      <VersionChange from={entry.from} to={entry.to} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CollapsibleCard>

      <CollapsibleCard title="Dostupnost" disablePadding>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cjelina</TableCell>
                <TableCell align="center" sx={{ width: 120 }}>
                  Aktivno
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(Object.keys(FEATURE_LABELS) as FeatureName[]).map((feature) => (
                <TableRow key={feature}>
                  <TableCell>{FEATURE_LABELS[feature]}</TableCell>
                  <TableCell align="center">
                    {FEATURES[feature] ? (
                      <CheckCircleOutlinedIcon
                        color="success"
                        fontSize="small"
                        titleAccess="Da"
                        sx={{ verticalAlign: 'middle' }}
                      />
                    ) : (
                      <HighlightOffIcon
                        color="disabled"
                        fontSize="small"
                        titleAccess="Ne"
                        sx={{ verticalAlign: 'middle' }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CollapsibleCard>
    </PageContainer>
  );
}

/** A version number and when it last moved; "—" for a layer the section doesn't have. */
function VersionCell({ slot }: { slot: Slot }) {
  if (!slot?.version) {
    return (
      <Typography variant="body2" color="text.disabled">
        —
      </Typography>
    );
  }
  return (
    <Stack spacing={0.25} sx={{ alignItems: 'flex-start' }}>
      <Chip label={`v${slot.version}`} size="small" variant="outlined" sx={{ fontFamily: MONO }} />
      <Typography variant="caption" color="text.secondary">
        {formatRelativeTime(slot.updatedAt)}
      </Typography>
    </Stack>
  );
}

/**
 * `1.2.0 → 1.3.0` with the arrow in the same place on every row.
 *
 * Version strings differ in width (`1.9.9` vs `1.10.0`, or `—` for a new
 * section), so plain inline text drifts the arrow left and right down the
 * column. Two equal flexible tracks either side of it keep it centred: the old
 * version hugs the arrow from the left, the new one from the right.
 */
function VersionChange({ from, to }: { from: string | null; to: string }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        columnGap: 1,
        alignItems: 'center',
        fontFamily: MONO,
        whiteSpace: 'nowrap',
      }}
    >
      <Box sx={{ textAlign: 'right' }}>{from ?? '—'}</Box>
      <Box aria-hidden sx={{ color: 'text.secondary' }}>
        →
      </Box>
      <Box>{to}</Box>
    </Box>
  );
}

const MONO = 'var(--font-geist-mono), ui-monospace, monospace';

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <Box component="span" sx={{ fontFamily: MONO }}>
      {children}
    </Box>
  );
}
