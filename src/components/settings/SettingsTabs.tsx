'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

/**
 * The section switcher for `/settings`.
 *
 * ## Links, not local state
 *
 * Each tab is a real `<Tab component={NextLink} href>`, so every section keeps
 * its own URL and stays bookmarkable, linkable and reachable by the back
 * button. Client-side tab state would collapse the three into one address and
 * lose that — the same reasoning that split the student dashboard into pages
 * rather than sections of one screen.
 *
 * What was messy was the *navigation*, not the URLs: two separate entries in
 * the account menu for what is obviously one screen. One entry now, three tabs
 * under it.
 *
 * `Tab` is not `MenuItem` — it has no `'li'` root override, so the theme's
 * global `LinkComponent` would cover it. It is written out anyway because this
 * is a Client Component and being explicit here costs nothing; see `theme.ts`
 * for why the distinction matters.
 */
const SECTIONS = [
  { href: '/settings/notifications', label: 'Obavještenja' },
  { href: '/settings/newsletter', label: 'Newsletter' },
  { href: '/settings/appearance', label: 'Izgled' },
];

export default function SettingsTabs() {
  const pathname = usePathname();

  /*
   * Match by prefix rather than equality so a future nested route
   * (`/settings/appearance/something`) keeps its tab lit. Falls back to the
   * first tab so MUI never gets a `value` that matches no child — which logs a
   * warning and renders every tab unselected.
   */
  const current = SECTIONS.find((s) => pathname.startsWith(s.href))?.href ?? SECTIONS[0].href;

  return (
    <Tabs
      value={current}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      {SECTIONS.map((section) => (
        <Tab
          key={section.href}
          value={section.href}
          label={section.label}
          component={NextLink}
          href={section.href}
        />
      ))}
    </Tabs>
  );
}
