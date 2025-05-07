import React, { useState, useEffect } from 'react';
import { 
  Box, Button, TextField, Typography, Link, 
  Paper, Avatar, Stack, FormControl, 
  InputLabel, Select, MenuItem, FormHelperText,
  Alert
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types/database.types';
import { useTranslation } from 'react-i18next';
import { SelectChangeEvent } from '@mui/material/Select';
import { initConnection, getConnectionStatus } from '../../config/supabase';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as UserRole,
    department: '',
    studentId: '',
    facultyId: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
    
    // Clear error for the field being edited
    if (errors[name as string]) {
      setErrors({
        ...errors,
        [name as string]: ''
      });
    }
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
    
    if (errors[name as string]) {
      setErrors({
        ...errors,
        [name as string]: ''
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.role === 'student' && !formData.studentId) {
      newErrors.studentId = 'Student ID is required';
    }
    
    if (formData.role === 'faculty' && !formData.facultyId) {
      newErrors.facultyId = 'Faculty ID is required';
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Fix: Correctly map form fields to match profile structure expected by Supabase
    const userData = {
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName, // Properly map camelCase to snake_case
      last_name: formData.lastName,   // Properly map camelCase to snake_case
      role: formData.role,
      department: formData.department,
      student_id: formData.studentId, // Properly map camelCase to snake_case
      faculty_id: formData.facultyId  // Properly map camelCase to snake_case
    };
    
    console.log('Starting registration process with form data:', {
      ...userData, 
      password: '********' // Don't log the actual password
    });
    
    try {
      const result = await signUp(formData.email, formData.password, userData);
      
      console.log('Registration result:', result);
      
      if (!result.success) {
        setErrors({
          ...errors,
          general: result.error?.message || 'Registration failed. Please try again.'
        });
        return;
      }
      
      console.log('Registration successful, redirecting to dashboard...');
      
      // Redirect to dashboard after successful registration
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({
        ...errors,
        general: 'An unexpected error occurred. Please try again.'
      });
    }
  };

  const renderRoleSpecificFields = () => {
    if (formData.role === 'student') {
      return (
        <TextField
          margin="normal"
          required
          fullWidth
          name="studentId"
          label={t('auth.studentId')}
          type="text"
          id="studentId"
          value={formData.studentId}
          onChange={handleChange}
          error={!!errors.studentId}
          helperText={errors.studentId}
        />
      );
    } else if (formData.role === 'faculty') {
      return (
        <TextField
          margin="normal"
          required
          fullWidth
          name="facultyId"
          label={t('auth.facultyId')}
          type="text"
          id="facultyId"
          value={formData.facultyId}
          onChange={handleChange}
          error={!!errors.facultyId}
          helperText={errors.facultyId}
        />
      );
    }
    return null;
  };

  // Make sure we have a connection to Supabase
  useEffect(() => {
    // Initialize the connection to Supabase
    initConnection();
    
    // Check connection status
    const connectionStatus = getConnectionStatus();
    if (!connectionStatus.isConnected) {
      connectionStatus.checkConnection();
    }
  }, []);

  return (
    <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 600 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <PersonAddIcon />
        </Avatar>
        
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {t('auth.register')}
        </Typography>

        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {errors.general && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {errors.general}
            </Typography>
          )}

          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                autoComplete="given-name"
                name="firstName"
                required
                fullWidth
                id="firstName"
                label={t('auth.firstName')}
                autoFocus
                value={formData.firstName}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
              />
              <TextField
                required
                fullWidth
                id="lastName"
                label={t('auth.lastName')}
                name="lastName"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
              />
            </Stack>
            
            <TextField
              required
              fullWidth
              id="email"
              label={t('auth.email')}
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                required
                fullWidth
                name="password"
                label={t('auth.password')}
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
              />
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label={t('auth.confirmPassword')}
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
              />
            </Stack>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth required error={!!errors.role}>
                <InputLabel id="role-label">{t('auth.role')}</InputLabel>
                <Select
                  labelId="role-label"
                  id="role"
                  name="role"
                  value={formData.role}
                  label={t('auth.role')}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="student">{t('auth.student')}</MenuItem>
                  <MenuItem value="faculty">{t('auth.faculty')}</MenuItem>
                  <MenuItem value="administrator">{t('auth.administrator')}</MenuItem>
                </Select>
                {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
              </FormControl>
              <TextField
                required
                fullWidth
                name="department"
                label={t('auth.department')}
                type="text"
                id="department"
                value={formData.department}
                onChange={handleChange}
                error={!!errors.department}
                helperText={errors.department}
              />
            </Stack>
            
            {renderRoleSpecificFields()}
          </Stack>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? t('common.loading') : t('auth.register')}
          </Button>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link href="/login" variant="body2">
              {t('auth.haveAccount')}
            </Link>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default RegisterForm;