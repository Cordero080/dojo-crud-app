// db.js
require("dotenv").config(); // Load environment variables from .env
const mongoose = require("mongoose"); // Import Mongoose

// Use value from .env or fallback to local DB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/forms_db";

// Async function to connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI); // Connect using Mongoose
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit if connection fails
  }
}

// Export the connection function so server.js can use it
module.exports = connectDB;
