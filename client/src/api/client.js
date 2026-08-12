const BASE_URL = 'http://localhost:5000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // A 401 on a request that carried a token means the session expired/is invalid,
    // as opposed to a login attempt with the wrong password (which sends no token).
    if (res.status === 401 && token) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export default request;
