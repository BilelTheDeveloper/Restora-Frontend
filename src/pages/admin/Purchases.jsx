import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Package, AlertTriangle, TrendingUp, Plus, X, ChevronDown, Building2, FileText, Zap, Check } from 'lucide-react';
import { supplierService } from '../../services/supplierService';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'text-gray-400 bg-gray-100 dark:bg-white/8' },
  sent:      { label: 'Sent',      color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/15' },
  confirmed: { label: 'Confirmed', color: 'text-teal-600 bg-teal-50 dark:bg-teal-500/15' },
  partial:   { label: 'Partial',   color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15' },
  received:  { label: 'Received',  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15' },
  cancelled: { label: 'Cancelled', color: 'text-red-500 bg-red-50 dark:bg-red-500/15' },
};

const CAT_COLORS = { meat: '#ef4444', produce: '#22c55e', dairy: '#3b82f6', dry: '#f59e0b', beverages: '#8b5cf6', seafood: '#06b6d4', bakery: '#f97316', other: '#6b7280' };

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}><Icon size={17} className="text-white" /></div>
      </div>
      <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-white/35">{sub}</div>}
    </div>
  );
}

const EMPTY_SUPPLIER = { name: '', contactPerson: '', email: '', phone: '', address: '', category: 'other', paymentTerms: 'cod', leadTimeDays: 1, notes: '' };

