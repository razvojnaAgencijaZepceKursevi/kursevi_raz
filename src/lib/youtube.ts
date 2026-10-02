/**
 * Reading a YouTube link, and turning it into the one embed URL we serve.
 *
 * `modules.video_url` is a free-text column, so this is the only thing standing
 * between whatever an author pastes and an `<iframe src>`. It is deliberately
 * strict: parsed with the URL API (never by regex over the raw string), a fixed
 * list of hosts, and an id that must match YouTube's 11-character alphabet
 * exactly. Anything else is "not a video", not "a video we do our best with".
 *
 * Shared by three callers, so they cannot disagree about what is valid:
 *
 *   - the module form (`module-form.schema.ts`) — rejects on input;
 *   - the API (`modules.schema.ts`) — rejects on write, the real boundary;
 *   - `<ModuleVideo>` — re-parses on read, because rows written before this
 *     rule (the Vimeo era) still exist and must render a fallback, not crash.
 *
 * ## The stored URL never reaches the iframe
 *
 * `youtubeEmbedUrl` takes the *parsed* video, not the string, and builds the
 * src from the id alone. Whatever else the stored link carried — a playlist, a
 * tracking parameter, a different host — is dropped on the floor. That is what
 * makes the embed safe to render from author-supplied data.
 *
 * Plain functions with no dependencies, so it is safe in the browser bundle and
 * in route handlers alike.
 */

export type YouTubeVideo = {
  /** Exactly 11 characters of `[A-Za-z0-9_-]`. */
  id: string;
  /** Start offset in whole seconds, when the link carried a valid one. */
  start?: number;
};

/**
 * The only hosts accepted. Exact matches, not suffixes — a suffix test would
 * let `evil-youtube.com` or `youtube.com.example.org` through.
 */
const ALLOWED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
]);

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Path prefixes on youtube.com whose next segment is the video id. */
const ID_PATH_PREFIXES = new Set(['embed', 'shorts', 'live', 'v']);

/** The error shown for a rejected link. One wording, everywhere. */
export const INVALID_YOUTUBE_MESSAGE = 'Not a valid YouTube link';

export function parseYouTubeUrl(input: string | null | undefined): YouTubeVideo | null {
  if (!input) return null;

  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  // `javascript:`, `data:` and friends parse as URLs too; only the web counts.
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  // Credentials in a link are never legitimate here and are a classic way to
  // make one host look like another (`https://youtube.com@evil.example/`).
  if (url.username || url.password) return null;

  const host = url.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) return null;

  const segments = url.pathname.split('/').filter(Boolean);

  let candidate: string | null | undefined;
  if (host === 'youtu.be') {
    // https://youtu.be/ID
    candidate = segments.length === 1 ? segments[0] : undefined;
  } else if (segments.length === 1 && segments[0] === 'watch') {
    // https://www.youtube.com/watch?v=ID
    candidate = url.searchParams.get('v');
  } else if (segments.length === 2 && ID_PATH_PREFIXES.has(segments[0])) {
    // /embed/ID, /shorts/ID, /live/ID, /v/ID
    candidate = segments[1];
  }

  if (!candidate || !VIDEO_ID.test(candidate)) return null;

  const start = parseStartTime(url.searchParams.get('t') ?? url.searchParams.get('start'));
  return start ? { id: candidate, start } : { id: candidate };
}

export function isValidYouTubeUrl(input: string | null | undefined): boolean {
  return parseYouTubeUrl(input) !== null;
}

/**
 * `t=90`, `t=90s`, `t=1m30s`, `t=1h2m3s` → seconds.
 *
 * An unreadable start time does not invalidate the link — the video is still
 * the right one, it just plays from the beginning. Zero is treated as absent.
 */
function parseStartTime(raw: string | null): number | undefined {
  if (!raw) return undefined;

  const plain = /^(\d{1,6})s?$/.exec(raw);
  if (plain) return Number(plain[1]) || undefined;

  const parts = /^(?:(\d{1,3})h)?(?:(\d{1,4})m)?(?:(\d{1,6})s)?$/.exec(raw);
  if (!parts) return undefined;

  const [, h = '0', m = '0', s = '0'] = parts;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) || undefined;
}

/**
 * The iframe src, built from the parsed id and nothing else.
 *
 * - `youtube-nocookie.com`: privacy-enhanced mode, no cookies until play.
 * - `rel=0`: end-of-video suggestions stay on the same channel rather than
 *   leading off into YouTube.
 * - `playsinline=1`: iOS plays inline instead of jumping to the native
 *   fullscreen player.
 * - `controls=0`, `fs=0`, `disablekb=1`, `iv_load_policy=3`: none of YouTube's
 *   own controls, keyboard shortcuts or annotations. `<ModuleVideo>` lays a
 *   click-catching overlay over the iframe and supplies its own controls, so
 *   YouTube's would be unreachable anyway.
 * - `enablejsapi=1` + `origin`: lets the IFrame Player API drive the embed, and
 *   tells YouTube which page may do so.
 *
 * This keeps a student from *clicking* through to YouTube. It does not hide
 * the video: the id is in this src, readable by anyone who opens devtools.
 */
export function youtubeEmbedUrl(video: YouTubeVideo, origin: string): string {
  const params = new URLSearchParams({
    rel: '0',
    playsinline: '1',
    controls: '0',
    fs: '0',
    disablekb: '1',
    iv_load_policy: '3',
    enablejsapi: '1',
    origin,
  });
  if (video.start) params.set('start', String(video.start));
  return `https://www.youtube-nocookie.com/embed/${video.id}?${params.toString()}`;
}

/** The poster shown over the player before the first play and after the end. */
export function youtubeThumbnailUrl(video: YouTubeVideo): string {
  return `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
}
