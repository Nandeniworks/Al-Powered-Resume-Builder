const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getMessaging } = require('firebase-admin/messaging');
const path = require('path');

// Path to Firebase service account credentials
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');

try {
  const serviceAccount = require(serviceAccountPath);

  // Initialize only if no Firebase app has been initialized yet
  if (!admin.getApps().length) {
    admin.initializeApp({
      credential: admin.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully');
  }
} catch (error) {
  console.error(`Firebase Admin initialization error: ${error.message}`);
}

// Attach auth and messaging helpers so admin.auth() and admin.messaging() work seamlessly
admin.auth = () => getAuth();
admin.messaging = () => getMessaging();

module.exports = admin;
