export type UserRole = 'student' | 'faculty' | 'administrator';

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: UserRole;
  department?: string;
  student_id?: string;
  faculty_id?: string;
  bio?: string;
  language_preference: 'ar' | 'fr' | 'en';
}

export interface Course {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  instructor_id: string;
  department: string;
  start_date: string;
  end_date: string;
  credit_hours: number;
  code: string;
  thumbnail_url?: string;
  is_published: boolean;
}

export interface CourseEnrollment {
  id: string;
  created_at: string;
  updated_at: string;
  student_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'dropped';
  enrollment_date: string;
  completion_date?: string;
  final_grade?: number;
}

export interface CourseMaterial {
  id: string;
  created_at: string;
  updated_at: string;
  course_id: string;
  title: string;
  type: 'document' | 'video' | 'link' | 'assignment';
  content_url: string;
  order_index: number;
  is_published: boolean;
  publish_date?: string;
  due_date?: string;
}

export interface Assignment {
  id: string;
  created_at: string;
  updated_at: string;
  course_id: string;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  is_published: boolean;
}

export interface AssignmentSubmission {
  id: string;
  created_at: string;
  updated_at: string;
  assignment_id: string;
  student_id: string;
  submission_url: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  graded_at?: string;
  graded_by?: string;
}

export interface CampusEvent {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  organizer_id: string;
  banner_url?: string;
  max_participants?: number;
  event_type: 'academic' | 'cultural' | 'sports' | 'workshop' | 'conference' | 'other';
  is_published: boolean;
}

export interface EventRegistration {
  id: string;
  created_at: string;
  updated_at: string;
  event_id: string;
  user_id: string;
  status: 'registered' | 'attended' | 'cancelled';
  registration_date: string;
  attendance_recorded_at?: string;
}

export interface Analytics {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  resource_type: 'course' | 'material' | 'event' | 'dashboard' | 'profile';
  resource_id: string;
  action: 'view' | 'download' | 'submit' | 'register' | 'complete';
  device_info?: string;
  session_duration?: number;
}

export interface Notification {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  related_resource_type?: 'course' | 'assignment' | 'event' | 'grade';
  related_resource_id?: string;
  is_read: boolean;
  read_at?: string;
}

export interface UserPreference {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  notification_email: boolean;
  notification_push: boolean;
  theme: 'light' | 'dark' | 'system';
  dashboard_layout: string;
}

export interface Department {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  code: string;
  faculty_id: string;
  head_id?: string;
}

export interface Faculty {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  code: string;
  dean_id?: string;
}

export interface Insight {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  insight_type: 'course_recommendation' | 'performance_alert' | 'resource_suggestion' | 'career_path';
  title: string;
  description: string;
  relevance_score: number;
  is_dismissed: boolean;
  dismissed_at?: string;
  is_acted_upon: boolean;
  acted_upon_at?: string;
}