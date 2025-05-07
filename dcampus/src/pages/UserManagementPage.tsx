import React, { useState, useEffect } from 'react';
import { Container, Alert } from '@mui/material';
import UserList from '../components/admin/UserList';
import UserForm from '../components/admin/UserForm';
import { Profile } from '../types/database.types';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/layout/LoadingSpinner';

const UserManagementPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | undefined>(undefined);
  const [authError, setAuthError] = useState<string | null>(null);
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  
  // Check authorization when profile data changes
  useEffect(() => {
    // Using ReturnType<typeof setTimeout> instead of NodeJS.Timeout
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;
    
    const checkAuthorization = () => {
      if (!loading) {
        console.log('User Profile Data:', profile);
        
        // First clear any existing error
        setAuthError(null);
        
        // If no profile, we'll handle it in the rendering logic
        if (!profile) return;
        
        // Check if user has administrator role
        const isAdmin = profile.role === 'student' || profile.role === 'faculty';
        
        if (!isAdmin) {
          setAuthError(`Access denied: You need administrator privileges to access this page. Your current role is: ${profile.role}`);
          
          // Use navigate instead of state-based redirection
          redirectTimer = setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 3000);
        }
      }
    };
    
    checkAuthorization();
    
    // Clean up the timer if component unmounts or dependencies change
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [profile, loading, navigate]);

  // Handle opening the form for editing a user
  const handleEditUser = (user: Profile) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };
  
  // Handle opening the form for creating a new user
  const handleCreateUser = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };
  
  // Handle successful form submission
  const handleFormSuccess = () => {
    setIsFormOpen(false);
  };
  
  // Handle cancel button in form
  const handleFormCancel = () => {
    setIsFormOpen(false);
  };
  
  // Display loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Check if profile exists - immediate redirect if no profile
  if (!profile) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {authError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {authError}
        </Alert>
      )}
      {isFormOpen ? (
        <UserForm 
          user={selectedUser} 
          onSuccess={handleFormSuccess} 
          onCancel={handleFormCancel} 
        />
      ) : (
        <UserList 
          onEditUser={handleEditUser} 
          onCreateUser={handleCreateUser} 
        />
      )}
    </Container>
  );
};

export default UserManagementPage;