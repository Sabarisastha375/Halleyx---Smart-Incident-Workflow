const mongoose = require('mongoose');

/**
 * Connect to MongoDB using MONGO_URI from .env
 * Requires MongoDB Atlas or local mongod instance running.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI not set in backend/.env');
    console.error('Get free URI from https://mongodb.com/atlas');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
