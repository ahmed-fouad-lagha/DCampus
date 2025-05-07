const express = require("express");
const { body } = require("express-validator");
const userController = require("../controllers/userController");
const {
  authenticateToken,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Validation rules
const userCreateValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("first_name")
    .isString()
    .notEmpty()
    .withMessage("First name is required"),
  body("last_name").isString().notEmpty().withMessage("Last name is required"),
  body("role")
    .isIn(["student", "faculty", "administrator"])
    .withMessage("Valid role is required"),
];

const userUpdateValidation = [
  body("first_name")
    .optional()
    .isString()
    .withMessage("First name must be a string"),
  body("last_name")
    .optional()
    .isString()
    .withMessage("Last name must be a string"),
  body("department")
    .optional()
    .isString()
    .withMessage("Department must be a string"),
  body("language_preference")
    .optional()
    .isIn(["ar", "fr", "en"])
    .withMessage("Valid language preference required"),
];

const passwordResetValidation = [
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const roleUpdateValidation = [
  body("role")
    .isIn(["student", "faculty", "administrator"])
    .withMessage("Valid role is required"),
];

// Routes - all require authentication and admin authorization
router.get(
  "/users",
  authenticateToken,
  authorize(["administrator"]),
  userController.getUsers
);

router.get(
  "/users/:userId",
  authenticateToken,
  authorize(["administrator"]),
  userController.getUserById
);

router.post(
  "/users",
  authenticateToken,
  authorize(["administrator"]),
  userCreateValidation,
  userController.createUser
);

router.put(
  "/users/:userId",
  authenticateToken,
  authorize(["administrator"]),
  userUpdateValidation,
  userController.updateUser
);

router.delete(
  "/users/:userId",
  authenticateToken,
  authorize(["administrator"]),
  userController.deleteUser
);

router.post(
  "/users/:userId/reset-password",
  authenticateToken,
  authorize(["administrator"]),
  passwordResetValidation,
  userController.resetPassword
);

router.post(
  "/users/:userId/role",
  authenticateToken,
  authorize(["administrator"]),
  roleUpdateValidation,
  userController.updateRole
);

module.exports = router;
