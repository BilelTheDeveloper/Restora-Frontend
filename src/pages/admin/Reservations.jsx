import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  CalendarDays, Users, CheckCircle2, XCircle, Clock, Phone, Mail,
  RefreshCw, Crown, Filter, Bell, ChevronRight, AlertTriangle,
  Table2, Loader2, Check, X, Star,
} from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/authStore';

const STATUS_MAP = {
  pending:   { label: 'Pending',   dot: 'bg-amber-500',   pill: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',   icon: Clock       },
  confirmed: { label: 'Confirmed', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', icon: CheckCircle2 },
  seated:    { label: 'Seated',    dot: 'bg-blue-500',    pill: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',         icon: Users        },
  completed: { label: 'Completed', dot: 'bg-gray-400',    pill: 'bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400',             icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',     pill: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',             icon: XCircle      },
  'no-show': { label: 'No Show',   dot: 'bg-gray-600',    pill: 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-500',            icon: XCircle      },
};

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'seated', 'completed', 'cancelled'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Party size vs table capacity risk
function partySizeRisk(partySize, tableCapacity) {
  if (!tableCapacity) return null;
  if (partySize === tableCapacity) return 'exact';
  if (partySize > tableCapacity) return 'over';   // shouldn't happen after backend validation
  if (tableCapacity - partySize >= 3) return 'under'; // big waste
  return 'ok';
}

function StatusPill({ status }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, highlight }) {
  return (
    <div className={`bg-white dark:bg-[#141414] border rounded-2xl p-4 flex items-center gap-3 transition-all ${
      highlight ? 'border-amber-300 dark:border-amber-500/40 shadow-sm shadow-amber-100 dark:shadow-amber-500/10' : 'border-gray-100 dark:border-white/6'
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon size={16} className={color} />
      </div>
      <div>
        <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{value}</p>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

// ── Pending approval banner ──────────────────────────────────────
function PendingBanner({ pending, onConfirm, onDecline, isUpdating }) {
  if (!pending.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/25 rounded-2xl overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-amber-100 dark:border-amber-500/15">
        <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
          <Bell size={13} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-amber-800 dark:text-amber-300">
            {pending.length} reservation{pending.length > 1 ? 's' : ''} awaiting confirmation
          </p>
          <p className="text-[11px] text-amber-600/70 dark:text-amber-400/60 mt-0.5">
            Review and confirm or decline each request
          </p>
        </div>
      </div>
      <div className="divide-y divide-amber-100 dark:divide-amber-500/10">
        {pending.map(r => (
          <PendingRow key={r._id} r={r} onConfirm={onConfirm} onDecline={onDecline} isUpdating={isUpdating} />
        ))}
      </div>
    </motion.div>
  );
}

function PendingRow({ r, onConfirm, onDecline, isUpdating }) {
  const busy = isUpdating === r._id;
  const risk = partySizeRisk(r.partySize, r.table?.capacity);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
        <span className="text-sm font-black text-amber-700 dark:text-amber-400">{r.customerName?.[0]?.toUpperCase()}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{r.customerName}</p>
          {r.table && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded-lg">
              <Crown size={8} /> Table {r.table.number}
              {r.table.capacity && (
                <span className="opacity-60">· {r.table.capacity} seats</span>
              )}
            </span>
          )}
          {risk === 'over' && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-lg">
              <AlertTriangle size={8} /> Overbooked
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-white/40 flex-wrap">
          <span className="flex items-center gap-1"><Users size={10} /> {r.partySize} guests</span>
          <span className="flex items-center gap-1"><CalendarDays size={10} /> {fmtDate(r.date)}</span>
          <span className="flex items-center gap-1"><Clock size={10} /> {r.time}</span>
          {r.customerPhone && (
            <a href={`tel:${r.customerPhone}`} className="flex items-center gap-1 hover:text-orange-500 transition-colors">
              <Phone size={10} /> {r.customerPhone}
            </a>
          )}
        </div>
        {r.notes && (
          <p className="text-[11px] text-gray-400 dark:text-white/30 italic mt-1">"{r.notes}"</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onDecline(r._id)}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:border-red-300 dark:hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:opacity-40"
        >
          <X size={12} /> Decline
        </button>
        <button
          onClick={() => onConfirm(r._id)}
          disabled={busy}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-40 shadow-sm shadow-emerald-500/30"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Confirm
        </button>
      </div>
    </div>
  );
}

// ── Main reservation row ─────────────────────────────────────────
function ReservationRow({ r, onUpdate, isUpdating }) {
  const busy = isUpdating === r._id;
  const s    = STATUS_MAP[r.status] ?? STATUS_MAP.pending;
  const risk = partySizeRisk(r.partySize, r.table?.capacity);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
      {/* Guest */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-black text-orange-500">{r.customerName?.[0]?.toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{r.customerName}</p>
            {r.table && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded-lg shrink-0">
                <Crown size={8} /> T-{r.table.number}
                {r.table.capacity && <span className="opacity-60">·{r.table.capacity}p</span>}
              </span>
            )}
            {risk === 'over' && (
              <span className="text-[9px] font-bold text-red-500 dark:text-red-400">⚠ Over capacity</span>
            )}
          </div>
          <div className="flex items-center gap-2.5 mt-0.5 text-xs text-gray-400 dark:text-white/40 flex-wrap">
            <a href={`tel:${r.customerPhone}`} className="flex items-center gap-1 hover:text-orange-500 transition-colors">
              <Phone size={9} /> {r.customerPhone}
            </a>
            {r.notes && <span className="italic truncate max-w-[160px]">"{r.notes}"</span>}
          </div>
        </div>
      </div>

      {/* Date / time / guests */}
      <div className="flex items-center gap-3 text-xs shrink-0 flex-wrap">
        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-semibold">
          <CalendarDays size={12} className="text-orange-400" />
          {fmtDate(r.date)}
        </div>
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <Clock size={11} /> {r.time}
        </div>
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <Users size={11} /> {r.partySize}
        </div>
      </div>

      {/* Status + actions */}
      <div className="flex items-center gap-2 shrink-0">
        <StatusPill status={r.status} />

        {r.status === 'confirmed' && (
          <button
            onClick={() => onUpdate(r._id, 'seated')}
            disabled={busy}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors disabled:opacity-40"
          >
            Seat
          </button>
        )}
        {r.status === 'seated' && (
          <button
            onClick={() => onUpdate(r._id, 'completed')}
            disabled={busy}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            Complete
          </button>
        )}
        {['confirmed', 'seated'].includes(r.status) && (
          <button
            onClick={() => onUpdate(r._id, 'no-show')}
            disabled={busy}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40"
          >
            No Show
          </button>
        )}
        {busy && <Loader2 size={13} className="animate-spin text-orange-400" />}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function Reservations() {
  const qc                           = useQueryClient();
  const { user }                     = useAuthStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter,   setDateFilter]   = useState('');
  const [updatingId,   setUpdatingId]   = useState(null);
  const [flashId,      setFlashId]      = useState(null);

  // Live socket subscription
  useSocket(user?.restaurant, {
    'reservation:new': ({ reservation }) => {
      qc.invalidateQueries(['reservations']);
      setFlashId(reservation?._id);
      toast.success(
        `New reservation — ${reservation?.customerName} · ${reservation?.partySize} guests`,
        { icon: '🔔', duration: 5000 }
      );
    },
    'reservation:updated': () => qc.invalidateQueries(['reservations']),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reservations', statusFilter, dateFilter],
    queryFn: () => api.get('/owner/reservations', {
      params: {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        date:   dateFilter || undefined,
      }
    }).then(r => r.data.data ?? []),
  });

  const reservations = data ?? [];

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/owner/reservations/${id}/status`, { status }),
    onMutate:  ({ id }) => setUpdatingId(id),
    onSettled: () => setUpdatingId(null),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['alerts'] });
      qc.invalidateQueries({ queryKey: ['alert-count'] });
      const msgs = { confirmed: '✅ Reservation confirmed', cancelled: '❌ Reservation declined', seated: '🪑 Guest seated', completed: '🏁 Marked complete', 'no-show': '👻 Marked no-show' };
      toast.success(msgs[status] ?? 'Updated');
    },
    onError: () => { toast.error('Update failed'); setUpdatingId(null); },
  });

  const handleConfirm = (id) => updateStatus({ id, status: 'confirmed' });
  const handleDecline = (id) => updateStatus({ id, status: 'cancelled' });
  const handleUpdate  = (id, status) => updateStatus({ id, status });

  // Clear flash after 4 seconds
  useEffect(() => {
    if (!flashId) return;
    const t = setTimeout(() => setFlashId(null), 4000);
    return () => clearTimeout(t);
  }, [flashId]);

  const today     = new Date().toISOString().split('T')[0];
  const pending   = reservations.filter(r => r.status === 'pending');
  const rest      = reservations.filter(r => r.status !== 'pending' || statusFilter !== 'all');
  const displayList = statusFilter === 'all' ? reservations.filter(r => r.status !== 'pending') : reservations;

  const statPending   = reservations.filter(r => r.status === 'pending').length;
  const statConfirmed = reservations.filter(r => r.status === 'confirmed').length;
  const statCovers    = reservations.filter(r => ['confirmed','seated'].includes(r.status)).reduce((a, r) => a + r.partySize, 0);

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-6xl bg-gray-50 dark:bg-[#0a0a0a] min-h-full">
      <Toaster position="top-right" toastOptions={{ style: { fontSize: 13 } }} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Reservations</h1>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Manage VIP table bookings and confirmations</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total"     value={reservations.length} icon={CalendarDays} color="text-orange-500"  bg="bg-orange-50 dark:bg-orange-500/10" />
        <StatCard label="Pending"   value={statPending}         icon={Bell}         color="text-amber-500"   bg="bg-amber-50 dark:bg-amber-500/10"   highlight={statPending > 0} />
        <StatCard label="Confirmed" value={statConfirmed}       icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
        <StatCard label="Covers"    value={statCovers}          icon={Users}        color="text-purple-500"  bg="bg-purple-50 dark:bg-purple-500/10"  />
      </div>

      {/* Pending approvals banner — only shown in 'all' view */}
      <AnimatePresence>
        {statusFilter === 'all' && pending.length > 0 && (
          <PendingBanner
            pending={pending}
            onConfirm={handleConfirm}
            onDecline={handleDecline}
            isUpdating={updatingId}
          />
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400 shrink-0" />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize relative ${
                statusFilter === s
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_MAP[s]?.label ?? s}
              {s === 'pending' && statPending > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                  {statPending > 9 ? '9+' : statPending}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[140px] flex items-center gap-2">
          <CalendarDays size={13} className="text-gray-400 shrink-0" />
          <input
            type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 outline-none focus:border-orange-400 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-xs text-gray-400 hover:text-red-400 transition-colors">✕</button>
          )}
        </div>
        <button onClick={() => setDateFilter(today)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
          Today
        </button>
      </div>

      {/* Reservations list */}
      <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/6 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 dark:text-white/30 gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading…
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-white/20">
            <CalendarDays size={32} className="opacity-20 mb-3" />
            <p className="text-sm font-medium">No reservations found</p>
            <p className="text-xs mt-1 text-gray-300 dark:text-white/15">
              {statusFilter !== 'all' ? `No ${STATUS_MAP[statusFilter]?.label ?? statusFilter} reservations` : 'Bookings made via your website will appear here'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {displayList.map(r => (
                <motion.div
                  key={r._id}
                  layout
                  initial={flashId === r._id ? { backgroundColor: 'rgba(251,191,36,0.15)' } : {}}
                  animate={{ backgroundColor: 'transparent' }}
                  transition={{ duration: 2 }}
                >
                  <ReservationRow r={r} onUpdate={handleUpdate} isUpdating={updatingId} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
