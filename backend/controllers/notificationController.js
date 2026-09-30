const admin = require('../config/firebase');

// POST /api/notifications/send - Send Firebase push notification via Firebase Admin
const sendNotification = async (req, res) => {
  try {
    const { firebaseUid, title, body } = req.body;

    // Validate required fields
    if (!firebaseUid || !title || !body) {
      return res.status(400).json({
        message: 'firebaseUid, title, and body are required',
      });
    }

    const message = {
      notification: {
        title,
        body,
      },
      topic: firebaseUid,
    };

    const messageId = await admin.messaging().send(message);

    res.status(200).json({
      message: 'Notification sent successfully',
      messageId,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to send notification',
      error: error.message,
    });
  }
};

module.exports = {
  sendNotification,
};
