import api from './api';

export const deliveryService = {
  getPlatforms:   ()           => api.get('/owner/delivery/platforms'),
  getStats:       ()           => api.get('/owner/delivery/stats'),
  getOrders:      (params)     => api.get('/owner/delivery/orders', { params }),
  connectPlatform:(id, data)   => api.post(`/owner/delivery/connect/${id}`, data),
};
