const { supabase, auth } = require("../config/supabase");

/**
 * User service for handling user management operations
 */
class UserService {
  /**
   * Fetches users from the database with pagination and filtering options
   */
  async fetchUsers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        search,
        orderBy = { column: "created_at", order: "desc" },
      } = options;

      const offset = (page - 1) * limit;

      // Start building the query
      let query = supabase.from("profiles").select("*", { count: "exact" });

      // Apply filters
      if (role) {
        query = query.eq("role", role);
      }

      // Apply search if provided
      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%`
        );
      }

      // Apply sorting
      query = query.order(orderBy.column, {
        ascending: orderBy.order === "asc",
      });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // Execute the query
      const { data, error, count } = await query;

      return {
        data,
        count: count || 0,
        error: error ? new Error(error.message) : null,
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      return { data: null, count: 0, error };
    }
  }

  /**
   * Fetch a single user by their ID
   */
  async fetchUserById(userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      return {
        data,
        error: error ? new Error(error.message) : null,
      };
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      return { data: null, error };
    }
  }

  /**
   * Create a new user with authentication and profile
   */
  async createUser(email, password, userData) {
    try {
      // Create the user in auth - using updated method
      const { data, error } = await auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
        },
      });

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      if (data.user) {
        // Create profile in the profiles table
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          role: userData.role || "student",
          language_preference: userData.language_preference || "en",
          department: userData.department,
          student_id: userData.student_id,
          faculty_id: userData.faculty_id,
          bio: userData.bio,
          avatar_url: userData.avatar_url,
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          return { success: false, error: new Error(profileError.message) };
        }

        return { success: true, error: null, userId: data.user.id };
      }

      return { success: false, error: new Error("Failed to create user") };
    } catch (error) {
      console.error("Create user error:", error);
      return { success: false, error };
    }
  }

  /**
   * Update an existing user profile
   */
  async updateUser(userId, userData) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      return {
        success: !error,
        error: error ? new Error(error.message) : null,
      };
    } catch (error) {
      console.error("Update user error:", error);
      return { success: false, error };
    }
  }

  /**
   * Delete a user (uses soft deletion by default)
   */
  async deleteUser(userId, hardDelete = false) {
    try {
      if (hardDelete) {
        // Hard delete the user (from auth and profiles)
        const { error: authError } = await auth.admin.deleteUser(userId);
        if (authError) {
          return { success: false, error: new Error(authError.message) };
        }

        // Delete the profile
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("user_id", userId);

        return {
          success: !error,
          error: error ? new Error(error.message) : null,
        };
      } else {
        // Soft delete by setting is_active flag to false
        const { error } = await supabase
          .from("profiles")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        return {
          success: !error,
          error: error ? new Error(error.message) : null,
        };
      }
    } catch (error) {
      console.error("Delete user error:", error);
      return { success: false, error };
    }
  }

  /**
   * Change a user's password (admin function)
   */
  async resetUserPassword(userId, newPassword) {
    try {
      const { error } = await auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      return {
        success: !error,
        error: error ? new Error(error.message) : null,
      };
    } catch (error) {
      console.error("Reset user password error:", error);
      return { success: false, error };
    }
  }

  /**
   * Change a user's role
   */
  async updateUserRole(userId, role) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      return {
        success: !error,
        error: error ? new Error(error.message) : null,
      };
    } catch (error) {
      console.error("Update user role error:", error);
      return { success: false, error };
    }
  }
}

module.exports = new UserService();
