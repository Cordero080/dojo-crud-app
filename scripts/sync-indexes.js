// scripts/sync-indexes.js
require('dotenv').config();
const mongoose = require('mongoose');
const Form = require('../models/Form');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  try {
    // Create missing indexes and drop obsolete ones to match the schema
    const res = await Form.syncIndexes();
    console.log('syncIndexes:', res);

    // Show what indexes are currently on the collection
    const idx = await Form.collection.indexes();
    console.log('Current indexes:', idx);
  } catch (e) {
    console.error('Index sync failed:', e.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
})();
