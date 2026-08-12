import request from './client';

export const listRequests = (token) => request('/requests', { token });
export const createRequest = (token, body) => request('/requests', { method: 'POST', body, token });
export const managerReview = (token, id, approve) =>
  request(`/requests/${id}/manager-review`, { method: 'PUT', body: { approve }, token });
export const donorReview = (token, id, approve) =>
  request(`/requests/${id}/donor-review`, { method: 'PUT', body: { approve }, token });
export const distributeRequest = (token, id, collected_by_id) =>
  request(`/requests/${id}/distribute`, { method: 'POST', body: { collected_by_id }, token });
