import api from './api';

export const workforceService = {
  getLaborAnalytics: (days = 30)    => api.get(`/owner/workforce/labor?days=${days}`),
  getPayrollSummary: (month, year)  => api.get(`/owner/workforce/payroll?month=${month}&year=${year}`),
  getStaffingForecast: (date)       => api.get(`/owner/workforce/forecast?date=${date || ''}`),
};
