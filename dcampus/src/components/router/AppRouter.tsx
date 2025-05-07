import React from 'react';
import { Navigate, RouteObject, useRoutes, useLocation } from 'react-router-dom';
import { routes, RouteType, CustomRouteObject } from '../../config/routes';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../layout/ErrorBoundary';
import NotFoundPage from '../../pages/NotFoundPage';

const AppRouter: React.FC = () => {
  const { user, error } = useAuth();
  const location = useLocation();

  // Process routes based on authentication status
  const processRoutes = (routes: CustomRouteObject[]): RouteObject[] => {
    return routes.map(route => {
      // For this version, we're bypassing auth checks to always allow access to protected routes
      
      // Process children recursively
      if (route.children) {
        return {
          ...route,
          element: route.element ? (
            <ErrorBoundary>
              {route.element}
            </ErrorBoundary>
          ) : route.element,
          children: processRoutes(route.children)
        };
      }

      // Wrap the element in an ErrorBoundary
      const wrappedElement = route.element ? (
        <ErrorBoundary>
          {route.element}
        </ErrorBoundary>
      ) : route.element;

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
          <Navigate to="/dashboard" replace />
        </ErrorBoundary>
      )
    }
  ];

  const routing = useRoutes(routesWithNotFound);

  // Display authentication errors in a minimal way if they exist
  if (error && !user) {
    console.error('Authentication error:', error.message);
    // Return routing anyway instead of showing an error screen
  }

  return <>{routing}</>;
};

export default AppRouter;