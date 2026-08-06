import { createTheme, alpha } from '@mui/material/styles';

/**
 * Central MUI theme. Pages are built manually on top of this, so keep the
 * palette/typography/component decisions here rather than scattering `sx`
 * overrides.
 *
 * Design direction: flat and bordered rather than shadow-heavy, sharp/minimal
 * radii, generous spacing, tightened heading letter-spacing, ripple disabled
 * in favor of instant color-shift hover/focus states. The goal is a look
 * that doesn't read as "default MUI" on first glance.
 */
export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: {
      palette: {
        mode: 'light',
        primary: { main: '#2f5bea', contrastText: '#ffffff' },
        secondary: { main: '#7b3fe4', contrastText: '#ffffff' },
        success: { main: '#1f9d55' },
        warning: { main: '#c98a00' },
        error: { main: '#d63c3c' },
        background: { default: '#f7f8fa', paper: '#ffffff' },
        text: { primary: '#14161a', secondary: '#5a5f6b' },
        divider: '#e2e4e9',
      },
    },
    dark: {
      palette: {
        mode: 'dark',
        primary: { main: '#6d8dff', contrastText: '#0b0d12' },
        secondary: { main: '#a479ff', contrastText: '#0b0d12' },
        success: { main: '#3fc978' },
        warning: { main: '#e0a838' },
        error: { main: '#ea6363' },
        background: { default: '#0e0f13', paper: '#15171d' },
        text: { primary: '#f2f3f5', secondary: '#a3a8b4' },
        divider: '#2a2d35',
      },
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), Arial, Helvetica, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 },
    h2: { fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.2 },
    h3: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.25 },
    h4: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.005em' },
    h5: { fontSize: '1.0625rem', fontWeight: 600 },
    h6: { fontSize: '0.9375rem', fontWeight: 600 },
    subtitle1: {
      fontSize: '0.9375rem',
      fontWeight: 500,
      color: 'var(--mui-palette-text-secondary)',
    },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8437rem', lineHeight: 1.55 },
    overline: { fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.6875rem' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.005em' },
  },
  shape: { borderRadius: 6 },
  spacing: 8,
  shadows: [
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    '0 2px 12px rgba(15, 17, 21, 0.08)',
    '0 2px 12px rgba(15, 17, 21, 0.08)',
    '0 4px 20px rgba(15, 17, 21, 0.10)',
    '0 4px 20px rgba(15, 17, 21, 0.10)',
    '0 4px 20px rgba(15, 17, 21, 0.10)',
    '0 4px 20px rgba(15, 17, 21, 0.10)',
    '0 8px 28px rgba(15, 17, 21, 0.12)',
    '0 8px 28px rgba(15, 17, 21, 0.12)',
    '0 8px 28px rgba(15, 17, 21, 0.12)',
    '0 8px 28px rgba(15, 17, 21, 0.12)',
    '0 8px 28px rgba(15, 17, 21, 0.12)',
    '0 8px 28px rgba(15, 17, 21, 0.12)',
    '0 8px 28px rgba(15, 17, 21, 0.12)',
    '0 8px 28px rgba(15, 17, 21, 0.12)',
    '0 8px 28px rgba(15, 17, 21, 0.12)',
    '0 8px 28px rgba(15, 17, 21, 0.12)',
    '0 8px 28px rgba(15, 17, 21, 0.12)',
    '0 8px 28px rgba(15, 17, 21, 0.12)',
    '0 8px 28px rgba(15, 17, 21, 0.12)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: (themeParam) => ({
        '::selection': {
          backgroundColor: alpha(themeParam.palette.primary.main, 0.25),
        },
        '::-webkit-scrollbar': { width: 10, height: 10 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': {
          background: themeParam.palette.divider,
          borderRadius: 8,
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: themeParam.palette.text.secondary,
          backgroundClip: 'padding-box',
        },
      }),
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 6,
          paddingInline: 20,
          paddingBlock: 10,
          transition: 'background-color 120ms ease, border-color 120ms ease, color 120ms ease',
        },
        sizeSmall: { paddingInline: 14, paddingBlock: 6 },
        sizeLarge: { paddingInline: 26, paddingBlock: 13 },
        contained: {
          '&:hover': { boxShadow: 'none', filter: 'brightness(0.92)' },
          '&:active': { filter: 'brightness(0.85)' },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': { borderWidth: 1.5 },
        },
        text: {
          '&:hover': { backgroundColor: 'var(--mui-palette-action-hover)' },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', fullWidth: true },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          transition: 'border-color 120ms ease, box-shadow 120ms ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1.5,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--mui-palette-text-secondary)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
        input: { paddingBlock: 11 },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid var(--mui-palette-divider)',
        },
        elevation1: { boxShadow: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid var(--mui-palette-divider)',
          boxShadow: 'none',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': { paddingBottom: 24 },
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderBottom: '1px solid var(--mui-palette-divider)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          height: 28,
        },
        label: { paddingInline: 10 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'var(--mui-palette-divider)',
          paddingBlock: 14,
        },
        head: {
          fontWeight: 700,
          fontSize: '0.75rem',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          color: 'var(--mui-palette-text-secondary)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'var(--mui-palette-divider)' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '6px 10px',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          border: '1px solid var(--mui-palette-divider)',
          boxShadow: '0 8px 28px rgba(15, 17, 21, 0.12)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          marginInline: 6,
          paddingBlock: 9,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          border: '1px solid var(--mui-palette-divider)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 6, border: '1px solid transparent' },
      },
    },
  },
});

export default theme;
