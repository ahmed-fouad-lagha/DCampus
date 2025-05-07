import React, { useState } from 'react';
import { 
  Box, Button, TextField, Typography, Link, 
  Paper, Avatar, FormControlLabel, Checkbox, Stack,
  CircularProgress, Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const result = await signIn(email, password);
    
    if (!result.success) {
      setError(result.error?.message || 'Login failed. Please check your credentials.');
      return;
    }

    // Set redirecting state to show feedback
    setIsRedirecting(true);
    
    // Shorter delay since we've already optimized the auth process
    setTimeout(() => {
      // Redirect to dashboard on successful login
      navigate('/dashboard');
    }, 300);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', mx: 'auto', mt: 8 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {t('auth.login')}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {isRedirecting && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Login successful. Redirecting to dashboard...
            </Alert>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label={t('auth.email')}
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || isRedirecting}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label={t('auth.password')}
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || isRedirecting}
          />

          <FormControlLabel
            control={
              <Checkbox 
                value="remember" 
                color="primary" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                disabled={loading || isRedirecting}
              />
            }
            label={t('auth.rememberMe')}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading || isRedirecting}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : isRedirecting ? (
              'Redirecting...'
            ) : (
              t('auth.login')
            )}
          </Button>

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
            <Box>
              <Link href="/forgot-password" variant="body2">
                {t('auth.forgotPassword')}
              </Link>
            </Box>
            <Box>
              <Link href="/register" variant="body2">
                {t('auth.noAccount')}
              </Link>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
};

export default LoginForm;