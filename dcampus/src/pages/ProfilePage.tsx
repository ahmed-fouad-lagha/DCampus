import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Avatar, 
  Grid, 
  CircularProgress, 
  Alert, 
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { UserRole } from '../types/database.types';

const ProfilePage: React.FC = () => {
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [language, setLanguage] = useState<'en' | 'fr' | 'ar'>('en');
  
  const [loading, setLoading] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  // Load user data when profile is available
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setBio(profile.bio || '');
      setDepartment(profile.department || '');
      setStudentId(profile.student_id || '');
      setFacultyId(profile.faculty_id || '');
      setRole(profile.role);
      setLanguage(profile.language_preference);
      
      if (profile.avatar_url) {
        setAvatar(profile.avatar_url);
      }
    }
    
    if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  // Ensure we clean up any timeouts
  useEffect(() => {
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  // Avatar upload handler
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar image must be smaller than 5MB');
        return;
      }
      setAvatarFile(file);
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Check if avatars bucket exists and create it if needed
  const ensureAvatarBucketExists = async (): Promise<boolean> => {
    try {
      // First check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return false;
      }
      
      const avatarBucketExists = buckets.some(bucket => bucket.name === 'avatars');
      
      if (!avatarBucketExists) {
        console.log('Creating avatars bucket...');
        const { error: createError } = await supabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 5242880, // 5MB in bytes
        });
        
        if (createError) {
          console.error('Error creating avatars bucket:', createError);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Unexpected error with avatar bucket:', error);
      return false;
    }
  };

  // Upload avatar to Supabase storage with retries
  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;
    
    setSavingAvatar(true);
    try {
      // First ensure the bucket exists
      const bucketExists = await ensureAvatarBucketExists();
      if (!bucketExists) {
        throw new Error('Could not create or access avatar storage');
      }
      
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;
      
      // Try upload with retries
      let retries = 2;
      let uploadSuccess = false;
      let uploadError = null;
      
      while (retries >= 0 && !uploadSuccess) {
        const { error } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (!error) {
          uploadSuccess = true;
        } else {
          uploadError = error;
          console.error(`Upload attempt failed (${retries} retries left):`, error);
          retries--;
          // Wait a bit before retrying
          if (retries >= 0) {
            await new Promise<void>(resolve => {
              window.setTimeout(resolve, 1000);
            });
          }
        }
      }
      
      if (!uploadSuccess) {
        throw uploadError || new Error('Failed to upload avatar after multiple attempts');
      }
      
      // Get the public URL for the uploaded file
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setError(`Failed to upload avatar: ${error.message || 'Unknown error'}`);
      return null;
    } finally {
      setSavingAvatar(false);
    }
  };

  // Save profile changes with timeout safety
  const handleSaveChanges = async () => {
    setLoading(true);
    setError(null);
    
    // Clear any existing timeout
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    // Set a timeout to prevent UI from being stuck if operations take too long
    const id = window.setTimeout(() => {
      setLoading(false);
      setError('Operation timed out. Please try again.');
    }, 15000);
    
    setTimeoutId(id);
    
    try {
      // Initial validation
      if (!firstName.trim()) {
        throw new Error('First name cannot be empty');
      }
      if (!lastName.trim()) {
        throw new Error('Last name cannot be empty');
      }
      
      // First upload avatar if there's a new one
      let avatarUrl = avatar;
      if (avatarFile) {
        const newAvatarUrl = await uploadAvatar();
        if (newAvatarUrl) {
          avatarUrl = newAvatarUrl;
        }
      }
      
      // Prepare the profile update data
      const profileData: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        language_preference: language,
      };
      
      // Only include fields with values to prevent overwriting with empty strings
      if (bio) profileData.bio = bio;
      if (department) profileData.department = department;
      if (studentId && role === 'student') profileData.student_id = studentId;
      if (facultyId && role === 'faculty') profileData.faculty_id = facultyId;
      if (avatarUrl) profileData.avatar_url = avatarUrl;
      
      // Update profile with all fields
      const { error } = await updateProfile(profileData);
      
      if (error) {
        throw error;
      }
      
      // Clear the timeout since the operation succeeded
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      
      setLoading(false); // Set loading to false immediately before showing success
      setSuccess(true); // Show the success message
      
      // Reset the file input after successful upload
      setAvatarFile(null);
      
      // Hide success message after 5 seconds
      const successTimeoutId = window.setTimeout(() => {
        setSuccess(false);
      }, 5000);
      
      setTimeoutId(successTimeoutId);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your profile');
      console.error('Profile save error:', err);
      
      // Clear the timeout since we're handling the error
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      setLoading(false);
    }
  };

  // Handle success notification close
  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar 
            src={avatar} 
            sx={{ 
              width: 150, 
              height: 150, 
              mb: 2,
              border: '1px solid #ccc'
            }} 
          />
          <Button 
            variant="contained" 
            component="label" 
            disabled={savingAvatar}
            sx={{ mb: 1 }}
          >
            {savingAvatar ? <CircularProgress size={24} /> : 'Upload Avatar'}
            <input type="file" hidden onChange={handleAvatarChange} accept="image/*" />
          </Button>
          <Typography variant="caption" color="textSecondary">
            Recommended: Square image under 5MB
          </Typography>
        </Grid>

        <Grid item xs={12} md={8}>
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  fullWidth
                  required
                  error={!firstName.trim()}
                  helperText={!firstName.trim() ? "First name is required" : ""}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  fullWidth
                  required
                  error={!lastName.trim()}
                  helperText={!lastName.trim() ? "Last name is required" : ""}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  value={email}
                  fullWidth
                  disabled
                  helperText="Email cannot be changed"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Tell us about yourself"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    value={role}
                    label="Role"
                    disabled
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="faculty">Faculty</MenuItem>
                    <MenuItem value="administrator">Administrator</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="language-label">Language Preference</InputLabel>
                  <Select
                    labelId="language-label"
                    value={language}
                    label="Language Preference"
                    onChange={(e) => setLanguage(e.target.value as 'en' | 'fr' | 'ar')}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                    <MenuItem value="ar">Arabic</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  fullWidth
                />
              </Grid>
              {role === 'student' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    fullWidth
                  />
                </Grid>
              )}
              {role === 'faculty' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Faculty ID"
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    fullWidth
                  />
                </Grid>
              )}
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSaveChanges}
                disabled={loading || !firstName.trim() || !lastName.trim()}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSuccess} 
          severity="success" 
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;