import api from './api';

export const pricingService = {
  getStats:    ()          => api.get('/owner/pricing/stats'),
  getActive:   ()          => api.get('/owner/pricing/active'),
  getRules:    ()          => api.get('/owner/pricing'),
  create:      (data)      => api.post('/owner/pricing', data),
  update:      (id, data)  => api.patch(`/owner/pricing/${id}`, data),
  remove:      (id)        => api.delete(`/owner/pricing/${id}`),
};
