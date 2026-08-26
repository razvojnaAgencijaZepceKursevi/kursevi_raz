'use client';

import * as React from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ErrorState from '@/components/feedback/ErrorState';

/**
 * Renders a PDF page-by-page onto a canvas.
 *
 * ## Why canvas and not `<iframe>` / `<embed>`
 *
 * Both of those hand the file to the browser's built-in PDF plugin, which comes
 * with its own download and print buttons. The whole point of showing materials
 * in-app is that the student reads them as part of the page rather than opening
 * a file, so the viewer has to be one we draw ourselves.
 *
 * To be clear about what this does and does not achieve: the bytes are on the
 * machine either way — that is what rendering means. This removes the one-click
 * save affordance and keeps the reading experience inside the app. It is not a
 * security control, and nothing client-side could be. See the note in
 * `/api/module-files/[id]/content` for the other half of the reasoning.
 *
 * Deliberately **not** done: blocking right-click or keyboard shortcuts. It
 * stops nobody, and it breaks normal browser behaviour and accessibility for
 * everyone else.
 *
 * ## Loading pdf.js
 *
 * The library is imported dynamically inside an effect, for two reasons: it is
 * large, and it touches browser globals at module scope, so it must never be
 * pulled into a server render. The worker is resolved from the same package via
 * `new URL(..., import.meta.url)`, which the bundler rewrites to a real asset
 * URL — no file copied into `public/`, nothing to keep in sync on upgrade.
 */
export default function PdfViewer({ src, title }: { src: string; title?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Held in a ref, not state: it is a mutable handle, and putting it in state
  // would re-render on every page change for no visual reason.
  const docRef = React.useRef<{
    numPages: number;
    getPage: (n: number) => Promise<unknown>;
  } | null>(null);

  const [pageCount, setPageCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [zoom, setZoom] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown>(null);

  // --- Load the document -----------------------------------------------------
  React.useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => void } | null = null;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const pdfjs = await import('pdfjs-dist');

        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();

        // `withCredentials` so the session cookie reaches our proxy route —
        // without it the request is anonymous and comes back 401.
        const task = pdfjs.getDocument({ url: src, withCredentials: true });
        loadingTask = task;

        const doc = await task.promise;
        if (cancelled) return;

        docRef.current = doc as unknown as typeof docRef.current;
        setPageCount(doc.numPages);
        setPage(1);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      // Abort an in-flight fetch and free the worker when the material changes
      // or the viewer unmounts.
      loadingTask?.destroy();
      docRef.current = null;
    };
  }, [src]);

  // --- Render the current page ----------------------------------------------
  React.useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;

    async function render() {
      const doc = docRef.current;
      const canvas = canvasRef.current;
      if (!doc || !canvas || pageCount === 0) return;

      const pdfPage = (await doc.getPage(page)) as {
        getViewport: (o: { scale: number }) => { width: number; height: number };
        render: (o: unknown) => { promise: Promise<void>; cancel: () => void };
      };
      if (cancelled) return;

      // Fit the page to the container, then apply the user's zoom on top, so
      // the default view is "readable" rather than an arbitrary scale.
      const available = containerRef.current?.clientWidth ?? 800;
      const base = pdfPage.getViewport({ scale: 1 });
      const scale = ((available - 8) / base.width) * zoom;
      const viewport = pdfPage.getViewport({ scale });

      // Draw at device resolution so text is not blurry on high-DPI screens,
      // while CSS keeps the element at layout size.
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const context = canvas.getContext('2d');
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const task = pdfPage.render({ canvasContext: context, viewport, canvas });
      renderTask = task;

      try {
        await task.promise;
      } catch {
        // A cancelled render is normal when paging quickly; nothing to report.
      }
    }

    void render();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [page, zoom, pageCount]);

  if (error) {
    return <ErrorState error={error} title="Materijal nije moguće prikazati" />;
  }

  return (
    <Stack>
      {loading ? <LinearProgress /> : null}

      <Box
        ref={containerRef}
        sx={{
          bgcolor: 'action.hover',
          display: 'flex',
          justifyContent: 'center',
          p: 0.5,
          minHeight: 320,
          overflow: 'auto',
        }}
      >
        <canvas ref={canvasRef} aria-label={title ?? 'PDF materijal'} />
      </Box>

      <Divider />

      <Stack
        direction="row"
        spacing={1}
        sx={{ px: 2, py: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <IconButton
          size="small"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || pageCount === 0}
          aria-label="Prethodna strana"
        >
          <ChevronLeftIcon />
        </IconButton>

        <Typography variant="body2" sx={{ minWidth: 96, textAlign: 'center' }}>
          {pageCount === 0 ? '—' : `${page} / ${pageCount}`}
        </Typography>

        <IconButton
          size="small"
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          disabled={page >= pageCount || pageCount === 0}
          aria-label="Sledeća strana"
        >
          <ChevronRightIcon />
        </IconButton>

        <Box sx={{ width: 16 }} />

        <IconButton
          size="small"
          onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
          disabled={zoom <= 0.5}
          aria-label="Umanji"
        >
          <ZoomOutIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))}
          disabled={zoom >= 3}
          aria-label="Uvećaj"
        >
          <ZoomInIcon />
        </IconButton>
      </Stack>
    </Stack>
  );
}
