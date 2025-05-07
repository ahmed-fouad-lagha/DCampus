const userService = require("../services/userService");
const { validationResult } = require("express-validator");

/**
 * User controller for handling user-related API endpoints
 */
class UserController {
  /**
   * Get users with filtering and pagination
   */
  async getUsers(req, res) {
    try {
      const { page, limit, role, search, sort, order } = req.query;

      const options = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        role: role || undefined,
        search: search || undefined,
        orderBy: {
          column: sort || "created_at",
          order: order || "desc",
        },
      };

      const { data, count, error } = await userService.fetchUsers(options);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({
        data,
        pagination: {
          page: options.page,
          limit: options.limit,
          totalItems: count,
          totalPages: Math.ceil(count / options.limit),
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to retrieve users" });
    }
  }

  /**
   * Get a single user by ID
   */
  async getUserById(req, res) {
    try {
      const { userId } = req.params;

      const { data, error } = await userService.fetchUserById(userId);

      if (error) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ data });
    } catch (error) {
      console.error("Get user by ID error:", error);
      res.status(500).json({ error: "Failed to retrieve user" });
    }
  }

  /**
   * Create a new user
   */
  async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, ...userData } = req.body;

      const { success, error, userId } = await userService.createUser(
        email,
        password,
        userData
      );

      if (!success) {
        return res.status(400).json({ error: error.message });
      }

      res.status(201).json({
        message: "User created successfully",
        userId,
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const userData = req.body;

      // Don't allow email/password updates through this endpoint
      delete userData.email;
      delete userData.password;

      const { success, error } = await userService.updateUser(userId, userData);

      if (!success) {
        return res.status(400).json({ error: error.message });
      }

      res.json({
        message: "User updated successfully",
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const { hardDelete } = req.query;

      const { success, error } = await userService.deleteUser(
        userId,
        hardDelete === "true"
      );

      if (!success) {
        return res.status(400).json({ error: error.message });
      }

      res.json({
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }

  /**
   * Reset a user's password
   */
  async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const { newPassword } = req.body;

      const { success, error } = await userService.resetUserPassword(
        userId,
        newPassword
      );

      if (!success) {
        return res.status(400).json({ error: error.message });
      }

      res.json({
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  }

  /**
   * Update a user's role
   */
  async updateRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const { role } = req.body;

      if (!["student", "faculty", "administrator"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const { success, error } = await userService.updateUserRole(userId, role);

      if (!success) {
        return res.status(400).json({ error: error.message });
      }

      res.json({
        message: "User role updated successfully",
      });
    } catch (error) {
      console.error("Update role error:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  }
}

module.exports = new UserController();
