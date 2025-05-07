const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

// Import routes
const userRoutes = require("./routes/userRoutes");

// Create Express app
const app = express();

// Set port
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // HTTP request logger

// API routes
app.use("/api", userRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An unexpected error occurred",
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes
