import api from './api';

export const financeService = {
  getSummary:      ()           => api.get('/owner/finance/summary'),
  getPnL:          (months)     => api.get(`/owner/finance/pnl?months=${months || 6}`),
  getExpenses:     (params)     => api.get('/owner/finance/expenses', { params }),
  createExpense:   (data)       => api.post('/owner/finance/expenses', data),
  updateExpense:   (id, data)   => api.patch(`/owner/finance/expenses/${id}`, data),
  deleteExpense:   (id)         => api.delete(`/owner/finance/expenses/${id}`),
};
