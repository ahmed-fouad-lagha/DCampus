import { supabase } from '../config/supabase';
import { Profile, UserRole } from '../types/database.types';
import axios from 'axios';
import { debugApiCall, debugBackendConnection } from '../utils/debugUtils';

// API base URL - should be configured from environment variables in production
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface FetchUsersOptions {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
  orderBy?: {
    column: keyof Profile;
    order: 'asc' | 'desc';
  };
}

interface UsersResponse {
  data: Profile[] | null;
  count: number;
  error: Error | null;
}

// Helper to get auth token
const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
};

// Helper to create request headers with auth token
const getHeaders = async () => {
  const token = await getAuthToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Test backend connection on module load (in development only)
if (process.env.NODE_ENV === 'development') {
  debugBackendConnection().catch(err => console.error('Initial backend connection check failed:', err));
}

/**
 * Fetches users from the database with pagination and filtering options
 */
export const fetchUsers = async (options: FetchUsersOptions = {}): Promise<UsersResponse> => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      search,
      orderBy = { column: 'created_at', order: 'desc' }
    } = options;
    
    // Build query params
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sort', orderBy.column.toString());
    params.append('order', orderBy.order);
    
    if (role) {
      params.append('role', role);
    }
    
    if (search) {
      params.append('search', search);
    }
    
    // Call backend API
    const headers = await getHeaders();
    const requestUrl = `${API_URL}/users?${params.toString()}`;
    
    debugApiCall(requestUrl, 'GET', { headers });
    
    const response = await axios.get(requestUrl, { headers });
    
    debugApiCall(requestUrl, 'GET', { headers }, response.data);
    
    return {
      data: response.data.data,
      count: response.data.pagination.totalItems,
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    debugApiCall(`${API_URL}/users`, 'GET', null, null, error);
    return { 
      data: null, 
      count: 0, 
      error: new Error(error.response?.data?.error || error.message) 
    };
  }
};

/**
 * Fetch a single user by their ID
 */
export const fetchUserById = async (userId: string): Promise<{ data: Profile | null; error: Error | null }> => {
  try {
    const headers = await getHeaders();
    const requestUrl = `${API_URL}/users/${userId}`;
    
    debugApiCall(requestUrl, 'GET', { headers });
    
    const response = await axios.get(requestUrl, { headers });
    
    debugApiCall(requestUrl, 'GET', { headers }, response.data);
      
    return {
      data: response.data.data,
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching user by ID:', error);
    debugApiCall(`${API_URL}/users/${userId}`, 'GET', null, null, error);
    return { 
      data: null, 
      error: new Error(error.response?.data?.error || error.message) 
    };
  }
};

/**
 * Create a new user with authentication and profile
 */
export const createUser = async (
  email: string,
  password: string,
  userData: Partial<Profile>
): Promise<{ success: boolean; error: Error | null; userId?: string }> => {
  try {
    const headers = await getHeaders();
    const requestUrl = `${API_URL}/users`;
    const requestData = { email, password, ...userData };
    
    debugApiCall(requestUrl, 'POST', { headers, data: requestData });
    
    const response = await axios.post(requestUrl, requestData, { headers });
    
    debugApiCall(requestUrl, 'POST', { headers, data: requestData }, response.data);
    
    return { 
      success: true, 
      error: null, 
      userId: response.data.userId 
    };
  } catch (error: any) {
    console.error('Create user error:', error);
    debugApiCall(`${API_URL}/users`, 'POST', null, null, error);
    return { 
      success: false, 
      error: new Error(error.response?.data?.error || error.message) 
    };
  }
};

/**
 * Update an existing user profile
 */
export const updateUser = async (
  userId: string,
  userData: Partial<Profile>
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const headers = await getHeaders();
    const requestUrl = `${API_URL}/users/${userId}`;
    
    debugApiCall(requestUrl, 'PUT', { headers, data: userData });
    
    const response = await axios.put(requestUrl, userData, { headers });
    
    debugApiCall(requestUrl, 'PUT', { headers, data: userData }, response.data);
      
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Update user error:', error);
    debugApiCall(`${API_URL}/users/${userId}`, 'PUT', null, null, error);
    return { 
      success: false, 
      error: new Error(error.response?.data?.error || error.message) 
    };
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (userId: string): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const headers = await getHeaders();
    const requestUrl = `${API_URL}/users/${userId}`;
    
    debugApiCall(requestUrl, 'DELETE', { headers });
    
    const response = await axios.delete(requestUrl, { headers });
    
    debugApiCall(requestUrl, 'DELETE', { headers }, response.data);

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Delete user error:', error);
    debugApiCall(`${API_URL}/users/${userId}`, 'DELETE', null, null, error);
    return { 
      success: false, 
      error: new Error(error.response?.data?.error || error.message) 
    };
  }
};

/**
 * Change a user's password (admin function)
 */
export const resetUserPassword = async (
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const headers = await getHeaders();
    const requestUrl = `${API_URL}/users/${userId}/reset-password`;
    const requestData = { newPassword };
    
    debugApiCall(requestUrl, 'POST', { headers, data: requestData });
    
    const response = await axios.post(requestUrl, requestData, { headers });
    
    debugApiCall(requestUrl, 'POST', { headers, data: requestData }, response.data);
      
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Reset user password error:', error);
    debugApiCall(`${API_URL}/users/${userId}/reset-password`, 'POST', null, null, error);
    return { 
      success: false, 
      error: new Error(error.response?.data?.error || error.message) 
    };
  }
};

/**
 * Change a user's role
 */
export const updateUserRole = async (
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const headers = await getHeaders();
    const requestUrl = `${API_URL}/users/${userId}/role`;
    const requestData = { role };
    
    debugApiCall(requestUrl, 'POST', { headers, data: requestData });
    
    const response = await axios.post(requestUrl, requestData, { headers });
    
    debugApiCall(requestUrl, 'POST', { headers, data: requestData }, response.data);
      
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Update user role error:', error);
    debugApiCall(`${API_URL}/users/${userId}/role`, 'POST', null, null, error);
    return { 
      success: false, 
      error: new Error(error.response?.data?.error || error.message) 
    };
  }
};