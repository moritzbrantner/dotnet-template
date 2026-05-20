import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f766e',
      light: '#5eead4',
      dark: '#134e4a',
    },
    secondary: {
      main: '#ea580c',
      light: '#fdba74',
      dark: '#9a3412',
    },
    background: {
      default: '#f6f1e8',
      paper: 'rgba(255, 255, 255, 0.84)',
    },
    text: {
      primary: '#17212b',
      secondary: '#51606d',
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
    h3: {
      fontFamily: '"Iowan Old Style", "Palatino Linotype", serif',
      fontWeight: 700,
    },
    h4: {
      fontFamily: '"Iowan Old Style", "Palatino Linotype", serif',
      fontWeight: 700,
    },
    h5: {
      fontFamily: '"Iowan Old Style", "Palatino Linotype", serif',
      fontWeight: 700,
    },
    h6: {
      fontFamily: '"Iowan Old Style", "Palatino Linotype", serif',
      fontWeight: 700,
    },
    overline: {
      fontSize: '0.72rem',
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top left, rgba(255, 125, 95, 0.18), transparent 24%), radial-gradient(circle at bottom right, rgba(15, 118, 110, 0.18), transparent 22%), linear-gradient(135deg, #f6efe5 0%, #e8f0f2 48%, #eef4ef 100%)',
        },
        '#root': {
          minHeight: '100vh',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(23, 33, 43, 0.08)',
          boxShadow: '0 24px 56px rgba(17, 32, 45, 0.08)',
        },
      },
    },
  },
})
