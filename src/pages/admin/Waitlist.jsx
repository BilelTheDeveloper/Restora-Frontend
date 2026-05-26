import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, UserCheck, UserX, Plus, X, Bell, CheckCircle, Crown, Armchair } from 'lucide-react';
import { waitlistService } from '../../services/waitlistService';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  waiting:   'border-l-amber-400 bg-amber-50/30 dark:bg-amber-500/5',
  notified:  'border-l-blue-400 bg-blue-50/30 dark:bg-blue-500/5',
  seated:    'border-l-emerald-400 bg-emerald-50/30 dark:bg-emerald-500/5',
  cancelled: 'border-l-gray-300 bg-gray-50/30 dark:bg-white/3',
  no_show:   'border-l-red-400 bg-red-50/30 dark:bg-red-500/5',
};

function formatWait(createdAt) {
  const mins = Math.floor((Date.now() - new Date(createdAt)) / 60000);
  if (mins < 1) return 'Just arrived';
  if (mins < 60) return `${mins}m waiting`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m waiting`;
}

export default function Waitlist() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('waiting');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSeatModal, setShowSeatModal] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', partySize: 2, notes: '', priority: 'normal' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['waitlist-stats'],
    queryFn: () => waitlistService.getStats().then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ['waitlist', statusFilter],
    queryFn: () => waitlistService.getWaitlist({ status: statusFilter }).then(r => r.data),
    refetchInterval: 15_000,
  });

  const { data: availableTables = [] } = useQuery({
    queryKey: ['available-tables', showSeatModal?.partySize],
    queryFn: () => waitlistService.getTables({ partySize: showSeatModal?.partySize }).then(r => r.data),
    enabled: !!showSeatModal,
  });

  const addEntry = useMutation({
    mutationFn: (data) => waitlistService.add(data),
    onSuccess: () => { toast.success('Added to waitlist'); qc.invalidateQueries(['waitlist']); qc.invalidateQueries(['waitlist-stats']); setShowAddModal(false); setForm({ name: '', phone: '', partySize: 2, notes: '', priority: 'normal' }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const updateEntry = useMutation({
    mutationFn: ({ id, data }) => waitlistService.update(id, data),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['waitlist']); qc.invalidateQueries(['waitlist-stats']); setShowSeatModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const notify = (entry) => updateEntry.mutate({ id: entry._id, data: { status: 'notified' } });
  const cancel = (entry) => { if (confirm('Cancel this entry?')) updateEntry.mutate({ id: entry._id, data: { status: 'cancelled' } }); };
  const noShow = (entry) => updateEntry.mutate({ id: entry._id, data: { status: 'no_show' } });

  const filterTabs = [
    { id: 'waiting', label: 'Queue', count: stats?.currentWaiting },
    { id: 'notified', label: 'Notified' },
    { id: 'seated', label: "Today's Seated", id2: 'seated' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Guest Waitlist</h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-1">Manage walk-ins, queue positions & table assignments</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors">
          <Plus size={14} /> Add Guest
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { icon: Users, label: 'Waiting Now', value: stats.currentWaiting, color: 'bg-amber-500' },
            { icon: Clock, label: 'Avg Wait', value: `${stats.avgWaitMinutes}m`, color: 'bg-blue-500' },
            { icon: UserCheck, label: 'Seated Today', value: stats.seatedToday, color: 'bg-emerald-500' },
            { icon: UserX, label: 'No-Shows', value: stats.noShowToday, color: 'bg-red-500' },
            { icon: X, label: 'Cancelled', value: stats.cancelledToday, color: 'bg-gray-400' },
          ].map((c, i) => (
            <div key={i} className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color} flex-shrink-0`}><c.icon size={17} className="text-white" /></div>
              <div>
                <div className="text-xl font-black text-gray-900 dark:text-white">{c.value}</div>
                <div className="text-xs text-gray-400 dark:text-white/35">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
        {[['waiting', 'Queue'], ['notified', 'Notified'], ['seated', 'Seated Today'], ['all', 'All']].map(([id, label]) => (
          <button key={id} onClick={() => setStatusFilter(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${statusFilter === id ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/40'}`}>
            {label}
            {id === 'waiting' && stats?.currentWaiting > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">{stats.currentWaiting}</span>
            )}
          </button>
        ))}
      </div>

      {/* Queue */}
      <div className="space-y-3">
        {isLoading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          : entries.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              {statusFilter === 'waiting' ? 'No guests waiting right now 🎉' : 'Nothing here'}
            </div>
          ) : entries.map((entry, i) => (
            <motion.div key={entry._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`bg-white dark:bg-[#111111] border border-l-4 border-gray-100 dark:border-white/6 rounded-2xl p-4 ${STATUS_COLORS[entry.status] || ''}`}>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center text-lg font-black text-gray-500 dark:text-white/40">
                  {entry.queuePosition || i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800 dark:text-white">{entry.name}</span>
                    {entry.priority === 'vip' && <Crown size={13} className="text-yellow-500" />}
                    <span className="text-xs font-semibold text-gray-400 dark:text-white/30">· {entry.partySize} guests</span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-white/35 flex items-center gap-3 mt-0.5">
                    <span>📞 {entry.phone}</span>
                    <span className="text-amber-500">{formatWait(entry.createdAt)}</span>
                    {entry.notes && <span>· {entry.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {entry.status === 'waiting' && (
                    <>
                      <button onClick={() => notify(entry)} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/15 text-blue-600 hover:bg-blue-200 transition-colors">
                        <Bell size={12} /> Notify
                      </button>
                      <button onClick={() => setShowSeatModal(entry)} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 hover:bg-emerald-200 transition-colors">
                        <Armchair size={12} /> Seat
                      </button>
                      <button onClick={() => cancel(entry)} className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-400 hover:text-red-500 flex items-center justify-center transition-colors">
                        <X size={13} />
                      </button>
                    </>
                  )}
                  {entry.status === 'notified' && (
                    <>
                      <button onClick={() => setShowSeatModal(entry)} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 hover:bg-emerald-200 transition-colors">
                        <Armchair size={12} /> Seat
                      </button>
                      <button onClick={() => noShow(entry)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-500/15 text-red-500 hover:bg-red-200 transition-colors">No-show</button>
                    </>
                  )}
                  {entry.status === 'seated' && <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle size={13} /> Seated {entry.table ? `· T${entry.table.number}` : ''}</span>}
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Add to Waitlist</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 text-gray-500 flex items-center justify-center"><X size={14} /></button>
              </div>
              <div className="space-y-3">
                {[['name', 'Guest Name *', 'text', 'John Smith'], ['phone', 'Phone *', 'tel', '+216 XX XXX XXX']].map(([field, label, type, ph]) => (
                  <div key={field}>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">{label}</label>
                    <input type={type} value={form[field]} onChange={e => set(field, e.target.value)} placeholder={ph}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none focus:border-orange-500/50" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Party Size</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <button key={n} onClick={() => set('partySize', n)}
                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${form.partySize === n ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/8 text-gray-600 dark:text-white/50 hover:bg-orange-100'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Priority</label>
                  <div className="flex gap-2">
                    {[['normal', 'Normal'], ['vip', 'VIP']].map(([v, l]) => (
                      <button key={v} onClick={() => set('priority', v)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${form.priority === v ? (v === 'vip' ? 'bg-yellow-500 text-white' : 'bg-orange-500 text-white') : 'bg-gray-100 dark:bg-white/8 text-gray-600 dark:text-white/50'}`}>
                        {v === 'vip' && '👑 '}{l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Notes</label>
                  <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Dietary needs, occasion..."
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                </div>
              </div>
              <button onClick={() => addEntry.mutate(form)} disabled={!form.name || !form.phone || addEntry.isPending}
                className="w-full mt-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
                {addEntry.isPending ? 'Adding...' : `Add ${form.name || 'Guest'} · Party of ${form.partySize}`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seat Modal */}
      <AnimatePresence>
        {showSeatModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowSeatModal(null); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Seat Guest</h3>
                <button onClick={() => setShowSeatModal(null)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 text-gray-500 flex items-center justify-center"><X size={14} /></button>
              </div>
              <p className="text-sm text-gray-500 dark:text-white/50 mb-4">{showSeatModal.name} · Party of {showSeatModal.partySize}</p>
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-white/35 uppercase">Available Tables</p>
                {availableTables.length === 0 ? (
                  <p className="text-sm text-gray-400">No tables available for {showSeatModal.partySize} guests</p>
                ) : availableTables.map(t => (
                  <button key={t._id} onClick={() => updateEntry.mutate({ id: showSeatModal._id, data: { status: 'seated', table: t._id } })}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-gray-100 dark:border-white/6 hover:border-emerald-300 rounded-xl transition-all text-left">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">Table {t.number}</span>
                    <span className="text-xs text-gray-400">{t.capacity} seats · Floor {t.floor || 1}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => updateEntry.mutate({ id: showSeatModal._id, data: { status: 'seated' } })}
                className="w-full py-2 border border-emerald-300 dark:border-emerald-500/30 text-emerald-600 text-sm font-bold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                Seat without table assignment
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
