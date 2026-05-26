import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, PieChart, Plus, X, Download, Receipt, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { financeService } from '../../services/financeService';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = { rent: '#6366f1', utilities: '#3b82f6', payroll: '#f97316', ingredients: '#22c55e', equipment: '#8b5cf6', marketing: '#ec4899', insurance: '#14b8a6', maintenance: '#f59e0b', licenses: '#64748b', packaging: '#84cc16', other: '#9ca3af' };
const CATEGORIES = ['rent', 'utilities', 'payroll', 'ingredients', 'equipment', 'marketing', 'insurance', 'maintenance', 'licenses', 'packaging', 'other'];

function KPICard({ icon: Icon, label, value, sub, change, color, inverted }) {
  const isPos = inverted ? change <= 0 : change >= 0;
  return (
    <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}><Icon size={17} className="text-white" /></div>
      </div>
      <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-white/35">{sub}</div>}
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
          {isPos ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(change)}% vs last month
        </div>
      )}
    </div>
  );
}

const EMPTY_EXPENSE = { category: 'ingredients', description: '', amount: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'cash', vendor: '', isRecurring: false };

export default function Finance() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('pl');
  const [months, setMonths] = useState(6);
  const [expenseMonth, setExpenseMonth] = useState(new Date().getMonth() + 1);
  const [expenseYear, setExpenseYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_EXPENSE);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { data: summary } = useQuery({ queryKey: ['finance-summary'], queryFn: () => financeService.getSummary().then(r => r.data) });
  const { data: pnl = [], isLoading: pnlLoading } = useQuery({ queryKey: ['pnl', months], queryFn: () => financeService.getPnL(months).then(r => r.data) });
  const { data: expenses = [], isLoading: expLoading } = useQuery({
    queryKey: ['expenses', expenseMonth, expenseYear],
    queryFn: () => financeService.getExpenses({ month: expenseMonth, year: expenseYear }).then(r => r.data),
    enabled: tab === 'expenses',
  });

  const createExpense = useMutation({
    mutationFn: (data) => financeService.createExpense(data),
    onSuccess: () => { toast.success('Expense recorded'); qc.invalidateQueries(['expenses']); qc.invalidateQueries(['finance-summary']); setShowModal(false); setForm(EMPTY_EXPENSE); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteExpense = useMutation({
    mutationFn: (id) => financeService.deleteExpense(id),
    onSuccess: () => { toast.success('Expense deleted'); qc.invalidateQueries(['expenses']); qc.invalidateQueries(['finance-summary']); },
  });

  const pieData = summary?.expensesByCategory?.map(e => ({ name: e._id, value: e.total, color: CATEGORY_COLORS[e._id] || '#9ca3af' })) || [];

  const exportExpenses = () => {
    if (!expenses.length) return;
    const rows = [['Date', 'Category', 'Description', 'Vendor', 'Amount', 'Payment'], ...expenses.map(e => [new Date(e.date).toLocaleDateString(), e.category, e.description, e.vendor || '', e.amount, e.paymentMethod])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `expenses-${expenseMonth}-${expenseYear}.csv`; a.click();
    toast.success('Exported');
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Finance & Accounting</h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-1">P&L, expenses, cash flow and margin analysis</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors">
          <Plus size={14} /> Add Expense
        </button>
      </div>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={TrendingUp} label="Revenue (MTD)" value={`${(summary.revenue || 0).toLocaleString()} TND`} change={summary.revenueGrowth} color="bg-emerald-500" />
          <KPICard icon={Receipt} label="Expenses (MTD)" value={`${(summary.expenses || 0).toLocaleString()} TND`} change={summary.expenseGrowth} color="bg-red-500" inverted />
          <KPICard icon={DollarSign} label="Net Profit" value={`${(summary.profit || 0).toLocaleString()} TND`} sub={`${summary.margin || 0}% margin`} color={summary.profit >= 0 ? 'bg-blue-500' : 'bg-red-500'} />
          <KPICard icon={PieChart} label="Profit Margin" value={`${summary.margin || 0}%`} sub="Revenue - Expenses / Revenue" color="bg-purple-500" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
          {[['pl', 'P&L Chart'], ['expenses', 'Expenses'], ['breakdown', 'Breakdown']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'}`}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'pl' && (
          <select value={months} onChange={e => setMonths(Number(e.target.value))}
            className="text-sm bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 dark:text-white/70 focus:outline-none">
            {[3, 6, 9, 12].map(m => <option key={m} value={m}>{m} months</option>)}
          </select>
        )}
      </div>

      {/* P&L Chart */}
      {tab === 'pl' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-5">Revenue vs Expenses vs Profit</h3>
            {pnlLoading ? <div className="h-64 flex items-center justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={pnl} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(156,163,175,1)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(156,163,175,1)' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v.toLocaleString()} TND`]} contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} labelStyle={{ color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/6">
                  {['Month', 'Revenue', 'Expenses', 'Profit', 'Margin'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-400 dark:text-white/35 uppercase tracking-wider px-5 py-3">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {pnl.map((row) => (
                  <tr key={row.label} className="border-b border-gray-50 dark:border-white/4 hover:bg-gray-50 dark:hover:bg-white/3">
                    <td className="px-5 py-3 text-sm font-bold text-gray-800 dark:text-white">{row.label}</td>
                    <td className="px-5 py-3 text-sm text-emerald-600 font-semibold">{row.revenue.toLocaleString()} TND</td>
                    <td className="px-5 py-3 text-sm text-red-500 font-semibold">{row.expenses.toLocaleString()} TND</td>
                    <td className="px-5 py-3 text-sm font-bold" style={{ color: row.profit >= 0 ? '#3b82f6' : '#ef4444' }}>{row.profit.toLocaleString()} TND</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.margin >= 20 ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600' : row.margin >= 10 ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600' : 'bg-red-100 dark:bg-red-500/15 text-red-500'}`}>
                        {row.margin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses tab */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={expenseMonth} onChange={e => setExpenseMonth(Number(e.target.value))}
              className="text-sm bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 dark:text-white/70 focus:outline-none">
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>)}
            </select>
            <select value={expenseYear} onChange={e => setExpenseYear(Number(e.target.value))}
              className="text-sm bg-gray-50 dark:bg-white/6 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 dark:text-white/70 focus:outline-none">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={exportExpenses} className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ml-auto"><Download size={14} /> Export</button>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/6">
                  {['Date', 'Category', 'Description', 'Vendor', 'Payment', 'Amount', ''].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-400 dark:text-white/35 uppercase tracking-wider px-5 py-3">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {expLoading ? <tr><td colSpan={7} className="py-12 text-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                  : expenses.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No expenses this period</td></tr>
                  : expenses.map((e) => (
                    <tr key={e._id} className="border-b border-gray-50 dark:border-white/4 hover:bg-gray-50 dark:hover:bg-white/3">
                      <td className="px-5 py-3 text-xs text-gray-400">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="px-5 py-3"><span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: `${CATEGORY_COLORS[e.category] || '#9ca3af'}20`, color: CATEGORY_COLORS[e.category] || '#9ca3af' }}>{e.category}</span></td>
                      <td className="px-5 py-3 text-sm text-gray-700 dark:text-white/70">{e.description}</td>
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-white/40">{e.vendor || '—'}</td>
                      <td className="px-5 py-3 text-xs text-gray-400 capitalize">{e.paymentMethod}</td>
                      <td className="px-5 py-3 text-sm font-bold text-red-500">{e.amount.toLocaleString()} TND</td>
                      <td className="px-5 py-3"><button onClick={() => { if (confirm('Delete?')) deleteExpense.mutate(e._id); }} className="w-6 h-6 rounded-lg text-gray-400 hover:text-red-500 flex items-center justify-center"><X size={12} /></button></td>
                    </tr>
                  ))}
              </tbody>
              {expenses.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3">
                    <td colSpan={5} className="px-5 py-3 text-sm font-bold text-right text-gray-600 dark:text-white/50">Total</td>
                    <td className="px-5 py-3 text-base font-black text-red-500">{expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)} TND</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Breakdown tab */}
      {tab === 'breakdown' && pieData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-4">Expenses by Category (MTD)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <RechartsPie>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v.toFixed(2)} TND`]} contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-4">Category Details</h3>
            <div className="space-y-2">
              {pieData.sort((a, b) => b.value - a.value).map((cat, i) => {
                const total = pieData.reduce((s, c) => s + c.value, 0);
                const pct = total > 0 ? (cat.value / total * 100).toFixed(1) : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-700 dark:text-white/70 capitalize">{cat.name}</span>
                        <span className="font-bold text-gray-800 dark:text-white">{cat.value.toFixed(0)} TND</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-white/8 rounded-full">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Record Expense</h3>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 text-gray-500 flex items-center justify-center"><X size={14} /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Category *</label>
                    <select value={form.category} onChange={e => set('category', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none capitalize">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Amount (TND) *</label>
                    <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} min="0" step="0.01" placeholder="0.00"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Description *</label>
                  <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Monthly rent payment"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none focus:border-orange-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Vendor</label>
                    <input value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="Supplier name"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Date</label>
                    <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Payment Method</label>
                  <div className="flex gap-2">
                    {[['cash', 'Cash'], ['card', 'Card'], ['bank_transfer', 'Bank'], ['check', 'Check']].map(([v, l]) => (
                      <button key={v} onClick={() => set('paymentMethod', v)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${form.paymentMethod === v ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/8 text-gray-600 dark:text-white/50'}`}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => createExpense.mutate(form)} disabled={!form.description || !form.amount || createExpense.isPending}
                className="w-full mt-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
                {createExpense.isPending ? 'Saving...' : `Record ${form.amount || '0'} TND Expense`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
