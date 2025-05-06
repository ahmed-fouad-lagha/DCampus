import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  TextField,
  Select,
  FormHelperText,
  Stack,
  Typography,
  useTheme,
  Divider,
  Switch,
  InputAdornment,
  IconButton,
  MenuItem,
  InputLabel,
  FormControlLabel,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Profile, UserRole } from '../../types/database.types';
import { createUser, updateUser, resetUserPassword } from '../../services/userManagementService';

interface UserFormProps {
  user?: Profile;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormDataState {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department?: string;
  student_id?: string;
  faculty_id?: string;
  bio?: string;
  language_preference: 'en' | 'fr' | 'ar';
}

interface FormErrors {
  [key: string]: string;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSuccess, onCancel }) => {
  const isEditMode = !!user;
  const theme = useTheme();
  
  // Form state
  const [formData, setFormData] = useState<FormDataState>({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'student',
    department: '',
    student_id: '',
    faculty_id: '',
    bio: '',
    language_preference: 'en',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  // Initialize form with user data if in edit mode
  useEffect(() => {
    if (user) {
      setFormData({
        email: '', // Email is managed by Supabase auth, not directly editable
        password: '',
        confirmPassword: '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role || 'student',
        department: user.department || '',
        student_id: user.student_id || '',
        faculty_id: user.faculty_id || '',
        bio: user.bio || '',
        language_preference: user.language_preference || 'en',
      });
    }
  }, [user]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle select field changes
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!isEditMode || (isEditMode && changePassword)) {
      // Password validation only for new users or when changing password
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Email validation for new users
    if (!isEditMode) {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
    }

    // Role-specific validations
    if (formData.role === 'student' && !formData.student_id?.trim()) {
      newErrors.student_id = 'Student ID is required for student accounts';
    }

    if (formData.role === 'faculty' && !formData.faculty_id?.trim()) {
      newErrors.faculty_id = 'Faculty ID is required for faculty accounts';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Show error message
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Update existing user
        const userData: Partial<Profile> = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          department: formData.department || undefined,
          student_id: formData.student_id || undefined,
          faculty_id: formData.faculty_id || undefined,
          bio: formData.bio || undefined,
          language_preference: formData.language_preference,
        };

        const result = await updateUser(user.user_id, userData);

        if (result.success) {
          // If password change is requested
          if (changePassword && formData.password) {
            const passwordResult = await resetUserPassword(user.user_id, formData.password);
            
            if (!passwordResult.success) {
              console.error('Password update failed:', passwordResult.error?.message);
              return;
            }
          }

          onSuccess();
        } else {
          console.error('Update failed:', result.error?.message);
        }
      } else {
        // Create new user
        const userData: Partial<Profile> = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          department: formData.department || undefined,
          student_id: formData.student_id || undefined,
          faculty_id: formData.faculty_id || undefined,
          bio: formData.bio || undefined,
          language_preference: formData.language_preference,
        };

        const result = await createUser(
          formData.email,
          formData.password,
          userData
        );

        if (result.success) {
          onSuccess();
        } else {
          console.error('Creation failed:', result.error?.message);
        }
      }
    } catch (error) {
      console.error('User form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic form fields based on selected role
  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case 'student':
        return (
          <FormControl fullWidth margin="normal" error={!!errors.student_id} required>
            <TextField
              label="Student ID"
              name="student_id"
              value={formData.student_id || ''}
              onChange={handleChange}
              placeholder="Enter student ID"
              error={!!errors.student_id}
              helperText={errors.student_id}
            />
          </FormControl>
        );
      case 'faculty':
        return (
          <>
            <FormControl fullWidth margin="normal" error={!!errors.faculty_id} required>
              <TextField
                label="Faculty ID"
                name="faculty_id"
                value={formData.faculty_id || ''}
                onChange={handleChange}
                placeholder="Enter faculty ID"
                error={!!errors.faculty_id}
                helperText={errors.faculty_id}
              />
            </FormControl>
            <FormControl fullWidth margin="normal">
              <TextField
                label="Department"
                name="department"
                value={formData.department || ''}
                onChange={handleChange}
                placeholder="Enter department"
              />
            </FormControl>
          </>
        );
      case 'administrator':
        return (
          <FormControl fullWidth margin="normal">
            <TextField
              label="Department"
              name="department"
              value={formData.department || ''}
              onChange={handleChange}
              placeholder="Enter department (optional)"
            />
          </FormControl>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {isEditMode ? 'Edit User' : 'Create New User'}
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Basic Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              {/* Name */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <FormControl fullWidth error={!!errors.first_name} required>
                  <TextField
                    label="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    error={!!errors.first_name}
                    helperText={errors.first_name}
                  />
                </FormControl>

                <FormControl fullWidth error={!!errors.last_name} required>
                  <TextField
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    error={!!errors.last_name}
                    helperText={errors.last_name}
                  />
                </FormControl>
              </Box>

              {/* Role */}
              <FormControl fullWidth required>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  name="role"
                  value={formData.role}
                  label="Role"
                  onChange={(e) => handleSelectChange(e as any)}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="faculty">Faculty</MenuItem>
                  <MenuItem value="administrator">Administrator</MenuItem>
                </Select>
              </FormControl>

              {/* Language Preference */}
              <FormControl fullWidth>
                <InputLabel id="language-select-label">Preferred Language</InputLabel>
                <Select
                  labelId="language-select-label"
                  name="language_preference"
                  value={formData.language_preference}
                  label="Preferred Language"
                  onChange={(e) => handleSelectChange(e as any)}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="ar">Arabic</MenuItem>
                </Select>
              </FormControl>

              {/* Role-specific fields */}
              {renderRoleSpecificFields()}

              {/* Bio */}
              <FormControl fullWidth>
                <TextField
                  label="Bio"
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  placeholder="Enter brief bio (optional)"
                  multiline
                  rows={2}
                />
              </FormControl>
            </Stack>
          </Box>

          {/* Authentication Section */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Authentication
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              {/* Email - only for new users */}
              {!isEditMode && (
                <FormControl fullWidth error={!!errors.email} required>
                  <TextField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    error={!!errors.email}
                    helperText={errors.email}
                  />
                </FormControl>
              )}

              {/* Password change toggle for edit mode */}
              {isEditMode && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={changePassword}
                      onChange={() => setChangePassword(!changePassword)}
                      name="changePassword"
                    />
                  }
                  label="Change Password"
                />
              )}

              {/* Password fields */}
              {(!isEditMode || (isEditMode && changePassword)) && (
                <>
                  <FormControl fullWidth error={!!errors.password} required>
                    <TextField
                      label={isEditMode ? 'New Password' : 'Password'}
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={`Enter ${isEditMode ? 'new ' : ''}password`}
                      error={!!errors.password}
                      helperText={errors.password || "Password must be at least 6 characters long"}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </FormControl>

                  <FormControl fullWidth error={!!errors.confirmPassword} required>
                    <TextField
                      label="Confirm Password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </FormControl>
                </>
              )}
            </Stack>
          </Box>

          {/* Form Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={isSubmitting}
              color="primary"
            >
              {isSubmitting 
                ? (isEditMode ? 'Updating...' : 'Creating...') 
                : (isEditMode ? 'Update User' : 'Create User')}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default UserForm;