import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import RegisterForm from '../components/auth/RegisterForm';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/layout/LanguageSelector';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        my: 4, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}>
        {/* Language selector at the top right */}
        <Box sx={{ alignSelf: 'flex-end', mb: 2 }}>
          <LanguageSelector />
        </Box>

        <Typography variant="h4" component="h1" align="center" gutterBottom>
          {t('auth.registerTitle')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 5 }}>
          {t('auth.registerSubtitle')}
        </Typography>
        
        <RegisterForm />
      </Box>
    </Container>
  );
};

export default RegisterPage;