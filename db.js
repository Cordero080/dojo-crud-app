// db.js
require('dotenv').config();
const mongoose = require('mongoose');

// Standard local MongoDB URI format: protocol, host, port, and database name.
// Fallback to this if MONGODB_URI is not set in .env.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/forms_db';

module.exports = async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};
