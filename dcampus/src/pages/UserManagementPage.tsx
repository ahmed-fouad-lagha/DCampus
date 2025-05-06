import React, { useState } from 'react';
import { Container, useMediaQuery, Theme } from '@mui/material';
import UserList from '../components/admin/UserList';
import UserForm from '../components/admin/UserForm';
import { Profile } from '../types/database.types';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/layout/LoadingSpinner';

const UserManagementPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | undefined>(undefined);
  const { profile, loading } = useAuth();
  
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
  
  // Redirect non-admin users
  if (!profile || profile.role !== 'administrator') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
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