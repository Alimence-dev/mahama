import request from './client';

export const getRequestStatusSummary = (token) => request('/reports/request-status-summary', { token });
