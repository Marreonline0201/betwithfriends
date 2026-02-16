const API_URL = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  auth: {
    signup: (email, password, name) =>
      request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request('/auth/me'),
  },
  groups: {
    list: () => request('/groups'),
    get: (id) => request(`/groups/${id}`),
    create: (name) =>
      request('/groups', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    addMember: (groupId, email) =>
      request(`/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    removeMember: (groupId, userId) =>
      request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),
    delete: (id) => request(`/groups/${id}`, { method: 'DELETE' }),
  },
  games: {
    list: (groupId) => request(`/games/group/${groupId}`),
    create: (name, groupId) =>
      request('/games', {
        method: 'POST',
        body: JSON.stringify({ name, groupId }),
      }),
    delete: (id) => request(`/games/${id}`, { method: 'DELETE' }),
  },
  bets: {
    list: (gameId) => request(`/bets/game/${gameId}`),
    create: (gameId, description) =>
      request('/bets', {
        method: 'POST',
        body: JSON.stringify({ gameId, description }),
      }),
    delete: (id) => request(`/bets/${id}`, { method: 'DELETE' }),
  },
  wins: {
    list: (gameId) => request(`/wins/game/${gameId}`),
    leaderboard: (gameId) => request(`/wins/game/${gameId}/leaderboard`),
    add: (gameId, userId) =>
      request('/wins', {
        method: 'POST',
        body: JSON.stringify({ gameId, userId }),
      }),
    delete: (id) => request(`/wins/${id}`, { method: 'DELETE' }),
  },
};
