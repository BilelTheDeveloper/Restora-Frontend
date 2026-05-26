import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Mail, MessageSquare, Send, Plus, X, Users, TrendingUp, BarChart2, Zap, Clock, CheckCircle, Pause, Eye } from 'lucide-react';
import { campaignService } from '../../services/campaignService';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'text-gray-400 bg-gray-100 dark:bg-white/8', icon: Clock },
  scheduled: { label: 'Scheduled', color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/15', icon: Clock },
  running:   { label: 'Running',   color: 'text-orange-500 bg-orange-50 dark:bg-orange-500/15', icon: Zap },
  completed: { label: 'Completed', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15', icon: CheckCircle },
  paused:    { label: 'Paused',    color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15', icon: Pause },
};

const TYPE_CONFIG = {
  email:    { label: 'Email',    icon: Mail, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/15' },
  sms:      { label: 'SMS',      icon: MessageSquare, color: 'text-teal-600 bg-teal-50 dark:bg-teal-500/15' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15' },
  push:     { label: 'Push',     icon: Send, color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/15' },
};

const TRIGGER_LABELS = {
  manual: 'Manual Send', birthday: 'Birthday', inactive: 'Inactive Customer', big_spender: 'Big Spender',
  low_occupancy: 'Low Occupancy', new_customer: 'New Customer', abandoned_reservation: 'Abandoned Reservation', winback: 'Win-back',
};

const EMPTY_CAMPAIGN = { name: '', type: 'sms', trigger: 'manual', message: '', segment: { type: 'all' }, couponCode: '', discountPercent: 0 };

export default function Campaigns() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_CAMPAIGN);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { data: stats } = useQuery({ queryKey: ['campaign-stats'], queryFn: () => campaignService.getStats().then(r => r.data) });
  const params = tab !== 'all' ? { type: tab } : {};
  const { data: campaigns = [], isLoading } = useQuery({ queryKey: ['campaigns', tab], queryFn: () => campaignService.getCampaigns(params).then(r => r.data) });

  const createCampaign = useMutation({
    mutationFn: (data) => campaignService.create(data),
    onSuccess: () => { toast.success('Campaign created'); qc.invalidateQueries(['campaigns']); qc.invalidateQueries(['campaign-stats']); setShowModal(false); setForm(EMPTY_CAMPAIGN); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const sendCampaign = useMutation({
    mutationFn: (id) => campaignService.send(id),
    onSuccess: (r) => { toast.success(r.data.message); qc.invalidateQueries(['campaigns']); qc.invalidateQueries(['campaign-stats']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteCampaign = useMutation({
    mutationFn: (id) => campaignService.remove(id),
    onSuccess: () => { toast.success('Campaign deleted'); qc.invalidateQueries(['campaigns']); },
  });

  const charCount = form.message?.length || 0;
  const smsCount = form.type === 'sms' ? Math.ceil(charCount / 160) : null;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Marketing Automation</h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-1">Email, SMS & WhatsApp campaigns to grow revenue</p>
        </div>
        <button onClick={() => { setForm(EMPTY_CAMPAIGN); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors">
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Megaphone, label: 'Total Campaigns', value: stats.totalCampaigns, color: 'bg-blue-500' },
            { icon: Zap, label: 'Running', value: stats.running, color: 'bg-orange-500' },
            { icon: Send, label: 'Total Sent', value: stats.totalSent?.toLocaleString() || '0', color: 'bg-teal-500' },
            { icon: Eye, label: 'Open Rate', value: `${stats.openRate}%`, color: 'bg-purple-500' },
          ].map((c, i) => (
            <div key={i} className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider">{c.label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.color}`}><c.icon size={17} className="text-white" /></div>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Channel tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
        {[['all', 'All'], ['sms', 'SMS'], ['email', 'Email'], ['whatsapp', 'WhatsApp']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Campaigns grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Megaphone size={32} className="mx-auto mb-2 opacity-30" />
            No campaigns yet. Create your first campaign to engage customers.
          </div>
        ) : campaigns.map((c) => {
          const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
          const ty = TYPE_CONFIG[c.type] || TYPE_CONFIG.sms;
          const StIcon = st.icon;
          const TyIcon = ty.icon;
          return (
            <motion.div key={c._id} layout className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-5 hover:border-orange-500/30 transition-all flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${ty.color}`}><TyIcon size={11} />{ty.label}</span>
                  <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${st.color}`}><StIcon size={11} />{st.label}</span>
                </div>
                <button onClick={() => { if (confirm('Delete campaign?')) deleteCampaign.mutate(c._id); }} className="w-6 h-6 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"><X size={12} /></button>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-800 dark:text-white mb-1">{c.name}</div>
                <div className="text-xs text-gray-500 dark:text-white/40 line-clamp-2">{c.message}</div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-white/30">
                <span className="capitalize">{TRIGGER_LABELS[c.trigger] || c.trigger}</span>
                <span className="capitalize">{c.segment?.type || 'All'} customers</span>
              </div>
              {c.status === 'completed' && (
                <div className="flex gap-3 text-xs bg-gray-50 dark:bg-white/4 rounded-xl p-3">
                  <div className="text-center flex-1"><div className="font-bold text-gray-800 dark:text-white">{c.stats.sent}</div><div className="text-gray-400">Sent</div></div>
                  <div className="text-center flex-1"><div className="font-bold text-gray-800 dark:text-white">{c.stats.delivered}</div><div className="text-gray-400">Delivered</div></div>
                  <div className="text-center flex-1"><div className="font-bold text-gray-800 dark:text-white">{c.stats.opened}</div><div className="text-gray-400">Opened</div></div>
                </div>
              )}
              {c.status === 'draft' && (
                <button onClick={() => sendCampaign.mutate(c._id)} disabled={sendCampaign.isPending}
                  className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Send size={13} /> Send Now
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">New Campaign</h3>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 text-gray-500 flex items-center justify-center"><X size={14} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Campaign Name *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Weekend Lunch Offer"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none focus:border-orange-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Channel</label>
                    <select value={form.type} onChange={e => set('type', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none">
                      {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Trigger</label>
                    <select value={form.trigger} onChange={e => set('trigger', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none">
                      {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Audience Segment</label>
                  <select value={form.segment?.type} onChange={e => set('segment', { ...form.segment, type: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none">
                    {[['all', 'All Customers'], ['vip', 'VIP Only'], ['inactive', 'Inactive (30+ days)'], ['new', 'New Customers'], ['birthday', 'Birthday This Month'], ['high_spender', 'High Spenders']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block flex items-center justify-between">
                    <span>Message *</span>
                    {smsCount && <span className={`${charCount > 160 ? 'text-amber-500' : 'text-gray-400'}`}>{charCount} chars · {smsCount} SMS</span>}
                  </label>
                  <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={4} placeholder="Write your message..."
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none focus:border-orange-500/50 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Coupon Code</label>
                    <input value={form.couponCode} onChange={e => set('couponCode', e.target.value)} placeholder="e.g. SUMMER20"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Discount %</label>
                    <input type="number" value={form.discountPercent} onChange={e => set('discountPercent', parseFloat(e.target.value) || 0)} min="0" max="100"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                  </div>
                </div>
              </div>
              <button onClick={() => createCampaign.mutate(form)} disabled={!form.name || !form.message || createCampaign.isPending}
                className="w-full mt-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
                {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
