import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Zap, Clock, TrendingDown, Settings, Plus, X, ToggleLeft, ToggleRight, Sun, Moon } from 'lucide-react';
import { pricingService } from '../../services/pricingService';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  happy_hour:    { label: 'Happy Hour',    color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/15', icon: Sun },
  peak_surcharge:{ label: 'Peak Surcharge',color: 'text-red-500 bg-red-50 dark:bg-red-500/15', icon: TrendingDown },
  lunch_deal:    { label: 'Lunch Deal',    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15', icon: Clock },
  low_occupancy: { label: 'Low Occupancy', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/15', icon: TrendingDown },
  demand_based:  { label: 'Demand Based',  color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/15', icon: Zap },
  loyalty:       { label: 'Loyalty',       color: 'text-pink-600 bg-pink-50 dark:bg-pink-500/15', icon: Tag },
  bulk:          { label: 'Bulk Order',    color: 'text-teal-600 bg-teal-50 dark:bg-teal-500/15', icon: Tag },
  early_bird:    { label: 'Early Bird',    color: 'text-orange-600 bg-orange-50 dark:bg-orange-500/15', icon: Moon },
};

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const EMPTY_RULE = {
  name: '', type: 'happy_hour', isActive: true, description: '',
  trigger: { conditionType: 'time', startTime: '12:00', endTime: '14:00', days: [], minOccupancy: 0, maxOccupancy: 50 },
  action: { actionType: 'percent_off', value: 15 },
  appliesTo: { scopeType: 'all' },
  validFrom: '', validUntil: '',
};

export default function DynamicPricing() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(EMPTY_RULE);
  const set = (path, val) => setForm(f => {
    const keys = path.split('.');
    if (keys.length === 1) return { ...f, [keys[0]]: val };
    if (keys.length === 2) return { ...f, [keys[0]]: { ...f[keys[0]], [keys[1]]: val } };
    return f;
  });

  const { data: stats } = useQuery({ queryKey: ['pricing-stats'], queryFn: () => pricingService.getStats().then(r => r.data) });
  const { data: rules = [], isLoading } = useQuery({ queryKey: ['pricing-rules'], queryFn: () => pricingService.getRules().then(r => r.data) });
  const { data: activeRules = [] } = useQuery({ queryKey: ['active-rules'], queryFn: () => pricingService.getActive().then(r => r.data), refetchInterval: 60_000 });

  const createRule = useMutation({
    mutationFn: (data) => editingRule ? pricingService.update(editingRule._id, data) : pricingService.create(data),
    onSuccess: () => { toast.success(editingRule ? 'Rule updated' : 'Rule created'); qc.invalidateQueries(['pricing-rules']); qc.invalidateQueries(['pricing-stats']); qc.invalidateQueries(['active-rules']); setShowModal(false); setEditingRule(null); setForm(EMPTY_RULE); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const toggleRule = useMutation({
    mutationFn: ({ id, isActive }) => pricingService.update(id, { isActive }),
    onSuccess: () => { qc.invalidateQueries(['pricing-rules']); qc.invalidateQueries(['active-rules']); },
  });

  const deleteRule = useMutation({
    mutationFn: (id) => pricingService.remove(id),
    onSuccess: () => { toast.success('Rule deleted'); qc.invalidateQueries(['pricing-rules']); qc.invalidateQueries(['pricing-stats']); },
  });

  const openEdit = (rule) => {
    setEditingRule(rule);
    setForm({ name: rule.name, type: rule.type, isActive: rule.isActive, description: rule.description || '', trigger: { ...rule.trigger }, action: { ...rule.action }, appliesTo: { ...rule.appliesTo }, validFrom: rule.validFrom ? rule.validFrom.split('T')[0] : '', validUntil: rule.validUntil ? rule.validUntil.split('T')[0] : '' });
    setShowModal(true);
  };

  const toggleDay = (day) => {
    const days = form.trigger.days || [];
    set('trigger.days', days.includes(day) ? days.filter(d => d !== day) : [...days, day]);
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Dynamic Pricing</h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-1">Happy hours, peak surcharges, lunch deals & demand-based pricing</p>
        </div>
        <button onClick={() => { setEditingRule(null); setForm(EMPTY_RULE); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors">
          <Plus size={14} /> New Rule
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Rules', value: stats.totalRules, color: 'bg-blue-500', icon: Settings },
            { label: 'Active Now', value: activeRules.length, color: 'bg-emerald-500', icon: Zap },
            { label: 'Total Usage', value: stats.totalUsage, color: 'bg-orange-500', icon: Tag },
          ].map((c, i) => (
            <div key={i} className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color}`}><c.icon size={19} className="text-white" /></div>
              <div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">{c.value}</div>
                <div className="text-xs text-gray-400 dark:text-white/35">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active now banner */}
      {activeRules.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
            <Zap size={15} /> {activeRules.length} rule{activeRules.length !== 1 ? 's' : ''} active right now
          </div>
          <div className="flex flex-wrap gap-2">
            {activeRules.map(r => (
              <span key={r._id} className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">{r.name} — {r.action.actionType === 'percent_off' ? `-${r.action.value}%` : `+${r.action.value}%`}</span>
            ))}
          </div>
        </div>
      )}

      {/* Rules list */}
      <div className="space-y-3">
        {isLoading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          : rules.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Tag size={32} className="mx-auto mb-2 opacity-30" />
              No pricing rules yet. Create your first rule to attract customers.
            </div>
          ) : rules.map((rule) => {
            const tc = TYPE_CONFIG[rule.type] || TYPE_CONFIG.happy_hour;
            const TcIcon = tc.icon;
            const isActiveNow = activeRules.some(r => r._id === rule._id);
            return (
              <motion.div key={rule._id} layout className={`bg-white dark:bg-[#111111] border ${isActiveNow ? 'border-emerald-300 dark:border-emerald-500/40' : 'border-gray-100 dark:border-white/6'} rounded-2xl p-5`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tc.color.includes('bg-') ? tc.color.split(' ').find(c => c.startsWith('bg-')) || 'bg-gray-100' : 'bg-gray-100'} dark:bg-white/8`}>
                    <TcIcon size={16} className={tc.color.split(' ')[0]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-800 dark:text-white">{rule.name}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tc.color}`}>{tc.label}</span>
                      {isActiveNow && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live</span>}
                      {!rule.isActive && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/8 text-gray-400">Disabled</span>}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-white/35 mt-1 flex flex-wrap gap-3">
                      {rule.trigger.conditionType === 'time' && rule.trigger.startTime && <span>🕐 {rule.trigger.startTime} – {rule.trigger.endTime}</span>}
                      {rule.trigger.conditionType === 'day_of_week' && rule.trigger.days?.length > 0 && <span>📅 {rule.trigger.days.map(d => d.slice(0, 3)).join(', ')}</span>}
                      {rule.trigger.conditionType === 'occupancy' && <span>📊 Below {rule.trigger.maxOccupancy}% occupancy</span>}
                      <span className="font-semibold text-gray-500 dark:text-white/40">
                        {rule.action.actionType === 'percent_off' && `−${rule.action.value}% discount`}
                        {rule.action.actionType === 'percent_on' && `+${rule.action.value}% surcharge`}
                        {rule.action.actionType === 'fixed_off' && `−${rule.action.value} TND off`}
                      </span>
                    </div>
                    {rule.description && <div className="text-xs text-gray-400 mt-1">{rule.description}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleRule.mutate({ id: rule._id, isActive: !rule.isActive })} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${rule.isActive ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600' : 'bg-gray-100 dark:bg-white/8 text-gray-400'}`}>
                      {rule.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => openEdit(rule)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 text-gray-500 hover:bg-orange-100 hover:text-orange-500 flex items-center justify-center transition-colors text-xs">✏</button>
                    <button onClick={() => { if (confirm('Delete rule?')) deleteRule.mutate(rule._id); }} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 text-gray-400 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors"><X size={14} /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{editingRule ? 'Edit Rule' : 'New Pricing Rule'}</h3>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 text-gray-500 flex items-center justify-center"><X size={14} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Rule Name *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Happy Hour Monday"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none focus:border-orange-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Rule Type</label>
                    <select value={form.type} onChange={e => set('type', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none">
                      {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Condition</label>
                    <select value={form.trigger.conditionType} onChange={e => set('trigger.conditionType', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none">
                      {[['time', 'Time Range'], ['day_of_week', 'Day of Week'], ['occupancy', 'Occupancy'], ['manual', 'Manual']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {/* Time trigger */}
                {form.trigger.conditionType === 'time' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Start Time</label>
                      <input type="time" value={form.trigger.startTime} onChange={e => set('trigger.startTime', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">End Time</label>
                      <input type="time" value={form.trigger.endTime} onChange={e => set('trigger.endTime', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                    </div>
                  </div>
                )}

                {/* Day trigger */}
                {form.trigger.conditionType === 'day_of_week' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-2 block">Days</label>
                    <div className="flex gap-2">
                      {DAYS_SHORT.map((d, i) => (
                        <button key={d} type="button" onClick={() => toggleDay(DAYS_FULL[i])}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${form.trigger.days?.includes(DAYS_FULL[i]) ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-white/40'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Occupancy trigger */}
                {form.trigger.conditionType === 'occupancy' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Max Occupancy % to trigger</label>
                    <input type="number" value={form.trigger.maxOccupancy} onChange={e => set('trigger.maxOccupancy', parseInt(e.target.value) || 0)} min="0" max="100"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                  </div>
                )}

                {/* Action */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Action</label>
                    <select value={form.action.actionType} onChange={e => set('action.actionType', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none">
                      {[['percent_off', '% Discount'], ['percent_on', '% Surcharge'], ['fixed_off', 'Fixed TND Off']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Value</label>
                    <input type="number" value={form.action.value} onChange={e => set('action.value', parseFloat(e.target.value) || 0)} min="0" max="100"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Description (optional)</label>
                  <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Internal note about this rule"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Valid From</label>
                    <input type="date" value={form.validFrom} onChange={e => set('validFrom', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Valid Until</label>
                    <input type="date" value={form.validUntil} onChange={e => set('validUntil', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/4 rounded-xl">
                  <button type="button" onClick={() => set('isActive', !form.isActive)} className={`w-10 h-6 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'} relative`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-sm font-semibold text-gray-700 dark:text-white/70">{form.isActive ? 'Rule Active' : 'Rule Disabled'}</span>
                </div>
              </div>
              <button onClick={() => createRule.mutate(form)} disabled={!form.name || createRule.isPending}
                className="w-full mt-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
                {createRule.isPending ? 'Saving...' : editingRule ? 'Save Changes' : 'Create Rule'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
