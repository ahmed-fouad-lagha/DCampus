import { supabase, auth } from '../config/supabase';
import { Profile, UserRole } from '../types/database.types';

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
    
    const offset = (page - 1) * limit;
    
    // Start building the query
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }
    
    // Apply search if provided
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }
    
    // Apply sorting
    query = query.order(orderBy.column, { ascending: orderBy.order === 'asc' });
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute the query
    const { data, error, count } = await query;
    
    return {
      data,
      count: count || 0,
      error: error ? new Error(error.message) : null
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { data: null, count: 0, error: error as Error };
  }
};

/**
 * Fetch a single user by their ID
 */
export const fetchUserById = async (userId: string): Promise<{ data: Profile | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    return {
      data,
      error: error ? new Error(error.message) : null
    };
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return { data: null, error: error as Error };
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
    // Create the user in auth
    const { data, error } = await auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role
      }
    });
    
    if (error) {
      return { success: false, error: new Error(error.message) };
    }
    
    if (data.user) {
      // Create profile in the profiles table
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        role: userData.role || 'student',
        language_preference: userData.language_preference || 'en',
        department: userData.department,
        student_id: userData.student_id,
        faculty_id: userData.faculty_id,
        bio: userData.bio,
        avatar_url: userData.avatar_url
      });
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
        return { success: false, error: new Error(profileError.message) };
      }
      
      return { success: true, error: null, userId: data.user.id };
    }
    
    return { success: false, error: new Error('Failed to create user') };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: error as Error };
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
    const { error } = await supabase
      .from('profiles')
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
      
    return { success: !error, error: error ? new Error(error.message) : null };
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false, error: error as Error };
  }
};

/**
 * Delete a user (sets inactive flag rather than actual deletion)
 */
export const deleteUser = async (userId: string): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // In a real application, consider soft-deleting users instead of permanently removing them
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    // If you need to actually delete the auth user as well:
    if (!error) {
      const { error: authError } = await auth.admin.deleteUser(userId);
      if (authError) {
        return { success: false, error: new Error(authError.message) };
      }
    }
      
    return { success: !error, error: error ? new Error(error.message) : null };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, error: error as Error };
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
    const { error } = await auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );
      
    return { success: !error, error: error ? new Error(error.message) : null };
  } catch (error) {
    console.error('Reset user password error:', error);
    return { success: false, error: error as Error };
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
    const { error } = await supabase
      .from('profiles')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
      
    return { success: !error, error: error ? new Error(error.message) : null };
  } catch (error) {
    console.error('Update user role error:', error);
    return { success: false, error: error as Error };
  }
};