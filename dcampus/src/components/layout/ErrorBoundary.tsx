import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// A wrapper for the translation function to use in class component
const withTranslation = (Component: any) => {
  return function WrappedComponent(props: any) {
    const { t } = useTranslation();
    return <Component {...props} t={t} />;
  };
};

class ErrorBoundary extends Component<Props & { t: any }, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // You can log the error to an error reporting service here
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    const { t } = this.props;
    
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 2,
              textAlign: 'center',
              backgroundColor: (theme) => 
                theme.palette.mode === 'light' ? 'rgba(255, 235, 235, 0.6)' : 'rgba(80, 0, 0, 0.4)'
            }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="h3" component="h1" gutterBottom color="error">
                {t('errors.oops')}
              </Typography>
              <Typography variant="h5" component="h2" gutterBottom>
                {t('errors.somethingWentWrong')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                {t('errors.tryAgainLater')}
              </Typography>
            </Box>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ 
                mb: 4, 
                p: 2, 
                backgroundColor: 'rgba(0, 0, 0, 0.05)', 
                borderRadius: 1,
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Error details (only visible in development):
                </Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={this.handleReload}
              >
                {t('errors.reload')}
              </Button>
              <Button 
                variant="outlined" 
                onClick={this.handleGoHome}
              >
                {t('errors.goToHomepage')}
              </Button>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default withTranslation(ErrorBoundary);