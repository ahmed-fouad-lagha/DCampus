import React, { useState, useEffect } from 'react';
import { Navigate, RouteObject, useRoutes, useLocation } from 'react-router-dom';
import { routes, RouteType, CustomRouteObject } from '../../config/routes';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../layout/ErrorBoundary';
import NotFoundPage from '../../pages/NotFoundPage';
import LoadingSpinner from '../layout/LoadingSpinner';
import { Box, Button, Typography } from '@mui/material';

const AppRouter: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set a timeout to show extra message if loading takes too long
  useEffect(() => {
    let timeoutId: number;
    if (loading) {
      timeoutId = window.setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000); // Show additional message after 5 seconds
    }
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loading]);

  // Process routes based on authentication status
  const processRoutes = (routes: CustomRouteObject[]): RouteObject[] => {
    return routes.map(route => {
      // Handle route type based on authentication
      if (route.meta?.type === RouteType.PROTECTED && !user) {
        // Redirect to login if trying to access protected route while logged out
        return {
          ...route,
          element: (
            <Navigate to="/login" state={{ from: location }} replace />
          )
        };
      } else if (route.meta?.type === RouteType.GUEST && user) {
        // Redirect to dashboard if trying to access guest route while logged in
        return {
          ...route,
          element: <Navigate to="/dashboard" replace />
        };
      }

      // Wrap the element in an ErrorBoundary
      const wrappedElement = route.element ? (
        <ErrorBoundary>
          {route.element}
        </ErrorBoundary>
      ) : route.element;

      // Process children recursively
      if (route.children) {
        return {
          ...route,
          element: wrappedElement,
          children: processRoutes(route.children)
        };
      }

      return {
        ...route,
        element: wrappedElement
      };
    });
  };

  // Add a catch-all 404 route
  const routesWithNotFound: RouteObject[] = [
    ...processRoutes(routes),
    {
      path: '*',
      element: (
        <ErrorBoundary>
          <NotFoundPage />
        </ErrorBoundary>
      )
    }
  ];

  const routing = useRoutes(routesWithNotFound);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Box sx={{ position: 'relative' }}>
        <LoadingSpinner fullPage />
        {loadingTimeout && (
          <Box sx={{ 
            position: 'absolute', 
            bottom: '15%', 
            left: '50%', 
            transform: 'translateX(-50%)',
            textAlign: 'center',
            width: '80%',
            maxWidth: '500px',
            p: 2
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              It is taking longer than expected to connect to our servers. This could be due to network issues or server maintenance.
            </Typography>
            <Button 
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              Refresh the page
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  return <>{routing}</>;
};

export default AppRouter;