import React from 'react';
import { CssBaseline, ThemeProvider as MuiThemeProvider, createTheme, responsiveFontSizes } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppRouter from './components/router/AppRouter';
import ServiceWorkerUpdater from './components/layout/ServiceWorkerUpdater';
import './App.css';

const AppWithTheme = () => {
  const { mode } = useTheme();
  
  let theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#3f51b5', // Indigo - professional and educational
        light: '#757de8',
        dark: '#002984',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#f50057', // Pink - energetic accent
        light: '#ff5983',
        dark: '#bb002f',
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'light' ? '#f7f9fc' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      success: {
        main: '#4caf50',
      },
      error: {
        main: '#f44336',
      },
      warning: {
        main: '#ff9800',
      },
      info: {
        main: '#2196f3',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 600,
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 500,
      },
      h5: {
        fontWeight: 500,
      },
      h6: {
        fontWeight: 500,
      },
      button: {
        textTransform: 'none', // Avoiding all uppercase buttons for better readability
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8, // Slightly rounded corners for a modern look
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            padding: '8px 16px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.1), 0px 4px 5px 0px rgba(0,0,0,0.07), 0px 1px 10px 0px rgba(0,0,0,0.06)',
          },
        },
      },
    },
  });
  
  theme = responsiveFontSizes(theme); // Make typography responsive

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppRouter />
        <ServiceWorkerUpdater />
      </AuthProvider>
    </MuiThemeProvider>
  );
};

// Wrapped AppWithTheme with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <AppWithTheme />
    </ThemeProvider>
  );
}

export default App;
