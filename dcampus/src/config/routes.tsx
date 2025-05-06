import React, { lazy, Suspense } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// Lazy load components
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const AppLayout = lazy(() => import('../components/layout/AppLayout'));

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
    path: '/login',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <LoginPage />
      </Suspense>
    ),
    meta: { type: RouteType.GUEST }
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RegisterPage />
      </Suspense>
    ),
    meta: { type: RouteType.GUEST }
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
        path: '',
        element: <Navigate to="/dashboard" />,
        meta: { type: RouteType.PROTECTED }
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/login" />,
    meta: { type: RouteType.PUBLIC }
  }
];