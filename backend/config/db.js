const mongoose = require('mongoose');

let retryTimeout = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    console.error(
      'MongoDB Connection Error: Neither MONGODB_URI nor MONGO_URI is defined. ' +
      'Please set MONGODB_URI in your environment variables.'
    );
    if (retryTimeout) clearTimeout(retryTimeout);
    retryTimeout = setTimeout(connectDB, 5000);
    return;
  }

  // Diagnostic warning for local IP in cloud deployment
  if (
    (process.env.RENDER || process.env.NODE_ENV === 'production') &&
    (mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost'))
  ) {
    console.warn(
      '⚠️ Warning: MONGODB_URI is pointing to localhost/127.0.0.1 on a cloud instance. ' +
      'Render instances do not run local MongoDB. Use a cloud MongoDB Atlas connection string (mongodb+srv://...).'
    );
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);

    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      console.warn(
        '⚠️ MongoDB Atlas Auth Tip: Check that the Atlas Database User credentials in MONGODB_URI are correct. ' +
        'If the password contains special characters (@, :, #, %, etc.), ensure they are URL-encoded (e.g., @ -> %40).'
      );
    } else if (error.message.includes('ECONNREFUSED')) {
      console.warn(
        '⚠️ MongoDB Connection Tip: Connection was refused. Ensure your cloud MongoDB Atlas URI is used ' +
        'and Atlas Network Access has 0.0.0.0/0 allowed.'
      );
    }

    if (retryTimeout) clearTimeout(retryTimeout);
    retryTimeout = setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
