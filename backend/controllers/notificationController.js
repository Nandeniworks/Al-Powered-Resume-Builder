const admin = require('../config/firebase');
const User = require('../models/User');

// POST /api/notifications/send - Send Firebase push notification via Firebase Admin
const sendNotification = async (req, res) => {
  try {
    const { firebaseUid, token, fcmToken, title, body, data } = req.body;

    // Validate required fields
    if ((!firebaseUid && !token && !fcmToken) || !title || !body) {
      return res.status(400).json({
        message: 'A target recipient (firebaseUid, token, or fcmToken), title, and body are required',
      });
    }

    const targetDeviceToken = token || fcmToken;
    const message = {
      notification: {
        title,
        body,
      },
      data: data && typeof data === 'object' ? data : {},
    };

    if (targetDeviceToken) {
      message.token = targetDeviceToken;
    } else {
      message.topic = firebaseUid;
    }

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

// POST /api/notifications/register-token - Associate client device FCM token with authenticated user
const registerFCMToken = async (req, res) => {
  try {
    const { fcmToken, token } = req.body;
    const deviceToken = (fcmToken || token || '').trim();

    if (!deviceToken) {
      return res.status(400).json({ message: 'Device token is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.fcmTokens) {
      user.fcmTokens = [];
    }

    let isNewToken = false;
    if (!user.fcmTokens.includes(deviceToken)) {
      user.fcmTokens.push(deviceToken);
      await user.save();
      isNewToken = true;
    }

    console.log(
      `[FCM] Token registered for user ${user.email} (${user._id}). Total tokens: ${user.fcmTokens.length} (isNew: ${isNewToken})`
    );

    res.status(200).json({
      message: 'FCM device token registered successfully',
      tokensCount: user.fcmTokens.length,
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error('[FCM Registration Error]:', error.message);
    res.status(500).json({
      message: 'Failed to register device token',
      error: error.message,
    });
  }
};

/**
 * Trigger Firebase Cloud Messaging notification for template creation or update.
 * Uses direct multicast delivery to registered user device tokens.
 * Does not throw so that template CRUD operations remain fully reliable.
 * @param {object} params
 * @param {'create'|'update'} params.action
 * @param {object} params.template
 */
const notifyTemplateChange = async ({ action, template }) => {
  const isCreate = action === 'create';
  const title = 'Resume Template Update';
  const templateName = template && template.name ? template.name : 'Standard';
  const body = isCreate
    ? `A new resume template is available in ResumeCraft.`
    : `Resume template "${templateName}" has been updated in ResumeCraft.`;

  const dataPayload = {
    templateId: template && template._id ? template._id.toString() : '',
    templateName: templateName,
    action: action || 'update',
    type: 'template_update',
  };

  const deliveryReport = {
    action,
    templateId: dataPayload.templateId,
    multicastSuccessCount: 0,
    multicastFailureCount: 0,
    registeredDevicesNotified: 0,
  };

  // Direct-token delivery to all registered user device tokens
  try {
    const usersWithTokens = await User.find({ fcmTokens: { $exists: true, $ne: [] } });
    const allTokens = [...new Set(usersWithTokens.flatMap((u) => u.fcmTokens || []).filter(Boolean))];

    if (allTokens.length > 0) {
      deliveryReport.registeredDevicesNotified = allTokens.length;
      const multicastResult = await admin.messaging().sendEachForMulticast({
        tokens: allTokens,
        notification: {
          title,
          body,
        },
        data: dataPayload,
      });
      deliveryReport.multicastSuccessCount = multicastResult.successCount;
      deliveryReport.multicastFailureCount = multicastResult.failureCount;
      console.log(
        `[FCM Template Notification] Direct multicast to ${allTokens.length} tokens: ${multicastResult.successCount} succeeded, ${multicastResult.failureCount} failed`
      );

      // Clean up any stale/unregistered tokens returned by Firebase
      const staleTokens = [];
      if (Array.isArray(multicastResult.responses)) {
        multicastResult.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (
              errCode === 'messaging/invalid-registration-token' ||
              errCode === 'messaging/registration-token-not-registered' ||
              errCode === 'messaging/invalid-argument'
            ) {
              staleTokens.push(allTokens[idx]);
            }
          }
        });
      }
      if (staleTokens.length > 0) {
        await User.updateMany(
          { fcmTokens: { $in: staleTokens } },
          { $pull: { fcmTokens: { $in: staleTokens } } }
        );
        console.log(`[FCM] Cleaned up ${staleTokens.length} stale device token(s) from database.`);
      }
    } else {
      console.log('[FCM Template Notification] No registered device tokens found in database.');
    }
  } catch (tokenError) {
    console.warn(`[FCM Template Notification] Multicast delivery warning: ${tokenError.message}`);
  }

  return deliveryReport;
};

module.exports = {
  sendNotification,
  registerFCMToken,
  notifyTemplateChange,
};
