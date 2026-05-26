import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Package, Clock, Zap, ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { forecastingService } from '../../services/forecastingService';

const CONFIDENCE_CONFIG = { high: { color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/15', label: 'High' }, medium: { color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/15', label: 'Medium' }, low: { color: 'text-red-400', bg: 'bg-red-100 dark:bg-red-500/15', label: 'Low' } };
const RISK_COLORS = { critical: 'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20', high: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', medium: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20', low: 'text-gray-400 bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/6' };

export default function Forecasting() {
  const { data: revForecast, isLoading: revLoading } = useQuery({ queryKey: ['revenue-forecast'], queryFn: () => forecastingService.getRevenueForecast().then(r => r.data) });
  const { data: noShowForecast = [], isLoading: nsLoading } = useQuery({ queryKey: ['noshow-forecast'], queryFn: () => forecastingService.getNoShowForecast().then(r => r.data) });
  const { data: stockForecast = [], isLoading: stLoading } = useQuery({ queryKey: ['stock-forecast'], queryFn: () => forecastingService.getStockForecast().then(r => r.data) });
  const { data: peakHours = [] } = useQuery({ queryKey: ['peak-hours'], queryFn: () => forecastingService.getPeakHours().then(r => r.data) });

  const totalForecastRevenue = revForecast?.forecast?.reduce((s, d) => s + d.predicted, 0) || 0;
  const highRiskNoShows = noShowForecast.filter(n => n.risk === 'high').length;
  const criticalStock = stockForecast.filter(s => s.risk === 'critical').length;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Predictive Forecasting</h1>
        <p className="text-sm text-gray-400 dark:text-white/40 mt-1">AI-powered predictions for revenue, staffing, stock & no-shows</p>
      </div>

      {/* Summary alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">7-Day Revenue Forecast</span>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{totalForecastRevenue.toLocaleString()} <span className="text-sm font-semibold text-gray-400">TND</span></div>
          <div className="text-xs text-gray-400 dark:text-white/35 mt-1">Projected for the next 7 days</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className={`${highRiskNoShows > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-gray-50 dark:bg-white/3 border-gray-100 dark:border-white/6'} border rounded-2xl p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className={highRiskNoShows > 0 ? 'text-amber-500' : 'text-gray-400'} />
            <span className={`text-xs font-bold uppercase tracking-wider ${highRiskNoShows > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>No-Show Risk (48h)</span>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{highRiskNoShows}</div>
          <div className="text-xs text-gray-400 dark:text-white/35 mt-1">High-risk reservations</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`${criticalStock > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-gray-50 dark:bg-white/3 border-gray-100 dark:border-white/6'} border rounded-2xl p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className={criticalStock > 0 ? 'text-red-500' : 'text-gray-400'} />
            <span className={`text-xs font-bold uppercase tracking-wider ${criticalStock > 0 ? 'text-red-500' : 'text-gray-400'}`}>Stock Depletion Risk</span>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{criticalStock}</div>
          <div className="text-xs text-gray-400 dark:text-white/35 mt-1">Critical items (≤3 days)</div>
        </motion.div>
      </div>

      {/* Revenue forecast chart */}
      <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider">7-Day Revenue Forecast</h3>
            <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Based on 90 days of historical patterns</p>
          </div>
        </div>
        {revLoading ? <div className="h-48 flex items-center justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div> : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revForecast?.forecast || []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="dayName" tick={{ fontSize: 11, fill: 'rgba(156,163,175,1)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(156,163,175,1)' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, n) => [`${v?.toLocaleString()} TND`, n]} contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} labelStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="high" stroke="none" fill="url(#rangeGrad)" name="High range" />
                <Area type="monotone" dataKey="predicted" stroke="#22c55e" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#22c55e', r: 4 }} name="Predicted" />
                <Area type="monotone" dataKey="low" stroke="none" fill="transparent" name="Low range" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-7 gap-2">
              {(revForecast?.forecast || []).map((d, i) => {
                const conf = CONFIDENCE_CONFIG[d.confidence] || CONFIDENCE_CONFIG.low;
                return (
                  <div key={i} className="text-center p-2 rounded-xl bg-gray-50 dark:bg-white/4">
                    <div className="text-xs font-bold text-gray-500 dark:text-white/40">{d.dayName}</div>
                    <div className="text-sm font-black text-gray-800 dark:text-white my-1">{(d.predicted / 1000).toFixed(1)}k</div>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${conf.bg} ${conf.color}`}>{conf.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* No-show risk */}
      {noShowForecast.length > 0 && (
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider">No-Show Risk Analysis (Next 48h)</h3>
          </div>
          <div className="space-y-2">
            {noShowForecast.map((n, i) => {
              const r = n.reservation;
              return (
                <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border ${RISK_COLORS[n.risk]}`}>
                  <div className={`text-lg font-black w-12 text-right ${n.noShowProbability >= 60 ? 'text-red-500' : 'text-amber-500'}`}>{n.noShowProbability}%</div>
                  <div className="flex-1 text-sm">
                    <div className="font-semibold text-gray-800 dark:text-white">{r.customerName || 'Guest'}</div>
                    <div className="text-xs text-gray-400">{new Date(r.date).toLocaleDateString()} at {r.time} · {r.partySize} people</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${n.risk === 'high' ? 'bg-red-100 dark:bg-red-500/15 text-red-500' : 'bg-amber-100 dark:bg-amber-500/15 text-amber-600'}`}>{n.risk.toUpperCase()} RISK</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock depletion */}
      {stockForecast.length > 0 && (
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-orange-500" />
            <h3 className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider">Stock Depletion Forecast</h3>
          </div>
          <div className="space-y-2">
            {stockForecast.slice(0, 10).map((s, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border ${RISK_COLORS[s.risk]}`}>
                <div className="w-14 text-center">
                  <div className={`text-lg font-black ${s.daysRemaining <= 3 ? 'text-red-500' : s.daysRemaining <= 7 ? 'text-amber-500' : 'text-blue-500'}`}>{s.daysRemaining === 999 ? '∞' : s.daysRemaining}</div>
                  <div className="text-xs text-gray-400">days</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-800 dark:text-white">{s.ingredient.name}</div>
                  <div className="text-xs text-gray-400">Stock: {s.ingredient.currentStock}{s.ingredient.unit} · Est. use: {s.dailyUsageEstimate}{s.ingredient.unit}/day</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-white/40">Depletes</div>
                  <div className="text-xs font-bold text-gray-700 dark:text-white/70">{s.depletionDate}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.risk === 'critical' ? 'bg-red-100 dark:bg-red-500/15 text-red-500' : s.risk === 'high' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600' : 'bg-blue-100 dark:bg-blue-500/15 text-blue-500'}`}>{s.risk.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peak hours */}
      {peakHours.length > 0 && (
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-yellow-500" />
            <h3 className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider">Historical Peak Hours</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'rgba(156,163,175,1)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(156,163,175,1)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} orders/hr`]} contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              <Bar dataKey="avgOrders" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg Orders/Hr" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
