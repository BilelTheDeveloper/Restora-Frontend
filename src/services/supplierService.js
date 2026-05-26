import api from './api';

export const supplierService = {
  getStats:               ()          => api.get('/owner/suppliers/stats'),
  getReplenishment:       ()          => api.get('/owner/suppliers/replenishment'),
  getSuppliers:           ()          => api.get('/owner/suppliers'),
  createSupplier:         (data)      => api.post('/owner/suppliers', data),
  updateSupplier:         (id, data)  => api.patch(`/owner/suppliers/${id}`, data),
  deleteSupplier:         (id)        => api.delete(`/owner/suppliers/${id}`),
  getOrders:              (params)    => api.get('/owner/suppliers/orders', { params }),
  createOrder:            (data)      => api.post('/owner/suppliers/orders', data),
  updateOrder:            (id, data)  => api.patch(`/owner/suppliers/orders/${id}`, data),
};
