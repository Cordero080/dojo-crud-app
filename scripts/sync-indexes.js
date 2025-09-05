// scripts/sync-indexes.js
// Purpose: Update MongoDB collection indexes to match the Mongoose schema definition.
// Drops old indexes that don't match and creates any missing ones.

require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    // 1. Connect to your MongoDB Atlas cluster or local DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // 2. Load the Form model AFTER connecting
    const Form = require('../models/Form');

    // 3. Synchronize indexes: add new ones, remove outdated ones
    const syncResult = await Form.syncIndexes();
    console.log('🔄 Index sync result:', syncResult);

    // 4. Display current indexes for verification
    const currentIndexes = await Form.collection.indexes();
    console.log('📋 Current indexes:', currentIndexes);
  } catch (err) {
    console.error('❌ Index sync failed:', err);
    process.exitCode = 1;
  } finally {
    // 5. Close the DB connection
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
})();
