import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Star, Users, TrendingUp, Settings, Plus, X, Award, RefreshCw } from 'lucide-react';
import { loyaltyService } from '../../services/loyaltyService';
import toast from 'react-hot-toast';

const TIER_META = {
  Bronze:   { gradient: 'from-orange-700 to-amber-600', icon: '🥉' },
  Silver:   { gradient: 'from-gray-400 to-slate-500', icon: '🥈' },
  Gold:     { gradient: 'from-yellow-400 to-amber-500', icon: '🥇' },
  Platinum: { gradient: 'from-purple-500 to-violet-600', icon: '💎' },
};

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

export default function Loyalty() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ points: 0, type: 'adjust', note: '' });

  const { data: stats } = useQuery({ queryKey: ['loyalty-stats'], queryFn: () => loyaltyService.getStats().then(r => r.data) });
  const { data: program } = useQuery({ queryKey: ['loyalty-program'], queryFn: () => loyaltyService.getProgram().then(r => r.data) });
  const { data: members = [], isLoading } = useQuery({ queryKey: ['loyalty-members'], queryFn: () => loyaltyService.getMembers().then(r => r.data), enabled: tab === 'members' });
  const { data: transactions = [] } = useQuery({ queryKey: ['loyalty-txns'], queryFn: () => loyaltyService.getTransactions().then(r => r.data), enabled: tab === 'transactions' });

  const [programForm, setProgramForm] = useState(null);

  const updateProgram = useMutation({
    mutationFn: (data) => loyaltyService.updateProgram(data),
    onSuccess: () => { toast.success('Program updated'); qc.invalidateQueries(['loyalty-program']); setShowSettingsModal(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const adjustPoints = useMutation({
    mutationFn: (data) => loyaltyService.adjustPoints(data),
    onSuccess: (r) => { toast.success(`Points adjusted — new balance: ${r.data.newBalance}`); qc.invalidateQueries(['loyalty-members']); qc.invalidateQueries(['loyalty-txns']); setShowAdjustModal(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const openAdjust = (member) => { setSelectedMember(member); setAdjustForm({ points: 0, type: 'adjust', note: '' }); setShowAdjustModal(true); };
  const openSettings = () => { if (program) setProgramForm({ pointsPerDinar: program.pointsPerDinar, pointsValue: program.pointsValue, birthdayBonus: program.birthdayBonus, referralBonus: program.referralBonus, welcomeBonus: program.welcomeBonus, winbackDays: program.winbackDays }); setShowSettingsModal(true); };

  const TX_ICONS = { earn: '💰', redeem: '🎁', bonus: '⭐', birthday: '🎂', referral: '👥', expire: '⏰', adjust: '✏️', welcome: '👋' };
  const TX_COLORS = { earn: 'text-emerald-500', redeem: 'text-purple-500', bonus: 'text-yellow-500', birthday: 'text-pink-500', referral: 'text-blue-500', expire: 'text-red-500', adjust: 'text-gray-500', welcome: 'text-teal-500' };

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Loyalty Engine</h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-1">Points, tiers, rewards & customer retention</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openSettings} className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"><Settings size={14} /> Configure</button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Members" value={stats.totalMembers.toLocaleString()} sub={`${stats.activeMembers} active (30d)`} color="bg-purple-500" />
          <StatCard icon={Star} label="Points Earned" value={stats.pointsEarned.toLocaleString()} sub="Last 30 days" color="bg-yellow-500" />
          <StatCard icon={Gift} label="Points Redeemed" value={stats.pointsRedeemed.toLocaleString()} sub="Last 30 days" color="bg-pink-500" />
          <StatCard icon={TrendingUp} label="Redemption Rate" value={`${stats.redemptionRate}%`} sub="Points redeemed / earned" color="bg-emerald-500" />
        </div>
      )}

      {/* Tier distribution */}
      {stats?.tierCounts?.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.tierCounts.map((t, i) => {
            const meta = TIER_META[t.name] || TIER_META.Bronze;
            return (
              <div key={i} className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${meta.gradient}`}>
                <div className="absolute top-3 right-3 text-2xl">{meta.icon}</div>
                <div className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">{t.name}</div>
                <div className="text-3xl font-black text-white">{t.count}</div>
                <div className="text-white/60 text-xs mt-1">members</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
        {[['overview', 'Overview'], ['members', 'Members'], ['transactions', 'Transactions']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && program && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-4">Program Config</h3>
            <div className="space-y-3">
              {[
                ['Points per TND', program.pointsPerDinar, 'pts/TND'],
                ['Point value', program.pointsValue, 'TND/pt'],
                ['Birthday bonus', program.birthdayBonus, 'pts'],
                ['Referral bonus', program.referralBonus, 'pts'],
                ['Welcome bonus', program.welcomeBonus, 'pts'],
                ['Win-back trigger', program.winbackDays, 'days inactive'],
              ].map(([label, val, unit]) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/4">
                  <span className="text-sm text-gray-500 dark:text-white/50">{label}</span>
                  <span className="text-sm font-bold text-gray-800 dark:text-white">{val} <span className="text-gray-400 dark:text-white/30 font-normal text-xs">{unit}</span></span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-4">Tier Structure</h3>
            <div className="space-y-3">
              {program.tiers?.map((tier, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${tier.color}10` }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: tier.color }} />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-800 dark:text-white">{tier.name}</div>
                    <div className="text-xs text-gray-400 dark:text-white/35">{tier.minPoints.toLocaleString()}+ points · {tier.bonusMultiplier}x multiplier</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Members */}
      {tab === 'members' && (
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/6">
                {['Customer', 'Tier', 'Points', 'Total Spend', 'Visits', 'Last Visit', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 dark:text-white/35 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={7} className="py-12 text-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                : members.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No loyalty members yet</td></tr>
                : members.map((m) => (
                  <tr key={m._id} className="border-b border-gray-50 dark:border-white/4 hover:bg-gray-50 dark:hover:bg-white/3">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">{m.name?.charAt(0) || '?'}</div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-white">{m.name}</div>
                          <div className="text-xs text-gray-400 dark:text-white/35">{m.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${m.tierColor}20`, color: m.tierColor }}>{m.currentTier || '—'}</span></td>
                    <td className="px-5 py-3 text-sm font-bold text-yellow-500">{(m.loyalty?.points || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-white/60">{(m.totalSpend || 0).toFixed(0)} TND</td>
                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-white/40">{m.totalVisits || 0}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">{m.lastVisit ? new Date(m.lastVisit).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-3"><button onClick={() => openAdjust(m)} className="text-xs font-bold px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-500/15 text-purple-600 hover:bg-purple-200 transition-colors">Adjust</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transactions */}
      {tab === 'transactions' && (
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/6">
                {['Customer', 'Type', 'Points', 'Balance', 'Note', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 dark:text-white/35 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id} className="border-b border-gray-50 dark:border-white/4 hover:bg-gray-50 dark:hover:bg-white/3">
                  <td className="px-5 py-3 text-sm font-semibold text-gray-800 dark:text-white">{t.customer?.name || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold capitalize flex items-center gap-1">{TX_ICONS[t.type] || '•'} <span className={TX_COLORS[t.type]}>{t.type}</span></span>
                  </td>
                  <td className="px-5 py-3 text-sm font-bold">{t.points > 0 ? <span className="text-emerald-500">+{t.points}</span> : <span className="text-red-500">{t.points}</span>}</td>
                  <td className="px-5 py-3 text-sm text-gray-600 dark:text-white/60">{t.balance.toLocaleString()}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{t.note || '—'}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Modal */}
      <AnimatePresence>
        {showAdjustModal && selectedMember && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAdjustModal(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Adjust Points</h3>
                <button onClick={() => setShowAdjustModal(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 text-gray-500 flex items-center justify-center"><X size={14} /></button>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-purple-500/10 rounded-xl text-sm text-purple-600 dark:text-purple-400 font-semibold">{selectedMember.name} · {(selectedMember.loyalty?.points || 0).toLocaleString()} pts</div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Points (+ to add, − to subtract)</label>
                  <input type="number" value={adjustForm.points} onChange={e => setAdjustForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Type</label>
                  <select value={adjustForm.type} onChange={e => setAdjustForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none">
                    {['adjust', 'bonus', 'earn', 'redeem'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">Note</label>
                  <input value={adjustForm.note} onChange={e => setAdjustForm(f => ({ ...f, note: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                </div>
              </div>
              <button onClick={() => adjustPoints.mutate({ customerId: selectedMember._id, ...adjustForm })} disabled={adjustPoints.isPending}
                className="w-full mt-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
                {adjustPoints.isPending ? 'Saving...' : `Apply ${adjustForm.points > 0 ? '+' : ''}${adjustForm.points} pts`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && programForm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowSettingsModal(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Program Settings</h3>
                <button onClick={() => setShowSettingsModal(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 text-gray-500 flex items-center justify-center"><X size={14} /></button>
              </div>
              <div className="space-y-3">
                {[['pointsPerDinar', 'Points per TND spent'], ['pointsValue', 'Value per point (TND)'], ['birthdayBonus', 'Birthday bonus (pts)'], ['referralBonus', 'Referral bonus (pts)'], ['welcomeBonus', 'Welcome bonus (pts)'], ['winbackDays', 'Win-back trigger (days inactive)']].map(([field, label]) => (
                  <div key={field}>
                    <label className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-1 block">{label}</label>
                    <input type="number" value={programForm[field]} onChange={e => setProgramForm(f => ({ ...f, [field]: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none" />
                  </div>
                ))}
              </div>
              <button onClick={() => updateProgram.mutate(programForm)} disabled={updateProgram.isPending}
                className="w-full mt-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
                {updateProgram.isPending ? 'Saving...' : 'Save Settings'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
