import api from './api';

export const campaignService = {
  getStats:    ()          => api.get('/owner/campaigns/stats'),
  getCampaigns:(params)    => api.get('/owner/campaigns', { params }),
  create:      (data)      => api.post('/owner/campaigns', data),
  update:      (id, data)  => api.patch(`/owner/campaigns/${id}`, data),
  remove:      (id)        => api.delete(`/owner/campaigns/${id}`),
  send:        (id)        => api.post(`/owner/campaigns/${id}/send`),
};
