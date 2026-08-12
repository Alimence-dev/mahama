import request from './client';

export const listFamilies = (token) => request('/families', { token });
export const getFamily = (token, id) => request(`/families/${id}`, { token });
export const createFamily = (token, body) => request('/families', { method: 'POST', body, token });
export const updateFamily = (token, id, body) => request(`/families/${id}`, { method: 'PUT', body, token });
export const addMember = (token, id, body) => request(`/families/${id}/members`, { method: 'POST', body, token });
export const updateMember = (token, id, memberId, body) =>
  request(`/families/${id}/members/${memberId}`, { method: 'PUT', body, token });
