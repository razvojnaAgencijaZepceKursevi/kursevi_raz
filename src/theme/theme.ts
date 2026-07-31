import { createTheme } from '@mui/material/styles';

/**
 * Central MUI theme. Pages are built manually on top of this, so keep the
 * palette/typography decisions here rather than scattering `sx` overrides.
 */
export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: '#2f5bea' },
    secondary: { main: '#7b3fe4' },
    success: { main: '#1f9d55' },
    warning: { main: '#c98a00' },
    error: { main: '#d63c3c' },
    background: { default: '#f7f8fa', paper: '#ffffff' },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), Arial, Helvetica, sans-serif',
    h1: { fontSize: '2.25rem', fontWeight: 700 },
    h2: { fontSize: '1.75rem', fontWeight: 700 },
    h3: { fontSize: '1.375rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiTextField: {
      defaultProps: { size: 'small', fullWidth: true },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});

export default theme;
