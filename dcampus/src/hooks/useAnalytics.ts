import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface TrackEventProps {
  category: string;
  action: string;
  label?: string;
  value?: number;
  nonInteraction?: boolean;
}

/**
 * Custom hook for tracking user interactions and page views
 * In a production app, this would integrate with proper analytics services
 * such as Google Analytics, Mixpanel, or a custom backend
 */
export const useAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Track page views when route changes
  useEffect(() => {
    trackPageView(location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  /**
   * Track page views
   * @param path Current route path
   */
  const trackPageView = useCallback((path: string) => {
    // In development, we'll just log to console
    // In production, you would send this to your analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Page View: ${path}`);
    }
    
    // Example of how you would track in a real analytics service:
    /*
    if (window.gtag) {
      window.gtag('config', 'YOUR-TRACKING-ID', {
        page_path: path,
        user_id: user?.id
      });
    }
    */
  }, [user]);

  /**
   * Track user interaction events
   * @param props Event tracking properties
   */
  const trackEvent = useCallback(({ category, action, label, value, nonInteraction = false }: TrackEventProps) => {
    // In development, we'll just log to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Event: ${category} / ${action}${label ? ` / ${label}` : ''}${value ? ` / ${value}` : ''}`);
    }

    // Example of how you would track in a real analytics service:
    /*
    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        non_interaction: nonInteraction,
        user_id: user?.id
      });
    }
    */
  }, [user]);

  /**
   * Track user timing events (performance)
   * @param category Category of the timing event
   * @param variable Variable being timed
   * @param value Time value in milliseconds
   * @param label Optional label for the timing event
   */
  const trackTiming = useCallback((
    category: string,
    variable: string,
    value: number,
    label?: string
  ) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Timing: ${category} / ${variable} / ${value}ms${label ? ` / ${label}` : ''}`);
    }
    
    // Example for a real service:
    /*
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: variable,
        value,
        event_category: category,
        event_label: label
      });
    }
    */
  }, []);

  return {
    trackPageView,
    trackEvent,
    trackTiming
  };
};

export default useAnalytics;