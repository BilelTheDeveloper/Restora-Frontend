import api from './api';

export const loyaltyService = {
  getProgram:      ()       => api.get('/owner/loyalty/program'),
  updateProgram:   (data)   => api.put('/owner/loyalty/program', data),
  getStats:        ()       => api.get('/owner/loyalty/stats'),
  getMembers:      (params) => api.get('/owner/loyalty/members', { params }),
  adjustPoints:    (data)   => api.post('/owner/loyalty/adjust', data),
  getTransactions: (params) => api.get('/owner/loyalty/transactions', { params }),
};
