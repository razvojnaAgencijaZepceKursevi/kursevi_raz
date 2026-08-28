'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import MarkdownContent from './MarkdownContent';
import '@uiw/react-md-editor/markdown-editor.css';

/**
 * A Markdown editor with a toolbar, for people who do not know Markdown.
 *
 * ## What it stores
 *
 * Raw Markdown, always. The toolbar inserts syntax into the text rather than
 * maintaining a separate document model, so `value` is exactly what goes into
 * the database and exactly what `<MarkdownContent>` renders. Nothing is
 * converted on the way in or out.
 *
 * That is why this is a Markdown editor and not a WYSIWYG one: a rich-text
 * editor like TipTap is HTML-native, so storing Markdown would mean converting
 * both ways and losing fidelity on every round trip. Keeping the stored form
 * portable also matters because the blog is earmarked to move to `.md` files on
 * disk if it grows.
 *
 * ## The preview is ours, not the library's
 *
 * `components.preview` overrides `@uiw/react-md-editor`'s built-in renderer
 * with `<MarkdownContent>` — the same component the blog and the legal pages
 * use. So the preview pane is not an approximation of the published page, it is
 * the published page's own code path.
 *
 * Two things follow. An author cannot be misled by a preview that styles things
 * differently from the live site. And the library's renderer, which allows raw
 * HTML by default and would need `rehype-sanitize` bolted on, never runs at
 * all — the security question is answered by not having a second renderer
 * rather than by configuring one.
 *
 * ## Why the dynamic import
 *
 * The editor touches `window` at module scope, so it must never reach a server
 * render. `ssr: false` is required, not a bundle-size optimisation — without it
 * the page 500s on the server.
 */
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={420} />,
});

export default function MarkdownEditor({
  value,
  onChange,
  disabled = false,
  height = 460,
  helperText,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  height?: number;
  helperText?: string;
}) {
  const { mode, systemMode } = useColorScheme();

  /*
   * The library themes itself from a `data-color-mode` attribute rather than
   * from our theme, so it has to be told. `mode` is `'system'` when the user
   * has not chosen explicitly, and `systemMode` is what that resolves to;
   * without the fallback the editor would render light-on-light for anyone on
   * a dark OS.
   */
  const colorMode = (mode === 'system' ? systemMode : mode) ?? 'light';

  return (
    <Box>
      <Box
        data-color-mode={colorMode}
        sx={{
          // Match the app's inputs rather than the library's own chrome.
          '& .w-md-editor': {
            borderRadius: 1.5,
            border: 1,
            borderColor: 'divider',
            boxShadow: 'none',
            backgroundColor: 'background.paper',
          },
          '& .w-md-editor-toolbar': {
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            backgroundColor: 'action.hover',
          },
          // The preview pane is our own renderer, so strip the library's
          // typography reset and let MUI's styles through untouched.
          '& .w-md-editor-preview': { boxShadow: 'none', padding: 16 },
          '& .wmde-markdown': { background: 'transparent', fontFamily: 'inherit' },
          ...(disabled ? { opacity: 0.6, pointerEvents: 'none' } : null),
        }}
      >
        <MDEditor
          value={value}
          // The library hands back `string | undefined`; an empty document is
          // `''`, not "no value", and passing undefined upward would make the
          // field look uncontrolled.
          onChange={(next) => onChange(next ?? '')}
          height={height}
          // Toolbar + editor + live preview, which is the arrangement that
          // makes this usable without knowing the syntax.
          preview="live"
          components={{
            preview: (source) => <MarkdownContent content={source} />,
          }}
          textareaProps={{ disabled }}
        />
      </Box>

      {helperText ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {helperText}
        </Typography>
      ) : null}
    </Box>
  );
}
