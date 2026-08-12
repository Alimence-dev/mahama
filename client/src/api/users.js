import request from './client';

export const listUsers = (token) => request('/users', { token });
export const registerUser = (token, body) => request('/auth/register', { method: 'POST', body, token });
