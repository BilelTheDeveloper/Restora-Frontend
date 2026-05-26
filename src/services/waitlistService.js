import api from './api';

export const waitlistService = {
  getStats:    ()          => api.get('/owner/waitlist/stats'),
  getTables:   (params)    => api.get('/owner/waitlist/tables', { params }),
  getWaitlist: (params)    => api.get('/owner/waitlist', { params }),
  add:         (data)      => api.post('/owner/waitlist', data),
  update:      (id, data)  => api.patch(`/owner/waitlist/${id}`, data),
};
