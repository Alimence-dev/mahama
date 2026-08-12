import request from './client';

export const listDistributions = (token) => request('/distributions', { token });
