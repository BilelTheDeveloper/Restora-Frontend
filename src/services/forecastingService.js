import api from './api';

export const forecastingService = {
  getRevenueForecast: ()     => api.get('/owner/forecasting/revenue'),
  getNoShowForecast:  ()     => api.get('/owner/forecasting/no-show'),
  getStockForecast:   ()     => api.get('/owner/forecasting/stock'),
  getPeakHours:       ()     => api.get('/owner/forecasting/peak-hours'),
};
