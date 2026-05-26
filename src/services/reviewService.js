import api from './api';

export const reviewService = {
  getStats:    ()             => api.get('/owner/reviews/stats'),
  getReviews:  (params)       => api.get('/owner/reviews', { params }),
  create:      (data)         => api.post('/owner/reviews', data),
  reply:       (id, data)     => api.patch(`/owner/reviews/${id}/reply`, data),
  remove:      (id)           => api.delete(`/owner/reviews/${id}`),
};
