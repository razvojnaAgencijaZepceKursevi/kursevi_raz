/**
 * Loads YouTube's IFrame Player API once and hands back its `YT` namespace.
 *
 * `<ModuleVideo>` covers the iframe so a click can never land on YouTube's own
 * chrome (title, logo, "watch on YouTube"), which means play/pause/seek have to
 * be driven from our buttons — and the only way to drive an embed is this API.
 *
 * Browser-only: it injects a `<script>` and reads `window`. Only call it from an
 * effect. Typed by hand for the handful of calls we make, rather than pulling in
 * `@types/youtube` for a namespace we use six methods of.
 */

export const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

export type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
};

type YTPlayerOptions = {
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number; target: YTPlayer }) => void;
    onError?: (event: { data: number }) => void;
  };
};

export type YTNamespace = {
  Player: new (element: HTMLIFrameElement, options: YTPlayerOptions) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loading: Promise<YTNamespace> | null = null;

export function loadYouTubeIframeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;

  loading = new Promise<YTNamespace>((resolve, reject) => {
    // The script announces itself through this one global callback. Chain any
    // existing handler rather than replacing it, in case something else on the
    // page loaded the API first.
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      // Let a later mount try again instead of caching the failure forever.
      loading = null;
      reject(new Error('YouTube IFrame API failed to load'));
    };
    document.head.appendChild(script);
  });

  return loading;
}
