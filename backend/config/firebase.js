const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getMessaging } = require('firebase-admin/messaging');
const fs = require('fs');
const path = require('path');

// Candidate paths: local (backend/config/), Render root (backend/), CWD, or Render secret store (/etc/secrets/)
const candidatePaths = [
  path.join(__dirname, 'firebase-service-account.json'),
  path.join(__dirname, '..', 'firebase-service-account.json'),
  path.resolve(process.cwd(), 'firebase-service-account.json'),
  '/etc/secrets/firebase-service-account.json',
];

const serviceAccountPath = candidatePaths.find((p) => fs.existsSync(p));

try {
  if (!serviceAccountPath) {
    throw new Error('firebase-service-account.json not found in config, root, or secret paths');
  }

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
