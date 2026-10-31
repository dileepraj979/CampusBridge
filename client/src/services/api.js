const API_BASE = '/api';

let accessToken = localStorage.getItem('cb_access_token') || null;

export function setAccessToken(token) {
  accessToken = token;
  if (token) {
    localStorage.setItem('cb_access_token', token);
  } else {
    localStorage.removeItem('cb_access_token');
  }
}

export function getAccessToken() {
  return accessToken;
}

export function getDeviceFingerprint() {
  let fp = localStorage.getItem('cb_device_fp');
  if (!fp) {
    fp = 'browser_fp_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem('cb_device_fp', fp);
  }
  return fp;
}

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Device-Fingerprint': getDeviceFingerprint(),
    ...options.headers
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include' // include cookies for refresh token
  };

  try {
    let res = await fetch(url, config);

    // If 401 and not already refreshing or logging in, attempt transparent token refresh
    if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data?.accessToken) {
            setAccessToken(refreshData.data.accessToken);
            headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
            res = await fetch(url, { ...config, headers });
          }
        } else {
          setAccessToken(null);
        }
      } catch (e) {
        setAccessToken(null);
      }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error?.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (error) {
    // If offline (network error), propagate a flagged error so callers can gracefully fallback to Dexie
    if (!navigator.onLine || error.message.includes('Failed to fetch')) {
      error.isOffline = true;
    }
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),
  switchRole: (targetRole) => request('/auth/switch-role', { method: 'POST', body: JSON.stringify({ targetRole }) }),
  getDemoAccounts: () => request('/auth/demo-accounts'),
  revokeAllSessions: (userId) => request(`/auth/revoke-sessions/${userId || ''}`, { method: 'POST' }),

  // Dashboard
  getDashboard: (role) => request(`/dashboard/${role || ''}`),

  // Devices & Sync
  registerDevice: (payload) => request('/devices/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMyDevices: () => request('/devices/my-devices'),
  revokeDevice: (id) => request(`/devices/${id}`, { method: 'DELETE' }),

  // Audit
  getAuditLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/audit?${q}`);
  }
};

export default api;
