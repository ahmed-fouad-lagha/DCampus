import React from 'react';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 2 
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
          
          <Typography variant="h2" component="h1" gutterBottom>
            404
          </Typography>
          
          <Typography variant="h4" gutterBottom>
            {t('errors.pageNotFound')}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            {t('errors.pageNotFoundMessage')}
          </Typography>

          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate('/')} 
            sx={{ mt: 2 }}
          >
            {t('errors.backToHome')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFoundPage;