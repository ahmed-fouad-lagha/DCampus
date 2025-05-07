import React, { lazy, Suspense } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// Lazy load components
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const AppLayout = lazy(() => import('../components/layout/AppLayout'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const UserManagementPage = lazy(() => import('../pages/UserManagementPage'));
const SupabaseTestPage = lazy(() => import('../pages/SupabaseTestPage'));

// Loading fallback component
const LoadingFallback = () => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh' 
  }}>
    <CircularProgress />
  </Box>
);

// Define route types with authentication protection
export enum RouteType {
  PUBLIC = 'public',       // Anyone can access
  PROTECTED = 'protected', // Only authenticated users can access
  GUEST = 'guest'          // Only non-authenticated users can access
}

// Custom route interface extending React Router v7's RouteObject
export interface CustomRouteObject {
  path?: string;
  element?: React.ReactNode;
  children?: CustomRouteObject[];
  meta?: {
    type: RouteType;
  };
}

// Create base routes configuration
export const routes: CustomRouteObject[] = [
  {
    // Redirect login directly to dashboard
    path: '/login',
    element: <Navigate to="/dashboard" replace />,
    meta: { type: RouteType.PUBLIC }
  },
  {
    // Redirect register directly to dashboard
    path: '/register',
    element: <Navigate to="/dashboard" replace />,
    meta: { type: RouteType.PUBLIC }
  },
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AppLayout />
      </Suspense>
    ),
    meta: { type: RouteType.PROTECTED },
    children: [
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <DashboardPage />
          </Suspense>
        ),
        meta: { type: RouteType.PROTECTED }
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPage />
          </Suspense>
        ),
        meta: { type: RouteType.PROTECTED }
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProfilePage />
          </Suspense>
        ),
        meta: { type: RouteType.PROTECTED }
      },
      {
        path: 'user-management',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <UserManagementPage />
          </Suspense>
        ),
        meta: { type: RouteType.PROTECTED }
      },
      {
        path: 'supabase-test',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SupabaseTestPage />
          </Suspense>
        ),
        meta: { type: RouteType.PROTECTED }
      },
      {
        path: '',
        element: <Navigate to="/dashboard" />,
        meta: { type: RouteType.PROTECTED }
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" />,
    meta: { type: RouteType.PUBLIC }
  }
];