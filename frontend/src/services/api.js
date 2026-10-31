const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Checks whether a given JWT token string is expired or malformed.
 */
function isJwtExpired(token) {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return true;
    }
    return false;
  } catch (e) {
    return true;
  }
}

/**
 * Universal fetch wrapper for communicating with the ResumeCraft backend.
 * Automatically attaches Authorization: Bearer <JWT> from localStorage if present.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  // If a token exists but is already expired, clear it immediately
  if (token && isJwtExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login') &&
      !window.location.pathname.startsWith('/register') &&
      !window.location.pathname.startsWith('/share')
    ) {
      window.location.href = '/login?expired=true';
      return;
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType.includes('application/pdf')) {
    data = await response.blob();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Clear expired credentials from localStorage so the app does not remain in a broken session state
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register') &&
        !window.location.pathname.startsWith('/share')
      ) {
        window.location.href = '/login?expired=true';
      }
    }

    const errorMessage = data && data.message ? data.message : 'API Request Failed';
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, headers = {}) => apiRequest(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers = {}) => apiRequest(endpoint, { method: 'POST', body, headers }),
  put: (endpoint, body, headers = {}) => apiRequest(endpoint, { method: 'PUT', body, headers }),
  delete: (endpoint, headers = {}) => apiRequest(endpoint, { method: 'DELETE', headers }),
};

export default api;
