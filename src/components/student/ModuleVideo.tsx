'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { vimeoEmbedUrl } from '@/lib/vimeo';

/**
 * The module's video, embedded from Vimeo.
 *
 * `video_url` is a plain URL column, so a mistyped or non-Vimeo link is
 * possible. When it can't be parsed the component says so plainly instead of
 * rendering an empty black rectangle — a silent blank is the failure mode that
 * gets reported as "the video doesn't work" with nothing to go on.
 *
 * `allowFullScreen` is deliberate; `allow` lists only what the player genuinely
 * needs, so the iframe gets no more capability than that.
 */
export default function ModuleVideo({ url }: { url: string }) {
  const embedUrl = vimeoEmbedUrl(url);

  if (!embedUrl) {
    return (
      <Alert severity="warning">
        Video link nije prepoznat kao Vimeo adresa, pa se ne može prikazati. Proverite link u
        podešavanjima modula.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        bgcolor: 'common.black',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        component="iframe"
        src={embedUrl}
        title="Video lekcija"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
      />
    </Box>
  );
}
