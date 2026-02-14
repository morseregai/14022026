const API_URL = (import.meta as any).env?.VITE_API_URL || '/api'

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Error ${response.status}`)
    }

    return response.json()
  },

  auth: {
    login: (data: any) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: any) => api.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => api.request('/auth/me'),
  },

  sessions: {
    list: () => api.request('/sessions'),
    create: (modelId?: string) =>
      api.request('/sessions/create', { method: 'POST', body: JSON.stringify({ modelId }) }),
    getMessages: (sessionId: string) => api.request(`/sessions/${sessionId}/messages`),
  },

  chat: {
    send: (data: any) => api.request('/chat', { method: 'POST', body: JSON.stringify(data) }),
  },

  transactions: {
    spend: (limit = 10) => api.request(`/transactions/spend?limit=${limit}`),
    redeemGift: (code: string) =>
      api.request('/transactions/gift', { method: 'POST', body: JSON.stringify({ code }) }),
  }
}
