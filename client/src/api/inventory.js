import request from './client';

export const listInventory = (token) => request('/inventory', { token });
export const createInventoryItem = (token, body) => request('/inventory', { method: 'POST', body, token });
export const updateInventoryItem = (token, id, body) => request(`/inventory/${id}`, { method: 'PUT', body, token });
export const restockInventoryItem = (token, id, change_amount) =>
  request(`/inventory/${id}/restock`, { method: 'POST', body: { change_amount }, token });