export default function Purchases() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('orders');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState(EMPTY_SUPPLIER);
  const [orderForm, setOrderForm] = useState({ supplier: '', items: [{ name: '', quantity: 1, unitPrice: 0, unit: 'kg' }], notes: '', expectedDelivery: '' });

  const { data: stats } = useQuery({ queryKey: ['purchase-stats'], queryFn: () => supplierService.getStats().then(r => r.data) });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => supplierService.getSuppliers().then(r => r.data) });
  const { data: orders = [], isLoading: ordersLoading } = useQuery({ queryKey: ['purchase-orders'], queryFn: () => supplierService.getOrders().then(r => r.data) });
  const { data: replenishment } = useQuery({ queryKey: ['replenishment'], queryFn: () => supplierService.getReplenishment().then(r => r.data), enabled: tab === 'replenishment' });

  const createSupplier = useMutation({
    mutationFn: (data) => editingSupplier ? supplierService.updateSupplier(editingSupplier._id, data) : supplierService.createSupplier(data),
    onSuccess: () => { toast.success(editingSupplier ? 'Supplier updated' : 'Supplier added'); qc.invalidateQueries(['suppliers']); setShowSupplierModal(false); setEditingSupplier(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteSupplier = useMutation({
    mutationFn: (id) => supplierService.deleteSupplier(id),
    onSuccess: () => { toast.success('Supplier removed'); qc.invalidateQueries(['suppliers']); },
  });

  const createOrder = useMutation({
    mutationFn: (data) => supplierService.createOrder(data),
    onSuccess: () => { toast.success('Purchase order created'); qc.invalidateQueries(['purchase-orders']); qc.invalidateQueries(['purchase-stats']); setShowOrderModal(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const updateOrderStatus = useMutation({
    mutationFn: ({ id, status }) => supplierService.updateOrder(id, { status }),
    onSuccess: () => { toast.success('Order updated'); qc.invalidateQueries(['purchase-orders']); },
  });

  const openSupplierModal = (s = null) => {
    setEditingSupplier(s);
    setSupplierForm(s ? { name: s.name, contactPerson: s.contactPerson || '', email: s.email || '', phone: s.phone || '', address: s.address || '', category: s.category, paymentTerms: s.paymentTerms, leadTimeDays: s.leadTimeDays, notes: s.notes || '' } : EMPTY_SUPPLIER);
    setShowSupplierModal(true);
  };

  const addOrderItem = () => setOrderForm(f => ({ ...f, items: [...f.items, { name: '', quantity: 1, unitPrice: 0, unit: 'kg' }] }));
  const removeOrderItem = (i) => setOrderForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const setOrderItem = (i, field, val) => setOrderForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) }));
  const orderTotal = orderForm.items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Purchasing & Suppliers</h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-1">Manage suppliers, purchase orders & stock replenishment</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openSupplierModal()} className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"><Building2 size={14} /> New Supplier</button>
          <button onClick={() => setShowOrderModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors"><Plus size={14} /> New Order</button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} label="Total Orders" value={stats.totalOrders} color="bg-blue-500" />
          <StatCard icon={ShoppingCart} label="Pending Orders" value={stats.pendingOrders} sub="Awaiting delivery" color="bg-amber-500" />
          <StatCard icon={TrendingUp} label="Monthly Spend" value={`${(stats.monthlySpend || 0).toLocaleString()} TND`} sub="Last 30 days" color="bg-orange-500" />
          <StatCard icon={Building2} label="Top Supplier" value={stats.topSupplier?.name || '—'} sub={stats.topSupplier ? `${stats.topSupplier.spend.toFixed(0)} TND` : 'No data'} color="bg-purple-500" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
        {[['orders', 'Purchase Orders', FileText], ['suppliers', 'Suppliers', Building2], ['replenishment', 'Replenishment', AlertTriangle]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {tab === 'orders' && (
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/6">
                {['Order #', 'Supplier', 'Items', 'Total', 'Expected', 'Payment', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 dark:text-white/35 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordersLoading ? <tr><td colSpan={8} className="py-12 text-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                : orders.length === 0 ? <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-400">No purchase orders yet</td></tr>
                : orders.map((o) => {
                  const st = STATUS_CONFIG[o.status] || STATUS_CONFIG.draft;
                  return (
                    <tr key={o._id} className="border-b border-gray-50 dark:border-white/4 hover:bg-gray-50 dark:hover:bg-white/3">
                      <td className="px-5 py-3 text-sm font-bold text-gray-800 dark:text-white">{o.orderNumber}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-white/60">{o.supplier?.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-white/40">{o.items?.length} items</td>
                      <td className="px-5 py-3 text-sm font-bold text-orange-500">{(o.total || 0).toFixed(2)} TND</td>
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-white/40">{o.expectedDelivery ? new Date(o.expectedDelivery).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${o.paymentStatus === 'paid' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600' : 'bg-gray-100 dark:bg-white/8 text-gray-500'}`}>{o.paymentStatus}</span></td>
                      <td className="px-5 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span></td>
                      <td className="px-5 py-3">
                        {o.status === 'sent' && (
                          <button onClick={() => updateOrderStatus.mutate({ id: o._id, status: 'received' })}
                            className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 hover:bg-emerald-200 transition-colors flex items-center gap-1">
                            <Check size={11} /> Mark Received
                          </button>
                        )}
                        {o.status === 'draft' && (
                          <button onClick={() => updateOrderStatus.mutate({ id: o._id, status: 'sent' })}
                            className="text-xs font-bold px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-500/15 text-blue-600 hover:bg-blue-200 transition-colors">
                            Send
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* Suppliers */}
      {tab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400">No suppliers yet. Add your first supplier.</div>
          ) : suppliers.map((s) => (
            <motion.div key={s._id} layout className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-5 hover:border-orange-500/40 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: CAT_COLORS[s.category] || '#6b7280' }}>{s.name?.charAt(0) || '?'}</div>
                  <div>
                    <div className="text-sm font-bold text-gray-800 dark:text-white">{s.name}</div>
                    <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full" style={{ background: `${CAT_COLORS[s.category] || '#6b7280'}20`, color: CAT_COLORS[s.category] || '#6b7280' }}>{s.category}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openSupplierModal(s)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/8 text-gray-500 hover:bg-orange-100 hover:text-orange-500 flex items-center justify-center text-xs transition-colors">✏</button>
                  <button onClick={() => { if (confirm('Remove supplier?')) deleteSupplier.mutate(s._id); }} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/8 text-gray-500 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors"><X size={12} /></button>
                </div>
              </div>
              <div className="space-y-1 text-xs text-gray-500 dark:text-white/40">
                {s.phone && <div>📞 {s.phone}</div>}
                {s.contactPerson && <div>👤 {s.contactPerson}</div>}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/6">
                  <span>Lead time: {s.leadTimeDays}d</span>
                  <span className="capitalize">{s.paymentTerms}</span>
                  <span>{s.totalOrders} orders</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Replenishment */}
      {tab === 'replenishment' && (
        <div className="space-y-3">
          {!replenishment?.suggestions?.length ? (
            <div className="text-center py-16 text-gray-400">All stock levels are healthy!</div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-semibold">
                  <AlertTriangle size={15} /> {replenishment.suggestions.length} items need restocking
                </div>
                <span className="text-sm font-bold text-orange-500">Est. cost: {replenishment.totalEstimatedCost.toFixed(2)} TND</span>
              </div>
              {replenishment.suggestions.map((s, i) => (
                <div key={i} className={`bg-white dark:bg-[#111111] border rounded-xl p-4 flex items-center gap-4 ${s.urgency === 'critical' ? 'border-red-300 dark:border-red-500/30' : s.urgency === 'high' ? 'border-amber-300 dark:border-amber-500/30' : 'border-gray-100 dark:border-white/6'}`}>
                  <div className={`w-2 h-10 rounded-full ${s.urgency === 'critical' ? 'bg-red-500' : s.urgency === 'high' ? 'bg-amber-500' : 'bg-blue-400'}`} />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-800 dark:text-white">{s.ingredient.name}</div>
                    <div className="text-xs text-gray-400 dark:text-white/35">Current: {s.ingredient.currentStock}{s.ingredient.unit} · Min: {s.ingredient.minStock}{s.ingredient.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-800 dark:text-white">Order {s.suggestedQty} {s.ingredient.unit}</div>
                    <div className="text-xs text-orange-500 font-semibold">{s.estimatedCost.toFixed(2)} TND</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.urgency === 'critical' ? 'bg-red-100 dark:bg-red-500/15 text-red-600' : s.urgency === 'high' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600' : 'bg-blue-100 dark:bg-blue-500/15 text-blue-600'}`}>
                    {s.urgency.toUpperCase()}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Supplier Modal */}
      <AnimatePresence>
        {showSupplierModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowSupplierModal(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{editingSupplier ? 'Edit Supplier' : 'New Supplier'}</h3>
                <button onClick={() => setShowSupplierModal(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 text-gray-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"><X size={14} /></button>
              </div>
              <div className="space-y-3">
                {[['name', 'Supplier Name *'], ['contactPerson', 'Contact Person'], ['phone', 'Phone'], ['email', 'Email'], ['address', 'Address']].map(([field, label]) => (
                  <div key={field}>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">{label}</label>
                    <input value={supplierForm[field]} onChange={e => setSupplierForm(f => ({ ...f, [field]: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-orange-500/50" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Category</label>
                    <select value={supplierForm.category} onChange={e => setSupplierForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none">
                      {['meat', 'produce', 'dairy', 'dry', 'beverages', 'seafood', 'bakery', 'cleaning', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Payment Terms</label>
                    <select value={supplierForm.paymentTerms} onChange={e => setSupplierForm(f => ({ ...f, paymentTerms: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none">
                      {[['cod', 'COD'], ['net_7', 'Net 7'], ['net_15', 'Net 15'], ['net_30', 'Net 30'], ['prepaid', 'Prepaid']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button onClick={() => createSupplier.mutate(supplierForm)} disabled={!supplierForm.name || createSupplier.isPending}
                className="w-full mt-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
                {createSupplier.isPending ? 'Saving...' : editingSupplier ? 'Save Changes' : 'Add Supplier'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Modal */}
      <AnimatePresence>
        {showOrderModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowOrderModal(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">New Purchase Order</h3>
                <button onClick={() => setShowOrderModal(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 text-gray-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"><X size={14} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Supplier *</label>
                  <select value={orderForm.supplier} onChange={e => setOrderForm(f => ({ ...f, supplier: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none">
                    <option value="">Select supplier...</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40">Items *</label>
                    <button onClick={addOrderItem} className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"><Plus size={12} /> Add Item</button>
                  </div>
                  <div className="space-y-2">
                    {orderForm.items.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <input placeholder="Item name" value={item.name} onChange={e => setOrderItem(i, 'name', e.target.value)}
                          className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm focus:outline-none dark:text-white" />
                        <input type="number" placeholder="Qty" value={item.quantity} min="0.01" step="0.01" onChange={e => setOrderItem(i, 'quantity', e.target.value)}
                          className="w-20 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm focus:outline-none dark:text-white" />
                        <select value={item.unit} onChange={e => setOrderItem(i, 'unit', e.target.value)}
                          className="w-16 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-2 py-2 text-xs focus:outline-none dark:text-white">
                          {['kg', 'g', 'L', 'ml', 'pcs', 'box', 'bottle'].map(u => <option key={u}>{u}</option>)}
                        </select>
                        <input type="number" placeholder="Price" value={item.unitPrice} min="0" step="0.01" onChange={e => setOrderItem(i, 'unitPrice', e.target.value)}
                          className="w-24 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm focus:outline-none dark:text-white" />
                        {orderForm.items.length > 1 && (
                          <button onClick={() => removeOrderItem(i)} className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center"><X size={13} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-2 text-sm font-bold text-orange-500">Total: {orderTotal.toFixed(2)} TND</div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Expected Delivery</label>
                  <input type="date" value={orderForm.expectedDelivery} onChange={e => setOrderForm(f => ({ ...f, expectedDelivery: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm focus:outline-none dark:text-white dark:scheme-dark" />
                </div>
              </div>
              <button onClick={() => createOrder.mutate(orderForm)} disabled={!orderForm.supplier || orderForm.items.some(i => !i.name) || createOrder.isPending}
                className="w-full mt-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
                {createOrder.isPending ? 'Creating...' : `Create Order · ${orderTotal.toFixed(2)} TND`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
