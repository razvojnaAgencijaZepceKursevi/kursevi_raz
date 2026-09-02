'use client';

import * as React from 'react';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import { useMyPreferences, useUpdatePreferences } from '@/hooks/usePreferences';
import { errorMessage } from '@/lib/api/errorMessage';
import { toast } from '@/store/useToastStore';
import type { ThemePreference } from '@/lib/schemas/preferences.schema';

const OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Svijetla', icon: <LightModeOutlinedIcon fontSize="small" /> },
  { value: 'dark', label: 'Tamna', icon: <DarkModeOutlinedIcon fontSize="small" /> },
  {
    value: 'system',
    label: 'Kao sistem',
    icon: <SettingsBrightnessOutlinedIcon fontSize="small" />,
  },
];

/**
 * Colour scheme picker.
 *
 * ## Applies first, saves second
 *
 * `setMode` repaints immediately and writes MUI's localStorage entry; the
 * request to `/api/preferences` follows. A theme switch that waited for a round
 * trip would feel broken on a slow connection, and the local write is what
 * makes the choice survive a reload even if the request fails.
 *
 * If the save does fail the UI deliberately keeps the new scheme rather than
 * snapping back — the user's click was honoured on this device, and the toast
 * says the *saving* is what did not work.
 *
 * ## The undefined window
 *
 * `useColorScheme` returns `mode: undefined` on the server and on the first
 * client render, before MUI has read localStorage. Falling back to the stored
 * preference (and then to `system`) covers that window, and because both are
 * undefined during SSR the server and client agree on the first render — so
 * there is no hydration mismatch and no need to track mounting.
 */
export default function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  const preferences = useMyPreferences();
  const update = useUpdatePreferences();

  async function choose(next: ThemePreference) {
    setMode(next);
    try {
      await update.mutateAsync({ theme: next });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  // Prefer what is actually applied; fall back to the stored value while MUI
  // has not yet read storage.
  const current = mode ?? preferences.data?.theme ?? 'system';

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={current}
        onChange={(_event, next: ThemePreference | null) => {
          // `null` arrives when the active button is clicked again; keeping the
          // current choice beats dropping to none.
          if (next) void choose(next);
        }}
        sx={{ flexWrap: 'wrap' }}
      >
        {OPTIONS.map((option) => (
          <ToggleButton key={option.value} value={option.value} sx={{ gap: 1, px: 2 }}>
            {option.icon}
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Typography variant="body2" color="text.secondary">
        „Kao sistem” prati postavku vašeg uređaja. Izbor se pamti i na drugim uređajima na kojima se
        prijavite.
      </Typography>
    </Stack>
  );
}
