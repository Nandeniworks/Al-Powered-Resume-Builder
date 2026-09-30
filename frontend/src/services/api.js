const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Universal fetch wrapper for communicating with the ResumeCraft backend.
 * Automatically attaches Authorization: Bearer <JWT> from localStorage if present.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');

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
