/**
 * The horizontal breathing room `(marketing)/layout.tsx` puts around every
 * public page — and the exact negative of it.
 *
 * ## Why this is a shared constant rather than two literals
 *
 * The layout pads `<main>` on all sides so ordinary pages (the catalogue, the
 * blog, a legal document) are never flush against the viewport edge. The
 * landing page is the one page that wants the opposite: its hero, its stats
 * strip and its closing banner are **full-width bands**, and a band with a
 * 32px white margin around it reads as a mistake rather than a decision.
 *
 * `<Section>` cancels the padding with a negative margin. That only works while
 * the two numbers agree, so they are written once, here, and imported by both.
 * Change the gutter and the bands follow.
 *
 * Values are MUI spacing units (×8px), given per breakpoint.
 */
export const MARKETING_GUTTER = { xs: 2, sm: 3, lg: 4 } as const;

/** The exact negative of {@link MARKETING_GUTTER}. */
export const MARKETING_BLEED = { xs: -2, sm: -3, lg: -4 } as const;
