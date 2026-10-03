const express = require('express');
const {
  sendNotification,
  registerFCMToken,
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/notifications/send requires JWT authentication
router.post('/send', authMiddleware, sendNotification);

// POST /api/notifications/register-token - Register device FCM token
router.post('/register-token', authMiddleware, registerFCMToken);
router.post('/token', authMiddleware, registerFCMToken);

module.exports = router;
