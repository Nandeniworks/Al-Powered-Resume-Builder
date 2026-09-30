const express = require('express');
const { sendNotification } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/notifications/send requires JWT authentication
router.post('/send', authMiddleware, sendNotification);

module.exports = router;
