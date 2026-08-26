/**
 * Turning a Vimeo link into an embeddable player URL.
 *
 * `modules.video_url` is a free-text URL column — the database does not know it
 * is Vimeo — so an admin can paste any of the shapes Vimeo hands out. Rather
 * than demand one exact format, this reads the id out of the common ones:
 *
 *   https://vimeo.com/123456789
 *   https://vimeo.com/123456789/abc123def            ← unlisted, needs the hash
 *   https://player.vimeo.com/video/123456789?h=abc123def
 *   https://vimeo.com/channels/staffpicks/123456789
 *   https://vimeo.com/groups/name/videos/123456789
 *
 * The unlisted form is the one worth care: those videos only play when the
 * privacy hash travels with the id as `?h=`. Dropping it produces an embed that
 * loads and then refuses to play, which looks like a broken video rather than a
 * missing parameter.
 */
export type VimeoVideo = { id: string; hash?: string };

const NUMERIC = /^\d+$/;

export function parseVimeoUrl(url: string | null | undefined): VimeoVideo | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  if (!/(^|\.)vimeo\.com$/i.test(parsed.hostname)) return null;

  // `/video/123` (player URLs) and `/channels/x/123` both end with the id, so
  // walking the segments finds it without a pattern per URL shape.
  const segments = parsed.pathname.split('/').filter(Boolean);
  const idIndex = segments.findIndex((segment) => NUMERIC.test(segment));
  if (idIndex === -1) return null;

  const id = segments[idIndex];

  // The hash is either the segment straight after the id (`/123/abc`) or the
  // `h` query parameter (player URLs put it there).
  const next = segments[idIndex + 1];
  const hash = parsed.searchParams.get('h') ?? (next && !NUMERIC.test(next) ? next : undefined);

  return hash ? { id, hash } : { id };
}

/** Player URL for an `<iframe>`, or null when the link isn't a Vimeo one. */
export function vimeoEmbedUrl(url: string | null | undefined): string | null {
  const video = parseVimeoUrl(url);
  if (!video) return null;

  const params = new URLSearchParams();
  if (video.hash) params.set('h', video.hash);
  // Vimeo's own chrome, minus the parts that lead away from the lesson.
  params.set('title', '0');
  params.set('byline', '0');
  params.set('portrait', '0');
  params.set('dnt', '1');

  return `https://player.vimeo.com/video/${video.id}?${params.toString()}`;
}
