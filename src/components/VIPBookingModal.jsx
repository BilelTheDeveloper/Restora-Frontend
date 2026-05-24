import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  X, Crown, Users, Calendar, Clock, User,
  Phone, Mail, FileText, CheckCircle2, Loader2, ChevronRight,
} from 'lucide-react';
import api from '../services/api';

// ── Time slots ─────────────────────────────────────────────────
const LUNCH  = ['12:00','12:30','13:00','13:30','14:00','14:30'];
const DINNER = ['19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30'];

// ── Floor geometry (mirrors builder exactly) ───────────────────
const ROUND_R   = 28;
const RECT_W    = 82;
const RECT_H    = 50;
const SQ_HALF   = 30;
const CHAIR_R   = 7;
const CHAIR_GAP = 6;
const PAD       = 64; // generous padding so chairs at edges are never clipped

function tblHalf(shape) {
  if (shape === 'round')     return { hw: ROUND_R,    hh: ROUND_R };
  if (shape === 'rectangle') return { hw: RECT_W / 2, hh: RECT_H / 2 };
  return { hw: SQ_HALF, hh: SQ_HALF };
}

function computeChairs(cx, cy, shape, capacity) {
  const cap = Math.min(capacity, 12);
  if (cap <= 0) return [];
  const chairs = [];
  if (shape === 'round') {
    const r = ROUND_R + CHAIR_GAP + CHAIR_R;
    for (let i = 0; i < cap; i++) {
      const a = (2 * Math.PI * i / cap) - Math.PI / 2;
      chairs.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  } else {
    const { hw, hh } = tblHalf(shape);
    const off  = CHAIR_GAP + CHAIR_R;
    const tCap = Math.max(1, Math.round(cap * hw / (hw + hh)));
    const sCap = Math.floor((cap - tCap * 2) / 2);
    const aTop = Math.ceil((cap - sCap * 2) / 2);
    const aBot = Math.floor((cap - sCap * 2) / 2);
    for (let i = 0; i < aTop; i++)
      chairs.push({ x: cx - hw + (2*hw)*(i+0.5)/aTop,  y: cy - hh - off });
    for (let i = 0; i < aBot; i++)
      chairs.push({ x: cx - hw + (2*hw)*(i+0.5)/aBot,  y: cy + hh + off });
    for (let i = 0; i < sCap; i++)
      chairs.push({ x: cx - hw - off, y: cy - hh + (2*hh)*(i+0.5)/sCap });
    for (let i = 0; i < sCap; i++)
      chairs.push({ x: cx + hw + off, y: cy - hh + (2*hh)*(i+0.5)/sCap });
  }
  return chairs;
}

function findZone(t, zones) {
  const cx = t.position?.x ?? 0;
  const cy = t.position?.y ?? 0;
  return zones?.find(z => cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h);
}

// ── Floor Plan SVG ─────────────────────────────────────────────
function FloorPlan({ tables, zones, room, bookedIds, selectedId, primaryColor, onSelect }) {
  const containerRef = useRef();
  const [tooltip, setTooltip] = useState(null);

  if (!tables.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6 rounded-2xl" style={{ background: '#0c0a07' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${primaryColor}18` }}>
          <Crown size={24} style={{ color: primaryColor, opacity: 0.5 }}/>
        </div>
        <p className="text-sm font-bold text-white/30 mb-1">No tables configured</p>
        <p className="text-xs text-white/20 leading-relaxed max-w-[180px]">
          Please contact the restaurant directly to reserve.
        </p>
      </div>
    );
  }

  // Compute viewBox with generous padding so chairs at edges are never clipped
  let vx, vy, vw, vh;
  if (room) {
    vx = room.x - PAD;
    vy = room.y - PAD;
    vw = room.w + PAD * 2;
    vh = room.h + PAD * 2;
  } else {
    const allX = tables.map(t => t.position?.x ?? 100);
    const allY = tables.map(t => t.position?.y ?? 100);
    vx = Math.max(0, Math.min(...allX) - PAD);
    vy = Math.max(0, Math.min(...allY) - PAD);
    vw = Math.max(400, Math.max(...allX) - vx + PAD);
    vh = Math.max(300, Math.max(...allY) - vy + PAD);
  }

  const handleTableEnter = (e, t) => {
    if (bookedIds.includes(t._id)) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pctX = ((e.clientX - rect.left) / rect.width)  * 100;
    const pctY = ((e.clientY - rect.top)  / rect.height) * 100;
    const zone = findZone(t, zones);
    setTooltip({ table: t, zone, pctX, pctY });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden select-none"
      style={{ background: '#0c0a07' }}
    >
      <svg
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          {/* Dark wood plank floor — mirrors builder */}
          <pattern id="pub-floor" width="90" height="18" patternUnits="userSpaceOnUse">
            <rect width="90" height="18" fill="#1b1208"/>
            <rect y="1" width="90" height="17" fill="#1d1309"/>
            <line x1="0" y1="0" x2="90" y2="0" stroke="#0b0804" strokeWidth="1.5"/>
            <line x1="10" y1="5" x2="68" y2="5" stroke="rgba(255,200,80,0.04)" strokeWidth="0.8"/>
            <line x1="26" y1="12" x2="84" y2="12" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5"/>
          </pattern>
          <pattern id="pub-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.8" fill="rgba(255,255,255,0.07)"/>
          </pattern>
          {/* Table wood gradients */}
          {tables.map(t => (
            <radialGradient key={`g-${t._id}`} id={`ptbl-${t._id}`} cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="#906c1a"/>
              <stop offset="55%"  stopColor="#5c4010"/>
              <stop offset="100%" stopColor="#3b2708"/>
            </radialGradient>
          ))}
          {/* Selected glow */}
          <filter id="pub-sel" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" result="b"/>
            <feFlood floodColor={primaryColor} floodOpacity="0.65" result="c"/>
            <feComposite in="c" in2="b" operator="in" result="g"/>
            <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Hover glow */}
          <filter id="pub-hov" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b"/>
            <feFlood floodColor="#fbbf24" floodOpacity="0.4" result="c"/>
            <feComposite in="c" in2="b" operator="in" result="g"/>
            <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Outer void */}
        <rect x={vx} y={vy} width={vw} height={vh} fill="#0c0a07"/>

        {/* Room floor */}
        {room && (
          <>
            <rect x={room.x} y={room.y} width={room.w} height={room.h} rx={8} fill="url(#pub-floor)"/>
            <rect x={room.x} y={room.y} width={room.w} height={room.h} rx={8} fill="url(#pub-grid)" style={{ pointerEvents: 'none' }}/>
            <rect x={room.x} y={room.y} width={room.w} height={room.h} rx={8}
              fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5"
              style={{ pointerEvents: 'none' }}/>
          </>
        )}

        {/* Zones */}
        {zones?.map(z => (
          <g key={z.id}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={5}
              fill={z.color ?? '#f59e0b'} fillOpacity={0.12}
              stroke={z.color ?? '#f59e0b'} strokeOpacity={0.45}
              strokeWidth="1"
              style={{ pointerEvents: 'none' }}
            />
            {z.label && (
              <text x={z.x + 8} y={z.y + 14} fontSize={9} fontWeight="700"
                fill={z.color ?? '#f59e0b'} fillOpacity={0.85}
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {z.label}
              </text>
            )}
          </g>
        ))}

        {/* Tables */}
        {tables.map(t => {
          const tx       = t.position?.x ?? 100;
          const ty       = t.position?.y ?? 100;
          const isBooked = bookedIds.includes(t._id);
          const isSel    = selectedId === t._id;
          const { hw, hh } = tblHalf(t.shape);
          const chairs   = computeChairs(tx, ty, t.shape, t.capacity);
          const filt     = isSel ? 'url(#pub-sel)' : undefined;

          return (
            <g
              key={t._id}
              opacity={isBooked ? 0.32 : 1}
              style={{ cursor: isBooked ? 'not-allowed' : 'pointer' }}
              onClick={() => !isBooked && onSelect(t._id === selectedId ? null : t._id)}
              onMouseEnter={e => !isBooked && handleTableEnter(e, t)}
              onMouseLeave={() => setTooltip(null)}
            >
              {chairs.map((c, i) => (
                <circle key={i} cx={c.x} cy={c.y} r={CHAIR_R}
                  fill={isBooked ? '#1c1510' : '#2c1c09'}
                  stroke={isBooked ? 'rgba(80,60,40,0.3)' : 'rgba(180,130,50,0.38)'}
                  strokeWidth="1"
                  style={{ pointerEvents: 'none' }}
                />
              ))}

              {t.shape === 'round' ? (
                <g filter={filt}>
                  <circle cx={tx} cy={ty} r={ROUND_R}
                    fill={isBooked ? '#221a0e' : isSel ? primaryColor : `url(#ptbl-${t._id})`}
                    stroke={isSel ? primaryColor : isBooked ? '#3a2a14' : '#7a5514'}
                    strokeWidth={isSel ? 2.5 : 1.5}/>
                  <circle cx={tx} cy={ty} r={ROUND_R * 0.62}
                    fill={isSel ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.055)'}
                    style={{ pointerEvents: 'none' }}/>
                </g>
              ) : t.shape === 'rectangle' ? (
                <g filter={filt}>
                  <rect x={tx - hw} y={ty - hh} width={hw*2} height={hh*2} rx={5}
                    fill={isBooked ? '#221a0e' : isSel ? primaryColor : `url(#ptbl-${t._id})`}
                    stroke={isSel ? primaryColor : isBooked ? '#3a2a14' : '#7a5514'}
                    strokeWidth={isSel ? 2.5 : 1.5}/>
                  <rect x={tx - hw*0.62} y={ty - hh*0.62} width={hw*1.24} height={hh*1.24} rx={3}
                    fill={isSel ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.055)'}
                    style={{ pointerEvents: 'none' }}/>
                </g>
              ) : (
                <g filter={filt}>
                  <rect x={tx - hw} y={ty - hh} width={hw*2} height={hh*2} rx={7}
                    fill={isBooked ? '#221a0e' : isSel ? primaryColor : `url(#ptbl-${t._id})`}
                    stroke={isSel ? primaryColor : isBooked ? '#3a2a14' : '#7a5514'}
                    strokeWidth={isSel ? 2.5 : 1.5}/>
                  <rect x={tx - hw*0.62} y={ty - hh*0.62} width={hw*1.24} height={hh*1.24} rx={5}
                    fill={isSel ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.055)'}
                    style={{ pointerEvents: 'none' }}/>
                </g>
              )}

              <text x={tx} y={ty - 4} textAnchor="middle"
                fill={isBooked ? '#3a2a14' : isSel ? '#fff' : 'rgba(255,238,190,0.92)'}
                fontSize={11} fontWeight="800"
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {t.number}
              </text>
              <text x={tx} y={ty + 10} textAnchor="middle"
                fill={isBooked ? '#2a1e0a' : isSel ? 'rgba(255,255,255,0.7)' : 'rgba(255,238,190,0.42)'}
                fontSize={8.5}
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {t.capacity}p
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{ left: `${tooltip.pctX}%`, top: `${tooltip.pctY}%`, transform: 'translate(-50%, calc(-100% - 12px))' }}
        >
          <div className="rounded-xl px-3.5 py-2.5 text-left min-w-[140px] border"
            style={{ background: 'rgba(20,14,6,0.96)', borderColor: 'rgba(255,200,80,0.18)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Crown size={10} style={{ color: primaryColor }}/>
              <p className="text-xs font-black text-white">Table {tooltip.table.number}</p>
            </div>
            <p className="text-[10px] text-amber-200/50 font-medium capitalize">
              {tooltip.table.capacity} guests · {tooltip.table.shape}
            </p>
            {tooltip.zone?.label && (
              <p className="text-[10px] font-bold mt-1" style={{ color: tooltip.zone.color ?? '#f59e0b' }}>
                {tooltip.zone.label}
              </p>
            )}
            <p className="text-[10px] text-emerald-400 font-semibold mt-1.5">Available — click to select</p>
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-3 h-2 overflow-hidden">
              <div className="w-3 h-3 rotate-45 -translate-y-1.5"
                style={{ background: 'rgba(20,14,6,0.96)', border: '1px solid rgba(255,200,80,0.18)' }}/>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2.5 right-3 flex gap-3 text-[9px] text-white/25 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(180,130,50,0.8)' }}/>Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }}/>Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/15"/>Booked
        </span>
      </div>
    </div>
  );
}

// ── Booking Modal ──────────────────────────────────────────────
export default function VIPBookingModal({ slug, restaurantName, primaryColor = '#f97316', onClose }) {
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    date: '', time: '', partySize: 2,
    customerName: '', customerPhone: '', customerEmail: '', notes: '',
  });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Fetch floor plan
  const { data: floorData, isLoading: floorLoading } = useQuery({
    queryKey: ['vip-floor', slug],
    queryFn: () => api.get(`/restaurants/${slug}/tables`).then(r => {
      const raw = r.data;
      if (Array.isArray(raw)) return { tables: raw, zones: [], room: null };
      return raw ?? { tables: [], zones: [], room: null };
    }),
    enabled: !!slug,
  });
  const tables = floorData?.tables ?? [];
  const zones  = floorData?.zones  ?? [];
  const room   = floorData?.room   ?? null;

  // Availability
  const { data: availData } = useQuery({
    queryKey: ['vip-avail', slug, form.date, form.time],
    queryFn: () => api.get(`/restaurants/${slug}/tables/availability`, {
      params: { date: form.date, time: form.time },
    }).then(r => r.data),
    enabled: !!(slug && form.date && form.time),
  });
  const bookedIds = availData?.bookedTableIds ?? [];

  useEffect(() => {
    if (selectedTableId && bookedIds.includes(selectedTableId)) setSelectedTableId(null);
  }, [bookedIds, selectedTableId]);

  const selectedTable = tables.find(t => t._id === selectedTableId);

  const { mutate: book, isPending: booking } = useMutation({
    mutationFn: () => api.post(`/restaurants/${slug}/reservations`, {
      tableId: selectedTableId,
      ...form,
      partySize: Number(form.partySize),
    }),
    onSuccess: () => setStep(2),
    onError: (err) => toast.error(err.response?.data?.message || 'Booking failed. Please try again.'),
  });

  const canSubmit = form.date && form.time && form.partySize && form.customerName && form.customerPhone;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"/>
      <div
        className="relative w-full sm:max-w-5xl max-h-[96vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
        style={{ background: '#0f0c08', border: '1px solid rgba(255,200,80,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
          style={{
            background: 'rgba(15,12,8,0.97)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,200,80,0.08)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${primaryColor}20`, border: `1px solid ${primaryColor}30` }}>
              <Crown size={16} style={{ color: primaryColor }}/>
            </div>
            <div>
              <h2 className="text-sm font-black text-white">VIP Table Reservation</h2>
              <p className="text-[10px] text-white/35">{restaurantName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors">
            <X size={18}/>
          </button>
        </div>

        {/* Step 2 — Success */}
        {step === 2 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: `${primaryColor}18`, border: `2px solid ${primaryColor}30` }}>
              <CheckCircle2 size={36} style={{ color: primaryColor }}/>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Reservation Submitted!</h3>
            <p className="text-white/50 max-w-sm leading-relaxed text-sm">
              Thank you, <span className="text-white font-bold">{form.customerName}</span>.
              We&apos;ll confirm your VIP table booking shortly.
            </p>
            {selectedTable && (
              <div className="mt-6 px-5 py-3.5 rounded-2xl inline-flex items-center gap-3 text-sm"
                style={{ background: `${primaryColor}12`, border: `1px solid ${primaryColor}25` }}>
                <Crown size={13} style={{ color: primaryColor }}/>
                <span className="text-white/60">
                  Table <strong className="text-white">{selectedTable.number}</strong>
                  {' · '}{form.date} at {form.time}{' · '}{form.partySize} guests
                </span>
              </div>
            )}
            <button onClick={onClose}
              className="mt-8 px-10 py-3 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.03]"
              style={{ backgroundColor: primaryColor, boxShadow: `0 8px 32px ${primaryColor}45` }}>
              Done
            </button>
          </div>

        ) : (
          /* Step 1 — Floor + Form */
          <div className="grid lg:grid-cols-[1fr_360px]">

            {/* ── Left: Floor plan ── */}
            <div className="p-5 border-b lg:border-b-0 lg:border-r" style={{ borderColor: 'rgba(255,200,80,0.08)' }}>

              {/* Floor plan header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: `${primaryColor}90` }}>
                    Choose Your Table
                  </p>
                  {selectedTable ? (
                    <p className="text-sm font-bold text-white">
                      Table <span style={{ color: primaryColor }}>{selectedTable.number}</span>
                      <span className="text-white/35 font-normal"> · {selectedTable.capacity} seats</span>
                      {findZone(selectedTable, zones)?.label && (
                        <span className="text-white/35 font-normal"> · {findZone(selectedTable, zones).label}</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-white/30">
                      {floorLoading ? 'Loading floor plan…' : 'Click an available table'}
                    </p>
                  )}
                </div>
                {selectedTableId && (
                  <button onClick={() => setSelectedTableId(null)}
                    className="text-[10px] text-white/30 hover:text-white/60 transition-colors border rounded-lg px-2.5 py-1 hover:border-white/20"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    Clear
                  </button>
                )}
              </div>

              {/* Floor plan SVG — no max-height, scales with aspect ratio */}
              {floorLoading ? (
                <div className="flex items-center justify-center rounded-2xl" style={{ background: '#0c0a07', minHeight: 280 }}>
                  <Loader2 size={22} className="animate-spin" style={{ color: primaryColor }}/>
                </div>
              ) : (
                <FloorPlan
                  tables={tables}
                  zones={zones}
                  room={room}
                  bookedIds={bookedIds}
                  selectedId={selectedTableId}
                  primaryColor={primaryColor}
                  onSelect={setSelectedTableId}
                />
              )}

              {/* Date/time reminder */}
              {!form.date && tables.length > 0 && (
                <p className="mt-3 text-center text-[11px] font-medium" style={{ color: `${primaryColor}60` }}>
                  Select a date & time to see live availability
                </p>
              )}
            </div>

            {/* ── Right: Form ── */}
            <div className="flex flex-col p-5 gap-5 overflow-y-auto" style={{ maxHeight: '80vh' }}>

              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${primaryColor}70` }}>
                Reservation Details
              </p>

              {/* Date */}
              <Field label="Date" icon={<Calendar size={12} style={{ color: primaryColor }}/>}>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.date}
                  onChange={e => setF('date', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,200,80,0.15)', colorScheme: 'dark' }}
                />
              </Field>

              {/* Time — grouped by service */}
              <Field label="Time" icon={<Clock size={12} style={{ color: primaryColor }}/>}>
                <div className="space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/25">Lunch</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {LUNCH.map(t => (
                      <TimeChip key={t} time={t} selected={form.time === t} primary={primaryColor} onSelect={() => setF('time', t)}/>
                    ))}
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/25 pt-1">Dinner</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {DINNER.map(t => (
                      <TimeChip key={t} time={t} selected={form.time === t} primary={primaryColor} onSelect={() => setF('time', t)}/>
                    ))}
                  </div>
                </div>
              </Field>

              {/* Party size */}
              <Field label="Guests" icon={<Users size={12} style={{ color: primaryColor }}/>}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setF('partySize', Math.max(1, form.partySize - 1))}
                    className="w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center transition-colors text-white/60 hover:text-white"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,200,80,0.12)' }}>
                    −
                  </button>
                  <span className="flex-1 text-center text-base font-black text-white">{form.partySize}</span>
                  <button
                    onClick={() => setF('partySize', Math.min(selectedTable?.capacity ?? 20, form.partySize + 1))}
                    className="w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center transition-colors text-white/60 hover:text-white"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,200,80,0.12)' }}>
                    +
                  </button>
                </div>
              </Field>

              <div className="h-px" style={{ background: 'rgba(255,200,80,0.08)' }}/>

              {/* Contact */}
              <Field label="Your Name" icon={<User size={12} style={{ color: primaryColor }}/>}>
                <DarkInput type="text" placeholder="Full name" value={form.customerName}
                  onChange={e => setF('customerName', e.target.value)}/>
              </Field>

              <Field label="Phone" icon={<Phone size={12} style={{ color: primaryColor }}/>}>
                <DarkInput type="tel" placeholder="+216 XX XXX XXX" value={form.customerPhone}
                  onChange={e => setF('customerPhone', e.target.value)}/>
              </Field>

              <Field label="Email (optional)" icon={<Mail size={12} style={{ color: primaryColor }}/>}>
                <DarkInput type="email" placeholder="your@email.com" value={form.customerEmail}
                  onChange={e => setF('customerEmail', e.target.value)}/>
              </Field>

              <Field label="Special Requests" icon={<FileText size={12} style={{ color: primaryColor }}/>}>
                <textarea
                  placeholder="Allergies, occasion, preferences…"
                  value={form.notes}
                  onChange={e => setF('notes', e.target.value)}
                  rows={2}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none resize-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,200,80,0.15)' }}
                />
              </Field>

              {/* Submit */}
              <button
                onClick={() => canSubmit && book()}
                disabled={!canSubmit || booking}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black text-white transition-all disabled:opacity-35 disabled:cursor-not-allowed hover:scale-[1.02]"
                style={{
                  backgroundColor: canSubmit ? primaryColor : 'rgba(255,255,255,0.08)',
                  boxShadow: canSubmit ? `0 8px 28px ${primaryColor}45` : 'none',
                }}
              >
                {booking ? <Loader2 size={15} className="animate-spin"/> : <Crown size={14}/>}
                {booking ? 'Confirming…' : 'Confirm VIP Reservation'}
                {!booking && <ChevronRight size={14}/>}
              </button>

              <p className="text-[10px] text-white/20 text-center leading-relaxed -mt-2">
                We&apos;ll contact you to confirm. No payment required now.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────
function Field({ label, icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

function DarkInput({ type, placeholder, value, onChange }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-colors"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,200,80,0.15)' }}
    />
  );
}

function TimeChip({ time, selected, primary, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="py-1.5 rounded-lg text-[11px] font-bold transition-all"
      style={selected
        ? { background: primary, color: '#fff', boxShadow: `0 4px 12px ${primary}50` }
        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,220,140,0.5)', border: '1px solid rgba(255,200,80,0.1)' }
      }
    >
      {time}
    </button>
  );
}
