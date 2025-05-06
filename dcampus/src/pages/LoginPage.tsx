import React from 'react';
import { Container, Box, Typography, Paper } from '@mui/material';
import LoginForm from '../components/auth/LoginForm';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/layout/LanguageSelector';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        my: 8, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}>
        {/* Language selector at the top right */}
        <Box sx={{ alignSelf: 'flex-end', mb: 2 }}>
          <LanguageSelector />
        </Box>
        
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          {t('auth.loginTitle')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          {t('auth.loginSubtitle')}
        </Typography>
        
        <LoginForm />
      </Box>
    </Container>
  );
};

export default LoginPage;