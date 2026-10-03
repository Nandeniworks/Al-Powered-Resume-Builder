import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import app from '../firebase';
import { api } from '../services/api';

/**
 * Checks if browser and environment support Web Notifications and Service Workers.
 */
export async function isNotificationSupported() {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

/**
 * Retrieves current browser notification permission status.
 * @returns {'granted'|'denied'|'default'|'unsupported'}
 */
export function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Checks whether push notifications are already enabled in the current browser session.
 */
export async function checkNotificationStatus() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { enabled: false, permission: 'unsupported' };
  }
  const permission = Notification.permission;
  if (permission === 'denied') {
    return { enabled: false, permission: 'denied', message: 'Notification permission was denied in browser settings.' };
  }
  if (permission === 'granted') {
    return { enabled: true, permission: 'granted', message: '✓ Push notifications enabled for template updates!' };
  }
  return { enabled: false, permission: 'default', message: 'Enable Push Notifications for Template Updates' };
}

/**
 * Requests browser notification permission, registers the Firebase Messaging service worker,
 * obtains the FCM registration token, and sends it to the backend to store against the authenticated user.
 */
export async function setupFCMNotifications() {
  try {
    console.log('[FCM] Initializing notification registration flow...');

    // 1. Verify browser environment support
    const supported = await isNotificationSupported();
    if (!supported) {
      console.warn('[FCM] Web Push Notifications or Service Workers are not supported in this browser.');
      return {
        success: false,
        reason: 'unsupported',
        error: 'Push notifications are not supported in this browser environment.',
      };
    }

    // 2. Check current notification permission state
    let permission = Notification.permission;
    console.log(`[FCM] Current notification permission state: "${permission}"`);

    if (permission === 'denied') {
      console.warn('[FCM] Notification permission was blocked by the user in browser settings.');
      return {
        success: false,
        reason: 'permission_denied',
        error: 'Notification permission is blocked. Please enable notifications in your browser address bar/site settings.',
      };
    }

    if (permission !== 'granted') {
      console.log('[FCM] Requesting notification permission from user...');
      permission = await Notification.requestPermission();
      console.log(`[FCM] Notification permission request result: "${permission}"`);

      if (permission !== 'granted') {
        return {
          success: false,
          reason: 'permission_denied',
          error: 'Notification permission was not granted by the user.',
        };
      }
    }

    // 3. Verify VAPID Key
    const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY || '').trim();
    if (!vapidKey) {
      console.error(
        '[FCM Error] VAPID public key (VITE_FIREBASE_VAPID_KEY) is not configured in frontend/.env.\n' +
        'To enable browser push tokens, obtain your Web Push Certificate key pair from:\n' +
        'Firebase Console -> Project Settings -> Cloud Messaging -> Web configuration -> Web Push certificates\n' +
        'and set VITE_FIREBASE_VAPID_KEY in frontend/.env.'
      );
      return {
        success: false,
        reason: 'missing_vapid_key',
        error: 'VAPID public key is missing. Add VITE_FIREBASE_VAPID_KEY to frontend/.env (from Firebase Console -> Cloud Messaging -> Web Push certificates).',
      };
    }

    // 4. Register Firebase Messaging Service Worker with config query params
    const swParams = new URLSearchParams({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    });
    const swUrl = `/firebase-messaging-sw.js?${swParams.toString()}`;

    console.log('[FCM] Registering service worker at /firebase-messaging-sw.js...');
    const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
    await navigator.serviceWorker.ready;
    console.log('[FCM] Service worker active and ready at scope:', registration.scope);

    // 5. Obtain FCM registration token from Firebase
    console.log('[FCM] Requesting registration token from Firebase Cloud Messaging...');
    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!currentToken) {
      console.warn('[FCM] No registration token returned by Firebase.');
      return {
        success: false,
        reason: 'no_token_returned',
        error: 'Firebase Messaging did not return a registration token.',
      };
    }

    console.log('[FCM] Successfully obtained FCM registration token from Firebase.');

    // 6. Send token to authenticated backend
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      console.warn('[FCM] Authenticated JWT token not found in localStorage. Token cannot be linked to user.');
      return {
        success: false,
        reason: 'unauthenticated',
        token: currentToken,
        error: 'User is not logged in. Please log in before enabling notifications.',
      };
    }

    console.log('[FCM] Registering token with backend via POST /api/notifications/register-token...');
    const backendResponse = await api.post('/api/notifications/register-token', {
      fcmToken: currentToken,
    });
    console.log('[FCM] Backend token registration successful:', backendResponse);

    // 7. Setup foreground message handler
    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground notification received:', payload);
      const title = payload.notification?.title || payload.data?.title || 'Resume Template Update';
      const body =
        payload.notification?.body ||
        payload.data?.body ||
        'A template update is available in ResumeCraft.';

      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            data: payload.data || {},
          });
        } catch (notifErr) {
          console.warn('[FCM] In-app Notification instantiation warning:', notifErr.message);
        }
      }
    });

    return {
      success: true,
      token: currentToken,
      backendResponse,
    };
  } catch (err) {
    console.error('[FCM Registration Exception]:', err.message);
    return {
      success: false,
      reason: 'exception',
      error: err.message,
    };
  }
}
