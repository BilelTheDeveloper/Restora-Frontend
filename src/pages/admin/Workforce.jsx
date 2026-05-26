import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Clock, DollarSign, TrendingUp, AlertTriangle, Download, ChevronDown, BarChart2, Calendar, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { workforceService } from '../../services/workforceService';
import toast from 'react-hot-toast';

const ROLE_COLORS = { manager: '#3b82f6', waiter: '#14b8a6', kitchen: '#f97316', cashier: '#8b5cf6', driver: '#eab308', owner: '#ec4899' };
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={17} className="text-white" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
        {sub && <div className="text-xs text-gray-400 dark:text-white/35 mt-0.5">{sub}</div>}
      </div>
      {trend !== undefined && (
        <div className={`text-xs font-semibold ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs target
        </div>
      )}
    </motion.div>
  );
}

export default function Workforce() {
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState('overview');
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());

  const { data: labor, isLoading } = useQuery({
    queryKey: ['labor-analytics', days],
    queryFn: () => workforceService.getLaborAnalytics(days).then(r => r.data),
    staleTime: 60_000,
  });

  const { data: payroll, isLoading: payrollLoading } = useQuery({
    queryKey: ['payroll', payrollMonth, payrollYear],
    queryFn: () => workforceService.getPayrollSummary(payrollMonth, payrollYear).then(r => r.data),
    staleTime: 60_000,
    enabled: tab === 'payroll',
  });

  const { data: forecast } = useQuery({
    queryKey: ['staffing-forecast'],
    queryFn: () => workforceService.getStaffingForecast().then(r => r.data),
    staleTime: 300_000,
    enabled: tab === 'forecast',
  });

  const handleExportPayroll = () => {
    if (!payroll?.payroll?.length) return;
    const rows = [['Name', 'Role', 'Regular Hours', 'Overtime Hours', 'Rate', 'Regular Pay', 'Overtime Pay', 'Total Pay']];
    payroll.payroll.forEach(p => {
      rows.push([p.staff?.name || 'Unknown', p.role, p.regularHours, p.overtimeHours, p.rate, p.regularPay, p.overtimePay, p.totalPay]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `payroll-${payrollMonth}-${payrollYear}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Payroll exported');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'forecast', label: 'Staffing Forecast', icon: Zap },
  ];

  const s = labor?.summary;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Workforce Intelligence</h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-1">Labor cost, payroll analytics & staffing optimization</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            className="text-sm bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-gray-700 dark:text-white/70 focus:outline-none">
            {[7, 14, 30, 90].map(d => <option key={d} value={d}>{d}D</option>)}
          </select>
        </div>
      </div>

      {/* Alerts */}
      {labor?.alerts?.length > 0 && (
        <div className="space-y-2">
          {labor.alerts.map((a, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${a.severity === 'critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
              <AlertTriangle size={15} />
              {a.message}
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats */}
      {s && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Clock} label="Total Hours" value={`${s.totalHours}h`} sub={`Last ${days} days`} color="bg-blue-500" />
          <StatCard icon={DollarSign} label="Total Wages" value={`${s.totalWages.toLocaleString()} TND`} sub="Gross payroll" color="bg-emerald-500" />
          <StatCard icon={TrendingUp} label="Labor Cost %" value={`${s.laborCostPercent}%`} sub="Target: <35%" color={s.laborCostPercent > 35 ? 'bg-red-500' : 'bg-orange-500'} trend={35 - s.laborCostPercent} />
          <StatCard icon={Users} label="Cost / Hour" value={`${s.costPerHour.toFixed(2)} TND`} sub="Average hourly cost" color="bg-purple-500" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-700 dark:text-white/70 mb-4 uppercase tracking-wider">Team Performance</h2>
            {isLoading ? <div className="h-48 flex items-center justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div> : (
              <div className="space-y-3">
                {labor?.staff?.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/4 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: ROLE_COLORS[s.role] || '#6b7280' }}>
                      {s.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 dark:text-white truncate">{s.name}</div>
                      <div className="text-xs text-gray-400 dark:text-white/35 capitalize">{s.role} · {s.shifts} shifts</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{s.wages.toFixed(0)} TND</div>
                      <div className="text-xs text-gray-400 dark:text-white/35">{s.hours}h worked</div>
                    </div>
                    {s.overtime > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        +{s.overtime}h OT
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {labor?.staff?.length > 0 && (
            <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-gray-700 dark:text-white/70 mb-4 uppercase tracking-wider">Wages by Staff</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={labor.staff.slice(0, 8)} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'rgba(156,163,175,1)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'rgba(156,163,175,1)' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip formatter={(v) => [`${v} TND`, 'Wages']} contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#f97316' }} />
                  <Bar dataKey="wages" fill="#f97316" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Payroll tab */}
      {tab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={payrollMonth} onChange={e => setPayrollMonth(Number(e.target.value))}
              className="text-sm bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-gray-700 dark:text-white/70 focus:outline-none">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select value={payrollYear} onChange={e => setPayrollYear(Number(e.target.value))}
              className="text-sm bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-gray-700 dark:text-white/70 focus:outline-none">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={handleExportPayroll}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors ml-auto">
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/6">
                  {['Employee', 'Role', 'Regular Hrs', 'OT Hrs', 'Regular Pay', 'OT Pay (1.5x)', 'Total Pay', 'Attendance'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 dark:text-white/35 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payrollLoading ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                ) : payroll?.payroll?.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-white/4 hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: ROLE_COLORS[p.role] || '#6b7280' }}>
                          {p.staff?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-white">{p.staff?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-400 dark:text-white/35">{p.staff?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: `${ROLE_COLORS[p.role]}20`, color: ROLE_COLORS[p.role] }}>{p.role}</span></td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-white/70">{p.regularHours}h</td>
                    <td className="px-5 py-3 text-sm">{p.overtimeHours > 0 ? <span className="text-amber-500 font-semibold">{p.overtimeHours}h</span> : <span className="text-gray-400">—</span>}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-white/70">{p.regularPay.toFixed(2)}</td>
                    <td className="px-5 py-3 text-sm text-amber-500 font-semibold">{p.overtimePay > 0 ? p.overtimePay.toFixed(2) : '—'}</td>
                    <td className="px-5 py-3 text-sm font-bold text-gray-900 dark:text-white">{p.totalPay.toFixed(2)} TND</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">{p.attendance.present}P</span>
                        {p.attendance.late > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">{p.attendance.late}L</span>}
                        {p.attendance.absent > 0 && <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400">{p.attendance.absent}A</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {payroll?.grandTotal > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3">
                    <td colSpan={6} className="px-5 py-3 text-sm font-bold text-gray-700 dark:text-white/70 text-right">Grand Total</td>
                    <td className="px-5 py-3 text-base font-black text-orange-500">{payroll.grandTotal.toFixed(2)} TND</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Forecast tab */}
      {tab === 'forecast' && (
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Zap size={16} className="text-orange-500" />
            <h2 className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider">Staffing Recommendations — Today</h2>
          </div>
          {!forecast?.recommendations?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Not enough historical data yet. Come back after a week of orders.</p>
          ) : (
            <div className="space-y-3">
              {forecast.recommendations.map((r, i) => (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${r.isPeak ? 'border-orange-500/30 bg-orange-500/5' : 'border-gray-100 dark:border-white/6'}`}>
                  <div className={`text-sm font-black w-14 ${r.isPeak ? 'text-orange-500' : 'text-gray-500 dark:text-white/40'}`}>{r.hour}</div>
                  {r.isPeak && <span className="text-xs font-bold px-2 py-0.5 bg-orange-500 text-white rounded-full">PEAK</span>}
                  <div className="flex-1 flex gap-6 text-sm">
                    <div><span className="text-gray-400 dark:text-white/35">Orders: </span><span className="font-bold text-gray-800 dark:text-white">{r.expectedOrders}</span></div>
                    <div><span className="text-gray-400 dark:text-white/35">Waiters: </span><span className="font-bold text-blue-500">{r.neededWaiters}</span></div>
                    <div><span className="text-gray-400 dark:text-white/35">Kitchen: </span><span className="font-bold text-orange-500">{r.neededKitchen}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
