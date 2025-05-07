import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import {
  Profile,
  Course,
  CourseEnrollment,
  CourseMaterial,
  Assignment,
  AssignmentSubmission,
  CampusEvent,
  EventRegistration,
  Analytics,
  Notification,
  UserPreference,
  Department,
  Faculty,
  Insight
} from '../types/database.types';

// Retrieve environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if required environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Please check your .env file or environment configuration.'
  );
  // Throw an error to prevent initialization with undefined values
  throw new Error('Missing required Supabase environment variables');
}

// Log environment variables to verify they are loaded correctly
console.log('Supabase URL:', supabaseUrl);
// Don't log the full key for security, just a snippet to verify it exists
console.log('Supabase Key available:', supabaseAnonKey.substring(0, 5) + '...');

// Define the database schema types
export type Tables = {
  profiles: Profile;
  courses: Course;
  course_enrollments: CourseEnrollment;
  course_materials: CourseMaterial;
  assignments: Assignment;
  assignment_submissions: AssignmentSubmission;
  events: CampusEvent;
  event_registrations: EventRegistration;
  analytics: Analytics;
  notifications: Notification;
  user_preferences: UserPreference;
  departments: Department;
  faculties: Faculty;
  insights: Insight;
};

// Corrected Database type structure to match Supabase's expected format
export type Database = {
  public: {
    Tables: {
      [K in keyof Tables]: {
        Row: Tables[K];
        Insert: Partial<Tables[K]>;
        Update: Partial<Tables[K]>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: never;
        Update: never;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [key: string]: string[];
    };
  };
};

// Create a cross-browser compatible timeout function for fetch
const fetchWithTimeout = (url: string, options: RequestInit = {}, timeout = 15000): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeout}ms`));
    }, timeout);

    fetch(url, {
      ...options,
      signal: controller.signal
    })
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

// Client options with improved timeouts and debug settings
const options: SupabaseClientOptions<'public'> = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'dcampus_auth_token',
  },
  global: {
    headers: { 'x-app-version': process.env.REACT_APP_VERSION || '1.0.0' },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    timeout: 30000, // 30 seconds
  }
};

// Initialize the Supabase client with custom fetch implementation for timeout
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey, 
  {
    ...options,
    // @ts-ignore - The Supabase client accepts a fetch option but the type definition is missing
    fetch: (url: RequestInfo | URL, fetchOptions: RequestInit) => fetchWithTimeout(url, fetchOptions, 15000)
  }
);

// Global connection status variables
let isConnected = false;
let lastConnectionAttempt = Date.now();
let connectionCheckInterval: NodeJS.Timeout | null = null;

// Enhanced connection check with detailed error logging
const checkConnection = async () => {
  lastConnectionAttempt = Date.now();
  try {
    console.log('Checking Supabase connection...');
    const startTime = Date.now();
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.error('Supabase connection error:', error);
      isConnected = false;
      console.log(`Connection check failed (${responseTime}ms): ${error.message}`);
      return false;
    } else {
      isConnected = true;
      console.log(`Supabase connected successfully (${responseTime}ms)`);
      return true;
    }
  } catch (err) {
    isConnected = false;
    console.error('Unexpected Supabase connection error:', err);
    return false;
  }
};

// Start periodic connection monitoring - with safe initialization
const startConnectionMonitoring = () => {
  // Only start if we're in a browser environment and not already monitoring
  if (typeof window !== 'undefined' && !connectionCheckInterval) {
    // Check connection immediately
    checkConnection();
    
    // Then check every 2 minutes
    connectionCheckInterval = setInterval(async () => {
      await checkConnection();
    }, 120000); // 2 minutes
    
    return true;
  }
  return false;
};

// Clean up interval on app shutdown
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
      connectionCheckInterval = null;
    }
  });
}

// Create realtime channel with error handling
export const realtime = supabase.channel('dcampus-realtime', {
  config: {
    broadcast: { self: true }
  }
});

// Handle channel errors
realtime
  .on('system', { event: 'disconnect' }, (payload) => {
    console.warn('Realtime disconnected:', payload);
    isConnected = false;
  })
  .on('system', { event: 'reconnect' }, (payload) => {
    console.log('Realtime reconnected:', payload);
    checkConnection(); // Verify connection state after reconnect
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected to realtime channel');
    } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
      console.error('Failed to connect to realtime channel:', status);
      isConnected = false;
    }
  });

// Export helper functions
export const auth = supabase.auth;
export const storage = supabase.storage;

// Connection status helpers
export const getConnectionStatus = () => ({ 
  isConnected, 
  lastChecked: lastConnectionAttempt,
  checkConnection,
  startMonitoring: startConnectionMonitoring
});

// Don't automatically start monitoring - let components control this
// Instead, export the function so it can be called when needed
export const initConnection = () => {
  return startConnectionMonitoring();
};