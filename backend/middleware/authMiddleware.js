const jwt = require("jsonwebtoken");
const { supabase } = require("../config/supabase");

/**
 * Authentication middleware to verify user JWT tokens
 */
exports.authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res
        .status(401)
        .json({ error: "Authorization header is required" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Bearer token is required" });
    }

    // Verify using Supabase's getUser method
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Add user to request object
    req.user = data.user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Authorization middleware to check user role permissions
 * @param {Array<string>} allowedRoles - Array of roles allowed to access the route
 */
exports.authorize = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res
          .status(401)
          .json({ error: "Unauthorized: User not authenticated" });
      }

      // Get user profile with role information
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", req.user.id)
        .single();

      if (error || !profile) {
        return res
          .status(401)
          .json({ error: "Unauthorized: User profile not found" });
      }

      // No roles specified means any authenticated user can access
      if (allowedRoles.length === 0) {
        return next();
      }

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(profile.role)) {
        return res.status(403).json({
          error: `Forbidden: Requires one of these roles: ${allowedRoles.join(
            ", "
          )}`,
        });
      }

      // Add role to req object for convenience
      req.userRole = profile.role;
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ error: "Authorization failed" });
    }
  };
};
