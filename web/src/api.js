const BASE = '/api';

export const fetchLinks = () =>
  fetch(`${BASE}/links`).then(r => r.json());

export const createLink = (data) =>
  fetch(`${BASE}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async r => {
    const body = await r.json();
    if (!r.ok) throw new Error(body.error || 'error');
    return body;
  });

export const fetchStats = (id) =>
  fetch(`${BASE}/links/${id}/stats`).then(r => r.json());

export const toggleLink = (id, isActive) =>
  fetch(`${BASE}/links/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive }),
  }).then(r => r.json());
