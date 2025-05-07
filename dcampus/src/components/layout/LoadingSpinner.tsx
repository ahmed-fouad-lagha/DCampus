import React, { memo } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  fullPage?: boolean;
  light?: boolean; // New prop for a lighter version
}

// Memoize the component to prevent unnecessary re-renders
const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({
  size = 40,
  message,
  fullPage = false,
  light = false
}) => {
  const { t } = useTranslation();
  const displayMessage = message || t('common.loading');

  // Lighter version with optimized rendering
  if (light) {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
        <CircularProgress 
          size={size} 
          sx={{ 
            color: theme => theme.palette.mode === 'light' ? 'primary.main' : 'primary.light',
            opacity: 0.8
          }}
          thickness={3}
        />
      </Box>
    );
  }

  const content = (
    <>
      <CircularProgress 
        size={size} 
        thickness={4}
      />
      {displayMessage && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mt: 2 }}
        >
          {displayMessage}
        </Typography>
      )}
    </>
  );

  if (fullPage) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100%'
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      {content}
    </Box>
  );
});

export default LoadingSpinner;