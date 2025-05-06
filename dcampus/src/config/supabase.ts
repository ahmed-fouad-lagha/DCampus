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

// Retrieve environment variables or use default placeholders
// You should replace these with your actual Supabase project URL and key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://jfnlnxhqekqvjjxdbytv.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbmxueGhxZWtxdmpqeGRieXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NzQzMDcsImV4cCI6MjA2MjA1MDMwN30.MIx87iXy9RIDNoZI1TiPIHTHh561MeYaJnhHc85qqis';

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

export type Database = {
  public: {
    Tables: {
      [K in keyof Tables]: {
        Row: Tables[K];
        Insert: Omit<Tables[K], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Tables[K], 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
};

// Client options with timeouts and debug settings
const options: SupabaseClientOptions<'public'> = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'x-app-version': process.env.REACT_APP_VERSION || '1.0.0' },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    timeout: 30000, // 30 seconds
  },
};

// Initialize the Supabase client with types and options
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, options);

// Log connection status when app starts
const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase connected successfully');
    }
  } catch (err) {
    console.error('Unexpected Supabase connection error:', err);
  }
};

// Run connection check
checkConnection();

// Export helper functions for specific Supabase services
export const auth = supabase.auth;
export const storage = supabase.storage;
export const realtime = supabase.channel('dcampus-realtime');