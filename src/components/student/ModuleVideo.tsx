'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { parseYouTubeUrl, youtubeEmbedUrl } from '@/lib/youtube';

/**
 * The module's video, embedded from YouTube.
 *
 * ## The src is rebuilt, never passed through
 *
 * The stored link is parsed and only the video id (and a start time) survive
 * into the iframe — see `youtubeEmbedUrl`. A stored URL is author input, and
 * putting it straight into `src` would embed whatever it pointed at.
 *
 * ## Fewest ways out, within what an embed can do
 *
 * Privacy-enhanced host, no off-channel suggestions, minimal branding, and an
 * `allow` list of only what playback needs. `allowFullScreen` stays: fullscreen
 * keeps the viewer on this page, so it costs nothing in containment and a
 * lesson video without it is simply worse to watch. Controls stay on for the
 * same reason — hiding them makes the video harder to watch without making it
 * harder to find, since the id is in the src regardless. That is the honest
 * limit of any embed: anyone determined can open the video on YouTube.
 *
 * ## Old links
 *
 * Rows written before the YouTube rule (Vimeo links, typos) are still stored.
 * They fail to parse and get a notice instead of the player — never a crash,
 * and never a blank black rectangle that reads as "the video is broken".
 *
 * Access is not decided here. This only renders for a viewer who already
 * received `video_url`, and that field comes from
 * `GET /api/courses/:id/modules`, which runs `assertCourseAccess` first.
 */
export default function ModuleVideo({ url, title }: { url: string; title: string }) {
  const video = parseYouTubeUrl(url);

  if (!video) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Video za ovaj modul trenutno nije dostupan. Predavač treba da ga zamijeni ispravnim YouTube
        linkom.
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
        src={youtubeEmbedUrl(video)}
        title={`Video: ${title}`}
        allow="encrypted-media; picture-in-picture"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
      />
    </Box>
  );
}
