'use client';

import ContentCard from '@/components/layout/ContentCard';
import ThemeToggle from '@/components/settings/ThemeToggle';

/**
 * Colour scheme.
 *
 * The whole section is one control, which is why there is no Save button: the
 * choice applies the moment it is made and saves behind that. See
 * `<ThemeToggle>` for the two-layer arrangement (localStorage for immediacy,
 * `user_preferences.theme` so it follows the user to another device).
 */
export default function AppearanceSettingsPage() {
  return (
    <ContentCard title="Tema" description="Kako aplikacija izgleda na ovom i drugim uređajima.">
      <ThemeToggle />
    </ContentCard>
  );
}
