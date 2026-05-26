import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Package, TrendingUp, Clock, Zap, CheckCircle, Link, ExternalLink, Settings } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { deliveryService } from '../../services/deliveryService';
import toast from 'react-hot-toast';

const ORDER_STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15' },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/15' },
  preparing:  { label: 'Preparing',  color: 'text-orange-500 bg-orange-50 dark:bg-orange-500/15' },
  ready:      { label: 'Ready',      color: 'text-teal-600 bg-teal-50 dark:bg-teal-500/15' },
  delivered:  { label: 'Delivered',  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15' },
  cancelled:  { label: 'Cancelled',  color: 'text-red-500 bg-red-50 dark:bg-red-500/15' },
};

export default function Delivery() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('orders');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: stats } = useQuery({ queryKey: ['delivery-stats'], queryFn: () => deliveryService.getStats().then(r => r.data) });
  const { data: platforms = [] } = useQuery({ queryKey: ['delivery-platforms'], queryFn: () => deliveryService.getPlatforms().then(r => r.data) });
  const params = statusFilter !== 'all' ? { status: statusFilter } : {};
  const { data: orders = [], isLoading } = useQuery({ queryKey: ['delivery-orders', statusFilter], queryFn: () => deliveryService.getOrders(params).then(r => r.data), enabled: tab === 'orders' });

  const connectPlatform = useMutation({
    mutationFn: (id) => deliveryService.connectPlatform(id, {}),
    onSuccess: (r) => toast.success(r.data.message),
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const typeColors = { delivery: '#f97316', takeaway: '#3b82f6' };
  const pieData = stats?.byType?.map(t => ({ name: t._id, value: t.count, color: typeColors[t._id] || '#9ca3af' })) || [];

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Delivery Hub</h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-1">Unified delivery inbox — all orders from all platforms in one place</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Package, label: "Today's Orders", value: stats.todayOrders, color: 'bg-orange-500' },
            { icon: TrendingUp, label: 'Monthly Orders', value: stats.monthOrders.toLocaleString(), color: 'bg-blue-500' },
            { icon: Truck, label: 'Monthly Revenue', value: `${(stats.monthRevenue || 0).toLocaleString()} TND`, color: 'bg-emerald-500' },
            { icon: Clock, label: 'Avg Delivery Time', value: `${stats.avgDeliveryMinutes}m`, color: 'bg-purple-500' },
          ].map((c, i) => (
            <div key={i} className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider">{c.label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.color}`}><c.icon size={17} className="text-white" /></div>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
        {[['orders', 'Live Orders', Package], ['platforms', 'Platforms', Link], ['analytics', 'Analytics', TrendingUp]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/40'}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
            {[['all', 'All'], ['pending', 'Pending'], ['preparing', 'Preparing'], ['delivered', 'Delivered']].map(([id, label]) => (
              <button key={id} onClick={() => setStatusFilter(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === id ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/40'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/6">
                  {['Order', 'Platform', 'Type', 'Items', 'Total', 'Address', 'Status', 'Time'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 dark:text-white/35 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan={8} className="py-12 text-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                  : orders.length === 0 ? <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-400">No delivery orders</td></tr>
                  : orders.map((o) => {
                    const st = ORDER_STATUS_CONFIG[o.status] || ORDER_STATUS_CONFIG.pending;
                    return (
                      <tr key={o._id} className="border-b border-gray-50 dark:border-white/4 hover:bg-gray-50 dark:hover:bg-white/3">
                        <td className="px-5 py-3 text-sm font-bold text-gray-800 dark:text-white">{o.orderNumber}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/15 text-orange-600">{o.platformName || 'Direct'}</span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500 dark:text-white/40 capitalize">{o.type}</td>
                        <td className="px-5 py-3 text-sm text-gray-500 dark:text-white/40">{o.items?.length || 0}</td>
                        <td className="px-5 py-3 text-sm font-bold text-orange-500">{(o.total || 0).toFixed(2)} TND</td>
                        <td className="px-5 py-3 text-xs text-gray-400 max-w-[140px] truncate">{o.deliveryAddress?.street || '—'}</td>
                        <td className="px-5 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span></td>
                        <td className="px-5 py-3 text-xs text-gray-400">{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Platforms */}
      {tab === 'platforms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((p) => (
            <div key={p.id} className={`bg-white dark:bg-[#111111] border ${p.connected ? 'border-emerald-300 dark:border-emerald-500/30' : 'border-gray-100 dark:border-white/6'} rounded-2xl p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black" style={{ background: p.color }}>{p.name.charAt(0)}</div>
                  <div>
                    <div className="text-sm font-bold text-gray-800 dark:text-white">{p.name}</div>
                    <div className={`text-xs font-semibold ${p.connected ? 'text-emerald-500' : 'text-gray-400'}`}>{p.connected ? '✓ Connected' : '○ Not connected'}</div>
                  </div>
                </div>
                {p.connected ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-100 dark:bg-emerald-500/15 px-3 py-1.5 rounded-xl"><CheckCircle size={12} /> Active</span>
                ) : (
                  <button onClick={() => connectPlatform.mutate(p.id)} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <Link size={12} /> Connect
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-white/30">
                {p.connected ? 'Receiving orders directly into Restora. Orders sync automatically.' : 'Connect your account to receive orders from this platform directly in Restora.'}
              </p>
              {!p.connected && p.id !== 'internal' && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-500/8 rounded-xl">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">🔜 Integration coming soon. Click Connect to join the waitlist.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Analytics */}
      {tab === 'analytics' && pieData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-4">Orders by Type</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-4">Revenue by Type</h3>
            <div className="space-y-3">
              {stats?.byType?.map((t) => {
                const total = stats.byType.reduce((s, x) => s + x.revenue, 0);
                const pct = total > 0 ? (t.revenue / total * 100).toFixed(1) : 0;
                return (
                  <div key={t._id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-gray-700 dark:text-white/70 capitalize">{t._id}</span>
                      <span className="font-bold text-gray-800 dark:text-white">{(t.revenue || 0).toFixed(0)} TND <span className="text-gray-400 font-normal text-xs">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-white/8 rounded-full">
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: typeColors[t._id] || '#9ca3af' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
