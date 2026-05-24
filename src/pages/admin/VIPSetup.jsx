import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Crown, Plus, Trash2, Save, ToggleLeft, ToggleRight,
  Circle, Square, RefreshCw, Undo, Redo,
  ZoomIn, ZoomOut, Tag, RotateCcw,
  Layers, DoorOpen, X, Check, Minus, ArrowLeft,
  MousePointer2,
} from 'lucide-react';
import api from '../../services/api';

// ── Constants ──────────────────────────────────────────────────
const CANVAS_W  = 1000;
const CANVAS_H  = 680;
const CX        = CANVAS_W / 2;
const CY        = CANVAS_H / 2;
const GRID      = 20;
const WALL_T    = 14;
const CHAIR_R   = 7;
const CHAIR_GAP = 6;
const HANDLE_PX = 6;
const DEFAULT_ROOM  = { x: 100, y: 80, w: 800, h: 520 };
const ZONE_COLORS   = ['#f59e0b','#14b8a6','#f43f5e','#8b5cf6','#0ea5e9','#84cc16','#f97316','#ec4899'];

const DEFAULT_FLOOR = () => ({
  id: 'floor-main', name: 'Ground Floor', order: 0,
  room: { ...DEFAULT_ROOM }, zones: [], walls: [], doors: [], windows: [],
});

const snap  = v => Math.round(v / GRID) * GRID;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
let localIdCtr = 1;

// ── Capacity-aware table dimensions ───────────────────────────
function tblHalf(shape, cap = 4) {
  if (shape === 'round') {
    if (cap <= 2) return { hw: 20, hh: 20 };
    if (cap <= 4) return { hw: 28, hh: 28 };
    if (cap <= 6) return { hw: 34, hh: 34 };
    return { hw: 40, hh: 40 };
  }
  if (shape === 'rectangle' || shape === 'banquet') {
    if (cap <= 4)  return { hw: 41, hh: 26 };
    if (cap <= 6)  return { hw: 55, hh: 28 };
    if (cap <= 8)  return { hw: 68, hh: 30 };
    return { hw: 100, hh: 30 };
  }
  // square
  if (cap <= 2) return { hw: 22, hh: 22 };
  return { hw: 30, hh: 30 };
}

function computeChairs(cx, cy, shape, capacity) {
  const cap = Math.min(capacity, 12);
  if (cap <= 0) return [];
  const out = [];
  const { hw, hh } = tblHalf(shape, cap);
  if (shape === 'round') {
    const r = hw + CHAIR_GAP + CHAIR_R;
    for (let i = 0; i < cap; i++) {
      const a = (2 * Math.PI * i / cap) - Math.PI / 2;
      out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  } else {
    const off  = CHAIR_GAP + CHAIR_R;
    const tCap = Math.max(1, Math.round(cap * hw / (hw + hh)));
    const sCap = Math.floor((cap - tCap * 2) / 2);
    const aTop = Math.ceil((cap - sCap * 2) / 2);
    const aBot = Math.floor((cap - sCap * 2) / 2);
    for (let i = 0; i < aTop; i++) out.push({ x: cx - hw + (2*hw)*(i+0.5)/aTop, y: cy - hh - off });
    for (let i = 0; i < aBot; i++) out.push({ x: cx - hw + (2*hw)*(i+0.5)/aBot, y: cy + hh + off });
    for (let i = 0; i < sCap; i++) out.push({ x: cx - hw - off, y: cy - hh + (2*hh)*(i+0.5)/sCap });
    for (let i = 0; i < sCap; i++) out.push({ x: cx + hw + off, y: cy - hh + (2*hh)*(i+0.5)/sCap });
  }
  return out;
}

function wallPoly(x1, y1, x2, y2, t = WALL_T) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return '';
  const nx = (-dy / len) * t / 2;
  const ny = (dx  / len) * t / 2;
  return `${x1+nx},${y1+ny} ${x2+nx},${y2+ny} ${x2-nx},${y2-ny} ${x1-nx},${y1-ny}`;
}

// ── Table presets palette data ─────────────────────────────────
const TABLE_PRESETS = [
  { shape: 'round',     cap: 2,  label: 'Round 2p'  },
  { shape: 'round',     cap: 4,  label: 'Round 4p'  },
  { shape: 'round',     cap: 6,  label: 'Round 6p'  },
  { shape: 'round',     cap: 8,  label: 'Round 8p'  },
  { shape: 'square',    cap: 2,  label: 'Square 2p' },
  { shape: 'square',    cap: 4,  label: 'Square 4p' },
  { shape: 'rectangle', cap: 4,  label: 'Rect 4p'   },
  { shape: 'rectangle', cap: 6,  label: 'Rect 6p'   },
  { shape: 'rectangle', cap: 8,  label: 'Rect 8p'   },
  { shape: 'rectangle', cap: 12, label: 'Banquet 12p'},
];

// ── Mini SVG preview for a table preset ───────────────────────
function TablePreviewSvg({ shape, cap }) {
  const { hw, hh } = tblHalf(shape, cap);
  // Compute full extent (table + chairs) then build a tight viewBox
  const chairReach = Math.max(hw, hh) + CHAIR_GAP + CHAIR_R + 2;
  const vb = chairReach * 2 + 4;
  const C  = vb / 2;
  const chs = computeChairs(C, C, shape, cap);
  return (
    <svg viewBox={`0 0 ${vb} ${vb}`} width={52} height={52} style={{ display: 'block' }}>
      {chs.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={CHAIR_R * 0.75}
          fill="#2c1c09" stroke="rgba(180,130,50,0.4)" strokeWidth="0.8"/>
      ))}
      {shape === 'round' ? (
        <>
          <circle cx={C + 2} cy={C + 2} r={hw} fill="#3a1f08"/>
          <circle cx={C} cy={C} r={hw} fill="#5c4010" stroke="#7a5514" strokeWidth="1.2"/>
          <circle cx={C - hw*.3} cy={C - hw*.3} r={hw * 0.35} fill="rgba(255,255,255,0.07)"/>
        </>
      ) : (
        <>
          <rect x={C - hw + 2} y={C - hh + 2} width={hw*2} height={hh*2} rx={shape==='square'?5:4} fill="#3a1f08"/>
          <rect x={C - hw} y={C - hh} width={hw*2} height={hh*2} rx={shape==='square'?5:4}
            fill="#5c4010" stroke="#7a5514" strokeWidth="1.2"/>
        </>
      )}
    </svg>
  );
}

// ── Mini floor plan thumbnail (sidebar) ───────────────────────
function FloorThumb({ floor, tables }) {
  const r = floor?.room ?? DEFAULT_ROOM;
  const pad = 6;
  const scale = Math.min(160 / (r.w + pad*2), 90 / (r.h + pad*2));
  const vw = (r.w + pad*2) , vh = (r.h + pad*2);
  const ox = r.x - pad, oy = r.y - pad;
  return (
    <svg viewBox={`${ox} ${oy} ${vw} ${vh}`} width="100%" height={72} style={{ display: 'block' }}>
      <rect x={r.x - WALL_T} y={r.y - WALL_T} width={r.w + WALL_T*2} height={r.h + WALL_T*2}
        rx={WALL_T+4} fill="#2c221a"/>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#1d1309"/>
      {(floor?.zones ?? []).map(z => (
        <rect key={z.id} x={z.x} y={z.y} width={z.w} height={z.h} rx={3}
          fill={z.color ?? '#f59e0b'} fillOpacity={0.25} stroke={z.color ?? '#f59e0b'} strokeOpacity={0.5} strokeWidth={1}/>
      ))}
      {tables.map(t => {
        const tx = t.position?.x ?? 200;
        const ty = t.position?.y ?? 200;
        const { hw, hh } = tblHalf(t.shape, t.capacity);
        return t.shape === 'round'
          ? <circle key={t._localId ?? t._id} cx={tx} cy={ty} r={hw * 0.8} fill="#7a5514"/>
          : <rect key={t._localId ?? t._id} x={tx - hw*.8} y={ty - hh*.8} width={hw*1.6} height={hh*1.6} rx={3} fill="#7a5514"/>;
      })}
    </svg>
  );
}

// ── SVG sub-elements ──────────────────────────────────────────
function WallSeg({ w, sel, zoom, onPD, onSelect }) {
  const pts    = wallPoly(w.x1, w.y1, w.x2, w.y2, w.thickness ?? WALL_T);
  const hitPts = wallPoly(w.x1, w.y1, w.x2, w.y2, Math.max((w.thickness ?? WALL_T), 22));
  if (!pts) return null;
  return (
    <g>
      <polygon points={hitPts} fill="transparent" style={{ cursor: 'grab' }}
        onPointerDown={onPD} onClick={e => { e.stopPropagation(); onSelect(); }}/>
      <polygon points={pts}
        fill={sel ? '#5c3820' : '#2e241a'}
        stroke={sel ? '#f97316' : '#1a0e08'}
        strokeWidth={sel ? 1.5 / zoom : 0.8 / zoom}
        style={{ pointerEvents: 'none' }}/>
    </g>
  );
}

function DoorEl({ d, sel, zoom, onPD, onSelect }) {
  const w   = d.width    ?? 70;
  const oa  = (d.openAngle ?? 75) * Math.PI / 180;
  const sd  = d.swingDir ?? 1;
  const pex = -w/2 + w * Math.cos(oa);
  const pey = w * Math.sin(oa) * sd;
  const col = sel ? '#f97316' : '#9b7a40';
  return (
    <g transform={`translate(${d.x} ${d.y}) rotate(${d.rotation ?? 0})`}
       style={{ cursor: 'grab' }} onPointerDown={onPD} onClick={e => { e.stopPropagation(); onSelect(); }}>
      <rect x={-w/2-10} y={-w-10} width={w+20} height={w+20} fill="transparent" style={{ pointerEvents: 'all' }}/>
      <rect x={-w/2-1} y={-WALL_T-3} width={w+2} height={WALL_T*2+6} fill="#0c0a07" style={{ pointerEvents: 'none' }}/>
      <line x1={-w/2} y1={-WALL_T} x2={-w/2} y2={WALL_T} stroke={col} strokeWidth={2/zoom} style={{ pointerEvents: 'none' }}/>
      <line x1={ w/2} y1={-WALL_T} x2={ w/2} y2={WALL_T} stroke={col} strokeWidth={2/zoom} style={{ pointerEvents: 'none' }}/>
      <path d={`M ${w/2} 0 A ${w} ${w} 0 0 ${sd>0?1:0} ${pex} ${pey}`}
        fill="none" stroke={col} strokeWidth={1/zoom}
        strokeDasharray={`${6/zoom} ${3/zoom}`} opacity={0.65}
        style={{ pointerEvents: 'none' }}/>
      <line x1={-w/2} y1={0} x2={pex} y2={pey}
        stroke={col} strokeWidth={sel ? 3.5/zoom : 2.5/zoom} strokeLinecap="round"
        style={{ pointerEvents: 'none' }}/>
      <circle cx={-w/2} cy={0} r={3.5/zoom} fill={col} style={{ pointerEvents: 'none' }}/>
    </g>
  );
}

function WindowEl({ w, sel, zoom, onPD, onSelect }) {
  const ww  = w.width ?? 80;
  const col = sel ? '#f97316' : '#2a5a9b';
  return (
    <g transform={`translate(${w.x} ${w.y}) rotate(${w.rotation ?? 0})`}
       style={{ cursor: 'grab' }} onPointerDown={onPD} onClick={e => { e.stopPropagation(); onSelect(); }}>
      <rect x={-ww/2-10} y={-14} width={ww+20} height={28} fill="transparent" style={{ pointerEvents: 'all' }}/>
      <rect x={-ww/2-1} y={-WALL_T-3} width={ww+2} height={WALL_T*2+6} fill="#0c0a07" style={{ pointerEvents: 'none' }}/>
      <line x1={-ww/2} y1={-WALL_T} x2={-ww/2} y2={WALL_T} stroke={sel ? '#f97316' : '#7a5c28'} strokeWidth={1.5/zoom} style={{ pointerEvents: 'none' }}/>
      <line x1={ ww/2} y1={-WALL_T} x2={ ww/2} y2={WALL_T} stroke={sel ? '#f97316' : '#7a5c28'} strokeWidth={1.5/zoom} style={{ pointerEvents: 'none' }}/>
      <rect x={-ww/2} y={-5} width={ww} height={10}
        fill="#1a3d6b" fillOpacity={0.9} stroke={col} strokeWidth={sel ? 1.5/zoom : 1/zoom}
        style={{ pointerEvents: 'none' }}/>
      {[0, -ww*0.28, ww*0.28].map((gx, i) => (
        <line key={i} x1={gx} y1={-4} x2={gx} y2={4}
          stroke="#4a90d4" strokeWidth={0.8/zoom} opacity={0.8}
          style={{ pointerEvents: 'none' }}/>
      ))}
    </g>
  );
}

// ── Floor Canvas ──────────────────────────────────────────────
function FloorCanvas({
  svgRef, floor, tables, selected, zoom, toolMode, wallFirst, wallPreview,
  startTableDrag, startZoneDrag, startZoneResize, startRoomResize,
  startWallDrag, startDoorDrag, startWindowDrag,
  onPointerMove, onPointerUp, onWheel, onCanvasClick, onSelect,
}) {
  const HS  = HANDLE_PX / zoom;
  const r   = floor?.room ?? DEFAULT_ROOM;
  const walls   = floor?.walls   ?? [];
  const doors   = floor?.doors   ?? [];
  const windows = floor?.windows ?? [];
  const zones   = floor?.zones   ?? [];

  const ROOM_CORNERS = [
    ['nw', r.x,       r.y,       'nw-resize'],
    ['ne', r.x + r.w, r.y,       'ne-resize'],
    ['se', r.x + r.w, r.y + r.h, 'se-resize'],
    ['sw', r.x,       r.y + r.h, 'sw-resize'],
  ];

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      className="w-full h-full touch-none select-none"
      style={{ background: '#0c0a07', cursor: toolMode === 'wall' ? 'crosshair' : 'default' }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
      onClick={onCanvasClick}
    >
      <defs>
        <pattern id="fp-planks" width="90" height="18" patternUnits="userSpaceOnUse">
          <rect width="90" height="18" fill="#1b1208"/>
          <rect y="1" width="90" height="17" fill="#1d1309"/>
          <line x1="0" y1="0" x2="90" y2="0" stroke="#0b0804" strokeWidth="1.5"/>
          <line x1="10" y1="5" x2="68" y2="5" stroke="rgba(255,200,80,0.04)" strokeWidth="0.8"/>
        </pattern>
        <pattern id="fp-dot" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
          <circle cx={GRID/2} cy={GRID/2} r="0.7" fill="rgba(255,255,255,0.07)"/>
        </pattern>
        <pattern id="fp-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.03)" strokeWidth="4"/>
        </pattern>
        {tables.map(t => {
          const id = t._localId ?? t._id;
          return (
            <radialGradient key={`g-${id}`} id={`tbl-${id}`} cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="#a07820"/>
              <stop offset="50%"  stopColor="#6a4c14"/>
              <stop offset="100%" stopColor="#3b2708"/>
            </radialGradient>
          );
        })}
        <filter id="fp-sel" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feFlood floodColor="#f97316" floodOpacity="0.7" result="c"/>
          <feComposite in="c" in2="b" operator="in" result="g"/>
          <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="tbl-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="rgba(0,0,0,0.7)"/>
        </filter>
      </defs>

      <rect width={CANVAS_W} height={CANVAS_H} fill="#0c0a07"/>

      <g transform={`translate(${CX} ${CY}) scale(${zoom}) translate(${-CX} ${-CY})`}>

        {/* Exterior wall shell */}
        <rect x={r.x - WALL_T} y={r.y - WALL_T} width={r.w + WALL_T*2} height={r.h + WALL_T*2}
          rx={WALL_T + 8} fill="#2c221a"/>
        <rect x={r.x - WALL_T} y={r.y - WALL_T} width={r.w + WALL_T*2} height={r.h + WALL_T*2}
          rx={WALL_T + 8} fill="url(#fp-hatch)" style={{ pointerEvents: 'none' }}/>
        <rect x={r.x - WALL_T - 2} y={r.y - WALL_T - 2} width={r.w + WALL_T*2 + 4} height={r.h + WALL_T*2 + 4}
          rx={WALL_T + 10} fill="none" stroke="rgba(255,255,255,0.04)"
          strokeWidth={3 / zoom} style={{ pointerEvents: 'none' }}/>

        {/* Door + window gaps */}
        {doors.map(d => (
          <g key={`dg-${d.id}`} transform={`translate(${d.x} ${d.y}) rotate(${d.rotation ?? 0})`}
             style={{ pointerEvents: 'none' }}>
            <rect x={-(d.width ?? 70)/2 - 1} y={-WALL_T - 3}
              width={(d.width ?? 70) + 2} height={WALL_T*2 + 6} fill="#0c0a07"/>
          </g>
        ))}
        {windows.map(w => (
          <g key={`wg-${w.id}`} transform={`translate(${w.x} ${w.y}) rotate(${w.rotation ?? 0})`}
             style={{ pointerEvents: 'none' }}>
            <rect x={-(w.width ?? 80)/2 - 1} y={-WALL_T - 3}
              width={(w.width ?? 80) + 2} height={WALL_T*2 + 6} fill="#0c0a07"/>
          </g>
        ))}

        {/* Floor */}
        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="url(#fp-planks)"/>
        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="url(#fp-dot)" style={{ pointerEvents: 'none' }}/>

        {/* Window glass */}
        {windows.map(w => (
          <WindowEl key={w.id} w={w}
            sel={selected?.type === 'window' && selected?.id === w.id}
            zoom={zoom}
            onPD={e => { e.stopPropagation(); if (toolMode === 'select') startWindowDrag(e, w.id); }}
            onSelect={() => { if (toolMode === 'select') onSelect('window', w.id); }}
          />
        ))}

        {/* Doors */}
        {doors.map(d => (
          <DoorEl key={d.id} d={d}
            sel={selected?.type === 'door' && selected?.id === d.id}
            zoom={zoom}
            onPD={e => { e.stopPropagation(); if (toolMode === 'select') startDoorDrag(e, d.id); }}
            onSelect={() => { if (toolMode === 'select') onSelect('door', d.id); }}
          />
        ))}

        {/* Interior walls */}
        {walls.map(w => (
          <WallSeg key={w.id} w={w}
            sel={selected?.type === 'wall' && selected?.id === w.id}
            zoom={zoom}
            onPD={e => { e.stopPropagation(); if (toolMode === 'select') startWallDrag(e, w.id); }}
            onSelect={() => { if (toolMode === 'select') onSelect('wall', w.id); }}
          />
        ))}

        {/* Wall draw preview */}
        {toolMode === 'wall' && wallFirst && wallPreview && (
          <line x1={wallFirst.x} y1={wallFirst.y} x2={wallPreview.x} y2={wallPreview.y}
            stroke="#f97316" strokeWidth={WALL_T / zoom} strokeLinecap="round" opacity={0.5}
            style={{ pointerEvents: 'none' }}/>
        )}
        {toolMode === 'wall' && wallFirst && (
          <>
            <circle cx={wallFirst.x} cy={wallFirst.y} r={WALL_T * 0.65 / zoom}
              fill="#f97316" opacity={0.9} style={{ pointerEvents: 'none' }}/>
            <circle cx={wallFirst.x} cy={wallFirst.y} r={WALL_T * 1.4 / zoom}
              fill="none" stroke="#f97316" strokeWidth={1 / zoom} opacity={0.35}
              style={{ pointerEvents: 'none' }}/>
          </>
        )}

        {/* Zones */}
        {zones.map(z => {
          const isSel = selected?.type === 'zone' && selected?.id === z.id;
          const col   = z.color ?? '#f59e0b';
          return (
            <g key={z.id}>
              <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={5}
                fill={col} fillOpacity={isSel ? 0.22 : 0.13}
                stroke={col} strokeOpacity={isSel ? 0.8 : 0.38}
                strokeWidth={isSel ? 1.5 / zoom : 1 / zoom}
                style={{ cursor: 'move' }}
                onPointerDown={e => { e.stopPropagation(); if (toolMode === 'select') startZoneDrag(e, z.id); }}
                onClick={e => e.stopPropagation()}
              />
              {z.label && (
                <text x={z.x + 8} y={z.y + 14} fontSize={10 / zoom} fontWeight="700"
                  fill={col} fillOpacity={0.9} style={{ userSelect: 'none', pointerEvents: 'none' }}>
                  {z.label}
                </text>
              )}
              {isSel && [
                ['nw', z.x,       z.y,       'nw-resize'],
                ['ne', z.x + z.w, z.y,       'ne-resize'],
                ['se', z.x + z.w, z.y + z.h, 'se-resize'],
                ['sw', z.x,       z.y + z.h, 'sw-resize'],
              ].map(([corner, hx, hy, cur]) => (
                <rect key={corner} x={hx - HS} y={hy - HS} width={HS*2} height={HS*2} rx={HS*0.35}
                  fill="white" fillOpacity={0.88} stroke={col} strokeWidth={0.6 / zoom}
                  style={{ cursor: cur }}
                  onPointerDown={e => { e.stopPropagation(); startZoneResize(e, z.id, corner); }}
                  onClick={e => e.stopPropagation()}
                />
              ))}
            </g>
          );
        })}

        {/* Tables — 2.5D */}
        {tables.map(t => {
          const id    = t._localId ?? t._id;
          const tx    = t.position?.x ?? 200;
          const ty    = t.position?.y ?? 200;
          const rot   = t.rotation ?? 0;
          const isSel = selected?.type === 'table' && selected?.id === id;
          const chs   = computeChairs(tx, ty, t.shape, t.capacity);
          const { hw, hh } = tblHalf(t.shape, t.capacity);
          const filt  = isSel ? 'url(#fp-sel)' : 'url(#tbl-shadow)';
          const EXTRUDE = 4;
          return (
            <g key={id}
              transform={`rotate(${rot}, ${tx}, ${ty})`}
              style={{ cursor: toolMode === 'select' ? 'grab' : 'crosshair' }}
              onPointerDown={e => { e.stopPropagation(); if (toolMode === 'select') startTableDrag(e, id); }}
              onClick={e => e.stopPropagation()}
            >
              {/* Chairs */}
              {chs.map((c, i) => (
                <circle key={i} cx={c.x} cy={c.y} r={CHAIR_R}
                  fill="#2c1c09" stroke="rgba(180,130,50,0.38)" strokeWidth="1"
                  style={{ pointerEvents: 'none' }}/>
              ))}

              {/* 2.5D extrusion bottom edge */}
              {t.shape === 'round' ? (
                <>
                  <ellipse cx={tx + EXTRUDE} cy={ty + EXTRUDE + hw * 0.18} rx={hw} ry={hw * 0.22}
                    fill="rgba(0,0,0,0.55)" style={{ pointerEvents: 'none' }}/>
                  <circle cx={tx + EXTRUDE} cy={ty + EXTRUDE} r={hw}
                    fill="#3a1f08" style={{ pointerEvents: 'none' }}/>
                  <g filter={filt}>
                    <circle cx={tx} cy={ty} r={hw} fill={`url(#tbl-${id})`}
                      stroke={isSel ? '#f97316' : '#7a5514'} strokeWidth={isSel ? 2.5 : 1.5}/>
                    <circle cx={tx - hw*.3} cy={ty - hw*.3} r={hw * 0.38}
                      fill="rgba(255,255,255,0.07)" style={{ pointerEvents: 'none' }}/>
                  </g>
                </>
              ) : (
                <>
                  <ellipse cx={tx + EXTRUDE} cy={ty + hh + EXTRUDE * 1.2} rx={hw * 1.05} ry={EXTRUDE * 0.9}
                    fill="rgba(0,0,0,0.45)" style={{ pointerEvents: 'none' }}/>
                  <rect x={tx - hw + EXTRUDE} y={ty - hh + EXTRUDE} width={hw*2} height={hh*2}
                    rx={t.shape === 'square' ? 6 : 4}
                    fill="#3a1f08" style={{ pointerEvents: 'none' }}/>
                  <g filter={filt}>
                    <rect x={tx - hw} y={ty - hh} width={hw*2} height={hh*2}
                      rx={t.shape === 'square' ? 6 : 4}
                      fill={`url(#tbl-${id})`} stroke={isSel ? '#f97316' : '#7a5514'} strokeWidth={isSel ? 2.5 : 1.5}/>
                    <rect x={tx - hw*.6} y={ty - hh*.6} width={hw*1.2} height={hh*1.2}
                      rx={3} fill="rgba(255,255,255,0.055)" style={{ pointerEvents: 'none' }}/>
                  </g>
                </>
              )}

              {/* Label */}
              <text x={tx} y={ty - 4} textAnchor="middle"
                fill="rgba(255,238,190,0.92)" fontSize={11} fontWeight="800"
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {t.number || '?'}
              </text>
              <text x={tx} y={ty + 9} textAnchor="middle"
                fill="rgba(255,238,190,0.42)" fontSize={8.5}
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {t.capacity}p
              </text>
            </g>
          );
        })}

        {/* Room resize handles */}
        {ROOM_CORNERS.map(([corner, hx, hy, cur]) => (
          <rect key={corner} x={hx - HS} y={hy - HS} width={HS*2} height={HS*2} rx={HS*0.3}
            fill="white" fillOpacity={0.7} stroke="rgba(255,255,255,0.25)" strokeWidth={0.5 / zoom}
            style={{ cursor: cur }}
            onPointerDown={e => { e.stopPropagation(); startRoomResize(e, corner); }}
            onClick={e => e.stopPropagation()}
          />
        ))}

        <rect x={r.x} y={r.y} width={r.w} height={r.h}
          fill="none" stroke="rgba(180,130,50,.15)" strokeWidth={1.5 / zoom}
          style={{ pointerEvents: 'none' }}/>

        {tables.length === 0 && (
          <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.12)" fontSize={14}>
            Pick a table from the right panel to place it →
          </text>
        )}
      </g>
    </svg>
  );
}

// ── Right panel: Properties ───────────────────────────────────
function PropertiesPanel({ selected, tables, floor, onUpdateTable, onUpdateZone, onUpdateWall, onUpdateDoor, onUpdateWindow, onDelete }) {
  const FLabel = ({ children }) => (
    <label className="text-[9px] font-bold uppercase tracking-widest text-[#6b5c40]">{children}</label>
  );

  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <Crown size={24} className="text-[#3d2e1a] mb-2"/>
        <p className="text-xs text-[#4a3820]">Select an element<br/>to edit properties</p>
      </div>
    );
  }

  if (selected.type === 'table') {
    const t = tables.find(t => (t._localId ?? t._id) === selected.id);
    if (!t) return null;
    const rot = t.rotation ?? 0;
    return (
      <div className="p-4 space-y-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#6b5c40]">Table</p>

        <div className="space-y-1">
          <FLabel>Number</FLabel>
          <input type="text" value={t.number ?? ''}
            onChange={e => onUpdateTable('number', e.target.value)}
            className="w-full bg-[#1a1208] border border-[#3a2a14] rounded-lg px-3 py-2 text-sm text-[#e8c97a] outline-none focus:border-[#f97316]"/>
        </div>

        <div className="space-y-1">
          <FLabel>Capacity</FLabel>
          <div className="flex items-center gap-2">
            <button onClick={() => onUpdateTable('capacity', Math.max(1, (t.capacity ?? 4) - 1))}
              className="w-8 h-8 rounded-lg bg-[#1a1208] border border-[#3a2a14] text-[#e8c97a] font-bold flex items-center justify-center hover:border-[#f97316] transition-colors">−</button>
            <span className="flex-1 text-center text-sm font-bold text-[#e8c97a]">{t.capacity ?? 4} seats</span>
            <button onClick={() => onUpdateTable('capacity', (t.capacity ?? 4) + 1)}
              className="w-8 h-8 rounded-lg bg-[#1a1208] border border-[#3a2a14] text-[#e8c97a] font-bold flex items-center justify-center hover:border-[#f97316] transition-colors">+</button>
          </div>
        </div>

        <div className="space-y-1">
          <FLabel>Shape</FLabel>
          <div className="grid grid-cols-3 gap-1">
            {[
              { val: 'round',     icon: <Circle size={10}/>,  label: 'Round' },
              { val: 'square',    icon: <Square size={10}/>,  label: 'Square' },
              { val: 'rectangle', icon: <span className="text-[9px] font-black">▬</span>, label: 'Rect' },
            ].map(({ val, icon, label }) => (
              <button key={val} onClick={() => onUpdateTable('shape', val)}
                className={`flex flex-col items-center gap-0.5 py-2 rounded-lg text-[9px] font-bold transition-all border ${t.shape === val ? 'bg-[#f97316] text-white border-[#f97316]' : 'border-[#3a2a14] text-[#6b5c40] hover:border-[#f97316]/50'}`}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <FLabel>Rotation</FLabel>
          <div className="flex items-center gap-1">
            <button onClick={() => onUpdateTable('rotation', ((rot - 15) + 360) % 360)}
              className="w-8 h-8 rounded-lg bg-[#1a1208] border border-[#3a2a14] text-[#e8c97a] flex items-center justify-center hover:border-[#f97316] transition-colors text-base">↺</button>
            <input type="number" min={0} max={359} value={rot}
              onChange={e => onUpdateTable('rotation', ((Number(e.target.value) % 360) + 360) % 360)}
              className="flex-1 text-center bg-[#1a1208] border border-[#3a2a14] rounded-lg px-2 py-2 text-sm font-bold text-[#e8c97a] outline-none focus:border-[#f97316]"/>
            <button onClick={() => onUpdateTable('rotation', (rot + 15) % 360)}
              className="w-8 h-8 rounded-lg bg-[#1a1208] border border-[#3a2a14] text-[#e8c97a] flex items-center justify-center hover:border-[#f97316] transition-colors text-base">↻</button>
          </div>
          <div className="flex gap-1 pt-0.5">
            {[0, 45, 90, 135].map(a => (
              <button key={a} onClick={() => onUpdateTable('rotation', a)}
                className={`flex-1 py-1 rounded-md text-[9px] font-bold transition-all border ${rot === a ? 'bg-[#f97316] text-white border-[#f97316]' : 'border-[#3a2a14] text-[#6b5c40] hover:border-[#f97316]/50'}`}>
                {a}°
              </button>
            ))}
          </div>
        </div>

        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-red-400 bg-red-900/20 hover:bg-red-900/30 border border-red-900/40 transition-colors">
          <Trash2 size={11}/> Delete Table
        </button>
      </div>
    );
  }

  if (selected.type === 'zone') {
    const z = floor?.zones?.find(z => z.id === selected.id);
    if (!z) return null;
    return (
      <div className="p-4 space-y-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#6b5c40]">Zone</p>
        <div className="space-y-1">
          <FLabel>Label</FLabel>
          <input type="text" value={z.label ?? ''} placeholder="e.g. VIP Section"
            onChange={e => onUpdateZone('label', e.target.value)}
            className="w-full bg-[#1a1208] border border-[#3a2a14] rounded-lg px-3 py-2 text-sm text-[#e8c97a] placeholder-[#3a2a14] outline-none focus:border-[#f97316]"/>
        </div>
        <div className="space-y-1">
          <FLabel>Color</FLabel>
          <div className="flex flex-wrap gap-2">
            {ZONE_COLORS.map(col => (
              <button key={col} onClick={() => onUpdateZone('color', col)}
                className="w-6 h-6 rounded-md transition-all"
                style={{ backgroundColor: col, boxShadow: z.color === col ? `0 0 0 2px #0c0a07, 0 0 0 4px ${col}` : 'none' }}/>
            ))}
          </div>
        </div>
        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-red-400 bg-red-900/20 hover:bg-red-900/30 border border-red-900/40 transition-colors">
          <Trash2 size={11}/> Delete Zone
        </button>
      </div>
    );
  }

  if (selected.type === 'wall') {
    const w = floor?.walls?.find(w => w.id === selected.id);
    if (!w) return null;
    return (
      <div className="p-4 space-y-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#6b5c40]">Wall</p>
        <div className="space-y-1">
          <FLabel>Thickness ({w.thickness ?? WALL_T}px)</FLabel>
          <input type="range" min={8} max={28} step={2} value={w.thickness ?? WALL_T}
            onChange={e => onUpdateWall('thickness', Number(e.target.value))}
            className="w-full accent-[#f97316]"/>
        </div>
        <p className="text-[10px] text-[#4a3820]">Length: {Math.round(Math.hypot(w.x2 - w.x1, w.y2 - w.y1))}px</p>
        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-red-400 bg-red-900/20 hover:bg-red-900/30 border border-red-900/40 transition-colors">
          <Trash2 size={11}/> Delete Wall
        </button>
      </div>
    );
  }

  if (selected.type === 'door') {
    const d = floor?.doors?.find(d => d.id === selected.id);
    if (!d) return null;
    return (
      <div className="p-4 space-y-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#6b5c40]">Door</p>
        <div className="space-y-1">
          <FLabel>Width ({d.width ?? 70}px)</FLabel>
          <input type="range" min={40} max={120} step={5} value={d.width ?? 70}
            onChange={e => onUpdateDoor('width', Number(e.target.value))} className="w-full accent-[#f97316]"/>
        </div>
        <div className="space-y-1">
          <FLabel>Open angle ({d.openAngle ?? 75}°)</FLabel>
          <input type="range" min={15} max={90} step={5} value={d.openAngle ?? 75}
            onChange={e => onUpdateDoor('openAngle', Number(e.target.value))} className="w-full accent-[#f97316]"/>
        </div>
        <div className="space-y-1">
          <FLabel>Rotation</FLabel>
          <div className="flex items-center gap-1">
            <button onClick={() => onUpdateDoor('rotation', (((d.rotation ?? 0) - 15) + 360) % 360)}
              className="w-8 h-8 rounded-lg bg-[#1a1208] border border-[#3a2a14] text-[#e8c97a] flex items-center justify-center hover:border-[#f97316] text-base">↺</button>
            <span className="flex-1 text-center text-sm font-bold text-[#e8c97a]">{d.rotation ?? 0}°</span>
            <button onClick={() => onUpdateDoor('rotation', ((d.rotation ?? 0) + 15) % 360)}
              className="w-8 h-8 rounded-lg bg-[#1a1208] border border-[#3a2a14] text-[#e8c97a] flex items-center justify-center hover:border-[#f97316] text-base">↻</button>
          </div>
        </div>
        <div className="space-y-1">
          <FLabel>Swing</FLabel>
          <div className="flex gap-1">
            {[1, -1].map(dir => (
              <button key={dir} onClick={() => onUpdateDoor('swingDir', dir)}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${(d.swingDir ?? 1) === dir ? 'bg-[#f97316] text-white border-[#f97316]' : 'border-[#3a2a14] text-[#6b5c40] hover:border-[#f97316]/50'}`}>
                {dir === 1 ? 'Inward' : 'Outward'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-red-400 bg-red-900/20 hover:bg-red-900/30 border border-red-900/40 transition-colors">
          <Trash2 size={11}/> Delete Door
        </button>
      </div>
    );
  }

  if (selected.type === 'window') {
    const w = floor?.windows?.find(w => w.id === selected.id);
    if (!w) return null;
    return (
      <div className="p-4 space-y-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#6b5c40]">Window</p>
        <div className="space-y-1">
          <FLabel>Width ({w.width ?? 80}px)</FLabel>
          <input type="range" min={40} max={160} step={10} value={w.width ?? 80}
            onChange={e => onUpdateWindow('width', Number(e.target.value))} className="w-full accent-[#f97316]"/>
        </div>
        <div className="space-y-1">
          <FLabel>Rotation</FLabel>
          <div className="flex items-center gap-1">
            <button onClick={() => onUpdateWindow('rotation', (((w.rotation ?? 0) - 15) + 360) % 360)}
              className="w-8 h-8 rounded-lg bg-[#1a1208] border border-[#3a2a14] text-[#e8c97a] flex items-center justify-center hover:border-[#f97316] text-base">↺</button>
            <span className="flex-1 text-center text-sm font-bold text-[#e8c97a]">{w.rotation ?? 0}°</span>
            <button onClick={() => onUpdateWindow('rotation', ((w.rotation ?? 0) + 15) % 360)}
              className="w-8 h-8 rounded-lg bg-[#1a1208] border border-[#3a2a14] text-[#e8c97a] flex items-center justify-center hover:border-[#f97316] text-base">↻</button>
          </div>
        </div>
        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-red-400 bg-red-900/20 hover:bg-red-900/30 border border-red-900/40 transition-colors">
          <Trash2 size={11}/> Delete Window
        </button>
      </div>
    );
  }

  return null;
}

// ── Main VIPSetup ─────────────────────────────────────────────
export default function VIPSetup() {
  const qc       = useQueryClient();
  const navigate = useNavigate();

  const { data: rd } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: () => api.get('/restaurants/admin/mine'),
  });
  const restaurant = rd?.data;

  const { data: tablesData, isLoading: tablesLoading } = useQuery({
    queryKey: ['my-tables'],
    queryFn: () => api.get('/owner/tables').then(r => r.data ?? []),
    enabled: !!restaurant,
  });

  // ── State ────────────────────────────────────────────────────
  const [floors,         setFloors]         = useState([DEFAULT_FLOOR()]);
  const [activeFloorId,  setActiveFloorId]  = useState('floor-main');
  const [tables,         setTables]         = useState([]);
  const [deletedIds,     setDeletedIds]     = useState([]);
  const [vipMeta,        setVipMeta]        = useState({ enabled: false, description: '', minSpend: 0 });
  const [selected,       setSelected]       = useState(null);
  const [toolMode,       setToolMode]       = useState('select');
  const [wallFirst,      setWallFirst]      = useState(null);
  const [wallPreview,    setWallPreview]    = useState(null);
  const [zoom,           setZoom]           = useState(1);
  const [dirty,          setDirty]          = useState(false);
  const [renamingFloor,  setRenamingFloor]  = useState(null);
  const [renameVal,      setRenameVal]      = useState('');

  // ── Refs ─────────────────────────────────────────────────────
  const svgRef            = useRef();
  const dragRef           = useRef(null);
  const zoomRef           = useRef(1);
  const activeFloorIdRef  = useRef(activeFloorId);
  const historyRef        = useRef({ past: [], future: [] });

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { activeFloorIdRef.current = activeFloorId; }, [activeFloorId]);

  // ── Derived ──────────────────────────────────────────────────
  const activeFloor = useMemo(
    () => floors.find(f => f.id === activeFloorId) ?? floors[0],
    [floors, activeFloorId],
  );
  const floorTables = useMemo(
    () => tables.filter(t => (t.floorId ?? 'floor-main') === activeFloorId),
    [tables, activeFloorId],
  );

  const patchFloor = useCallback((updates) => {
    const afId = activeFloorIdRef.current;
    setFloors(p => p.map(f => f.id === afId ? { ...f, ...updates } : f));
    setDirty(true);
  }, []);

  // ── Seed from server ─────────────────────────────────────────
  useEffect(() => {
    if (tablesData) setTables(tablesData.map(t => ({ ...t, _localId: String(t._id) })));
  }, [tablesData]);

  useEffect(() => {
    if (!restaurant?.vipService) return;
    const vs = restaurant.vipService;
    setVipMeta({ enabled: vs.enabled ?? false, description: vs.description ?? '', minSpend: vs.minSpend ?? 0 });
    if (vs.floors?.length) {
      setFloors(vs.floors);
      setActiveFloorId(vs.floors[0].id);
    } else {
      const f = DEFAULT_FLOOR();
      if (vs.room)  f.room  = vs.room;
      if (vs.zones) f.zones = vs.zones;
      setFloors([f]);
      setActiveFloorId(f.id);
    }
  }, [restaurant]);

  // ── History ──────────────────────────────────────────────────
  const snapshot = useCallback(() => ({
    tables: tables.map(t => ({ ...t, position: { ...t.position } })),
    floors: floors.map(f => ({ ...f, zones: (f.zones??[]).map(z=>({...z})), walls: (f.walls??[]).map(w=>({...w})), doors: (f.doors??[]).map(d=>({...d})), windows: (f.windows??[]).map(w=>({...w})) })),
  }), [tables, floors]);

  const pushHistory = useCallback(() => {
    const h = historyRef.current;
    h.past.push(snapshot());
    h.future = [];
    if (h.past.length > 60) h.past.shift();
  }, [snapshot]);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (!h.past.length) return;
    h.future.push(snapshot());
    const prev = h.past.pop();
    setTables(prev.tables); setFloors(prev.floors); setDirty(true); setSelected(null);
  }, [snapshot]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (!h.future.length) return;
    h.past.push(snapshot());
    const next = h.future.pop();
    setTables(next.tables); setFloors(next.floors); setDirty(true); setSelected(null);
  }, [snapshot]);

  // ── SVG coord ────────────────────────────────────────────────
  const toWorld = useCallback((clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    const svgX  = (clientX - rect.left) * (CANVAS_W / rect.width);
    const svgY  = (clientY - rect.top)  * (CANVAS_H / rect.height);
    const z     = zoomRef.current;
    return { x: (svgX - CX) / z + CX, y: (svgY - CY) / z + CY };
  }, []);

  // ── Drag starts ──────────────────────────────────────────────
  const startTableDrag = useCallback((e, id) => {
    const t = tables.find(t => (t._localId ?? t._id) === id);
    const w = toWorld(e.clientX, e.clientY);
    dragRef.current = { type: 'table', id, startMX: w.x, startMY: w.y, startOX: t?.position?.x ?? 0, startOY: t?.position?.y ?? 0 };
    setSelected({ type: 'table', id });
    svgRef.current.setPointerCapture(e.pointerId);
  }, [tables, toWorld]);

  const startZoneDrag = useCallback((e, id) => {
    const z = floors.find(f => f.id === activeFloorIdRef.current)?.zones?.find(z => z.id === id);
    const w = toWorld(e.clientX, e.clientY);
    dragRef.current = { type: 'zone-move', id, startMX: w.x, startMY: w.y, startOX: z?.x ?? 0, startOY: z?.y ?? 0 };
    setSelected({ type: 'zone', id });
    svgRef.current.setPointerCapture(e.pointerId);
  }, [floors, toWorld]);

  const startZoneResize = useCallback((e, id, corner) => {
    const z = floors.find(f => f.id === activeFloorIdRef.current)?.zones?.find(z => z.id === id);
    const w = toWorld(e.clientX, e.clientY);
    dragRef.current = { type: 'zone-resize', id, corner, startMX: w.x, startMY: w.y, startOX: z?.x ?? 0, startOY: z?.y ?? 0, startOW: z?.w ?? 160, startOH: z?.h ?? 100 };
    svgRef.current.setPointerCapture(e.pointerId);
  }, [floors, toWorld]);

  const startRoomResize = useCallback((e, corner) => {
    const af = floors.find(f => f.id === activeFloorIdRef.current);
    const rm = af?.room ?? DEFAULT_ROOM;
    const w  = toWorld(e.clientX, e.clientY);
    dragRef.current = { type: 'room-resize', corner, startMX: w.x, startMY: w.y, startOX: rm.x, startOY: rm.y, startOW: rm.w, startOH: rm.h };
    svgRef.current.setPointerCapture(e.pointerId);
  }, [floors, toWorld]);

  const startWallDrag = useCallback((e, id) => {
    const af   = floors.find(f => f.id === activeFloorIdRef.current);
    const wall = af?.walls?.find(w => w.id === id);
    const w    = toWorld(e.clientX, e.clientY);
    dragRef.current = { type: 'wall-move', id, startMX: w.x, startMY: w.y, startOX: wall?.x1 ?? 0, startOY: wall?.y1 ?? 0, startOX2: wall?.x2 ?? 100, startOY2: wall?.y2 ?? 0 };
    setSelected({ type: 'wall', id });
    svgRef.current.setPointerCapture(e.pointerId);
  }, [floors, toWorld]);

  const startDoorDrag = useCallback((e, id) => {
    const af   = floors.find(f => f.id === activeFloorIdRef.current);
    const door = af?.doors?.find(d => d.id === id);
    const w    = toWorld(e.clientX, e.clientY);
    dragRef.current = { type: 'door-move', id, startMX: w.x, startMY: w.y, startOX: door?.x ?? 0, startOY: door?.y ?? 0 };
    setSelected({ type: 'door', id });
    svgRef.current.setPointerCapture(e.pointerId);
  }, [floors, toWorld]);

  const startWindowDrag = useCallback((e, id) => {
    const af  = floors.find(f => f.id === activeFloorIdRef.current);
    const win = af?.windows?.find(w => w.id === id);
    const w   = toWorld(e.clientX, e.clientY);
    dragRef.current = { type: 'window-move', id, startMX: w.x, startMY: w.y, startOX: win?.x ?? 0, startOY: win?.y ?? 0 };
    setSelected({ type: 'window', id });
    svgRef.current.setPointerCapture(e.pointerId);
  }, [floors, toWorld]);

  // ── Pointer move ─────────────────────────────────────────────
  const handlePointerMove = useCallback((e) => {
    if (toolMode === 'wall' && wallFirst) {
      const w = toWorld(e.clientX, e.clientY);
      setWallPreview({ x: snap(w.x), y: snap(w.y) });
    }
    if (!dragRef.current) return;
    const { type, id, corner, startMX, startMY, startOX, startOY, startOW, startOH, startOX2, startOY2 } = dragRef.current;
    const w  = toWorld(e.clientX, e.clientY);
    const dx = w.x - startMX;
    const dy = w.y - startMY;
    const afId = activeFloorIdRef.current;

    if (type === 'table') {
      const nx = snap(clamp(startOX + dx, 30, CANVAS_W - 30));
      const ny = snap(clamp(startOY + dy, 30, CANVAS_H - 30));
      setTables(p => p.map(t => (t._localId ?? t._id) === id ? { ...t, position: { x: nx, y: ny } } : t));
      setDirty(true);
    } else if (type === 'zone-move') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, zones: f.zones.map(z => z.id === id ? { ...z, x: snap(startOX + dx), y: snap(startOY + dy) } : z) } : f));
      setDirty(true);
    } else if (type === 'zone-resize') {
      let x = startOX, y = startOY, zw = startOW, zh = startOH;
      if (corner === 'nw') { x = snap(startOX + dx); y = snap(startOY + dy); zw = snap(startOW - dx); zh = snap(startOH - dy); }
      else if (corner === 'ne') { zw = snap(startOW + dx); y = snap(startOY + dy); zh = snap(startOH - dy); }
      else if (corner === 'se') { zw = snap(startOW + dx); zh = snap(startOH + dy); }
      else if (corner === 'sw') { x = snap(startOX + dx); zw = snap(startOW - dx); zh = snap(startOH + dy); }
      if (zw < 60) zw = 60; if (zh < 40) zh = 40;
      setFloors(p => p.map(f => f.id === afId ? { ...f, zones: f.zones.map(z => z.id === id ? { ...z, x, y, w: zw, h: zh } : z) } : f));
      setDirty(true);
    } else if (type === 'room-resize') {
      const MIN = 200;
      let x = startOX, y = startOY, rw = startOW, rh = startOH;
      if (corner === 'nw') { x = snap(startOX + dx); y = snap(startOY + dy); rw = snap(startOW - dx); rh = snap(startOH - dy); }
      else if (corner === 'ne') { rw = snap(startOW + dx); y = snap(startOY + dy); rh = snap(startOH - dy); }
      else if (corner === 'se') { rw = snap(startOW + dx); rh = snap(startOH + dy); }
      else if (corner === 'sw') { x = snap(startOX + dx); rw = snap(startOW - dx); rh = snap(startOH + dy); }
      if (rw < MIN) rw = MIN; if (rh < MIN) rh = MIN;
      setFloors(p => p.map(f => f.id === afId ? { ...f, room: { x, y, w: rw, h: rh } } : f));
      setDirty(true);
    } else if (type === 'wall-move') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, walls: f.walls.map(wall => wall.id === id ? { ...wall, x1: snap(startOX + dx), y1: snap(startOY + dy), x2: snap(startOX2 + dx), y2: snap(startOY2 + dy) } : wall) } : f));
      setDirty(true);
    } else if (type === 'door-move') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, doors: f.doors.map(d => d.id === id ? { ...d, x: snap(startOX + dx), y: snap(startOY + dy) } : d) } : f));
      setDirty(true);
    } else if (type === 'window-move') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, windows: f.windows.map(win => win.id === id ? { ...win, x: snap(startOX + dx), y: snap(startOY + dy) } : win) } : f));
      setDirty(true);
    }
  }, [toolMode, wallFirst, toWorld]);

  const handlePointerUp = useCallback(() => {
    if (dragRef.current) { pushHistory(); dragRef.current = null; }
  }, [pushHistory]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(3, z * (1 - e.deltaY * 0.001))));
  }, []);

  const handleCanvasClick = useCallback((e) => {
    if (toolMode === 'wall') {
      const w  = toWorld(e.clientX, e.clientY);
      const pt = { x: snap(w.x), y: snap(w.y) };
      if (!wallFirst) {
        setWallFirst(pt);
      } else {
        if (Math.hypot(pt.x - wallFirst.x, pt.y - wallFirst.y) > 10) {
          pushHistory();
          const nw = { id: genId(), x1: wallFirst.x, y1: wallFirst.y, x2: pt.x, y2: pt.y, thickness: WALL_T };
          setFloors(p => p.map(f => f.id === activeFloorIdRef.current ? { ...f, walls: [...(f.walls ?? []), nw] } : f));
          setDirty(true);
        }
        setWallFirst(null); setWallPreview(null);
      }
    } else {
      setSelected(null);
    }
  }, [toolMode, wallFirst, toWorld, pushHistory]);

  // ── Add helpers ──────────────────────────────────────────────
  const addTable = useCallback((shape, cap) => {
    pushHistory();
    const used = new Set(tables.map(t => String(t.number)));
    let n = 1;
    while (used.has(String(n))) n++;
    const newT = {
      _localId: `new-${localIdCtr++}`,
      number:   String(n),
      capacity: cap,
      shape,
      rotation: 0,
      floorId:  activeFloorIdRef.current,
      position: { x: snap(220 + (floorTables.length % 4) * 130), y: snap(200 + Math.floor(floorTables.length / 4) * 140) },
    };
    setTables(p => [...p, newT]);
    setSelected({ type: 'table', id: newT._localId });
    setDirty(true);
  }, [tables, floorTables.length, pushHistory]);

  const addZone = useCallback(() => {
    pushHistory();
    const r   = activeFloor?.room ?? DEFAULT_ROOM;
    const col = ZONE_COLORS[(activeFloor?.zones?.length ?? 0) % ZONE_COLORS.length];
    const nz  = { id: genId(), label: `Zone ${(activeFloor?.zones?.length ?? 0) + 1}`, color: col, x: snap(r.x + 40), y: snap(r.y + 40), w: 160, h: 100 };
    patchFloor({ zones: [...(activeFloor?.zones ?? []), nz] });
    setSelected({ type: 'zone', id: nz.id });
  }, [activeFloor, patchFloor, pushHistory]);

  const addDoor = useCallback(() => {
    pushHistory();
    const r  = activeFloor?.room ?? DEFAULT_ROOM;
    const nd = { id: genId(), x: snap(r.x + r.w / 2), y: r.y, rotation: 0, width: 70, openAngle: 75, swingDir: 1 };
    patchFloor({ doors: [...(activeFloor?.doors ?? []), nd] });
    setSelected({ type: 'door', id: nd.id });
  }, [activeFloor, patchFloor, pushHistory]);

  const addWindow = useCallback(() => {
    pushHistory();
    const r  = activeFloor?.room ?? DEFAULT_ROOM;
    const nw = { id: genId(), x: snap(r.x + r.w / 3), y: r.y, rotation: 0, width: 80 };
    patchFloor({ windows: [...(activeFloor?.windows ?? []), nw] });
    setSelected({ type: 'window', id: nw.id });
  }, [activeFloor, patchFloor, pushHistory]);

  // ── Update ───────────────────────────────────────────────────
  const updateSelectedTable = useCallback((key, value) => {
    if (!selected || selected.type !== 'table') return;
    pushHistory();
    setTables(p => p.map(t => (t._localId ?? t._id) === selected.id ? { ...t, [key]: value } : t));
    setDirty(true);
  }, [selected, pushHistory]);

  const updateSelectedZone = useCallback((key, value) => {
    if (!selected || selected.type !== 'zone') return;
    setFloors(p => p.map(f => f.id === activeFloorIdRef.current ? { ...f, zones: f.zones.map(z => z.id === selected.id ? { ...z, [key]: value } : z) } : f));
    setDirty(true);
  }, [selected]);

  const updateSelectedWall = useCallback((key, value) => {
    if (!selected || selected.type !== 'wall') return;
    setFloors(p => p.map(f => f.id === activeFloorIdRef.current ? { ...f, walls: f.walls.map(w => w.id === selected.id ? { ...w, [key]: value } : w) } : f));
    setDirty(true);
  }, [selected]);

  const updateSelectedDoor = useCallback((key, value) => {
    if (!selected || selected.type !== 'door') return;
    setFloors(p => p.map(f => f.id === activeFloorIdRef.current ? { ...f, doors: f.doors.map(d => d.id === selected.id ? { ...d, [key]: value } : d) } : f));
    setDirty(true);
  }, [selected]);

  const updateSelectedWindow = useCallback((key, value) => {
    if (!selected || selected.type !== 'window') return;
    setFloors(p => p.map(f => f.id === activeFloorIdRef.current ? { ...f, windows: f.windows.map(w => w.id === selected.id ? { ...w, [key]: value } : w) } : f));
    setDirty(true);
  }, [selected]);

  // ── Delete ───────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (!selected) return;
    pushHistory();
    const afId = activeFloorIdRef.current;
    if (selected.type === 'table') {
      const t = tables.find(t => (t._localId ?? t._id) === selected.id);
      if (t?._id && !String(t._id).startsWith('new-')) setDeletedIds(p => [...p, t._id]);
      setTables(p => p.filter(t => (t._localId ?? t._id) !== selected.id));
    } else if (selected.type === 'zone') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, zones: f.zones.filter(z => z.id !== selected.id) } : f));
    } else if (selected.type === 'wall') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, walls: f.walls.filter(w => w.id !== selected.id) } : f));
    } else if (selected.type === 'door') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, doors: f.doors.filter(d => d.id !== selected.id) } : f));
    } else if (selected.type === 'window') {
      setFloors(p => p.map(f => f.id === afId ? { ...f, windows: f.windows.filter(w => w.id !== selected.id) } : f));
    }
    setSelected(null); setDirty(true);
  }, [selected, tables, pushHistory]);

  // ── Floor management ─────────────────────────────────────────
  const addFloor = useCallback(() => {
    pushHistory();
    const f = { id: genId(), name: `Floor ${floors.length + 1}`, order: floors.length, room: { ...DEFAULT_ROOM }, zones: [], walls: [], doors: [], windows: [] };
    setFloors(p => [...p, f]);
    setActiveFloorId(f.id);
    setSelected(null); setDirty(true);
  }, [floors, pushHistory]);

  const deleteFloor = useCallback((id) => {
    if (floors.length <= 1) return;
    pushHistory();
    const fTables = tables.filter(t => (t.floorId ?? 'floor-main') === id);
    setDeletedIds(p => [...p, ...fTables.filter(t => t._id && !String(t._id).startsWith('new-')).map(t => t._id)]);
    setTables(p => p.filter(t => (t.floorId ?? 'floor-main') !== id));
    setFloors(p => p.filter(f => f.id !== id));
    setActiveFloorId(p => p === id ? floors.find(f => f.id !== id)?.id ?? floors[0].id : p);
    setSelected(null); setDirty(true);
  }, [floors, tables, pushHistory]);

  const renameFloor = useCallback((id, name) => {
    setFloors(p => p.map(f => f.id === id ? { ...f, name } : f));
    setDirty(true);
  }, []);

  // ── Save ─────────────────────────────────────────────────────
  const { mutate: saveAll, isPending: saving } = useMutation({
    mutationFn: async () => {
      await api.put('/restaurants/admin/mine', {
        vipService: { ...vipMeta, floors, room: floors[0]?.room ?? DEFAULT_ROOM, zones: floors[0]?.zones ?? [] },
      });
      await Promise.all(deletedIds.map(id => api.delete(`/owner/tables/${id}`)));
      for (const t of tables) {
        const payload = { number: t.number, capacity: t.capacity, shape: t.shape, position: t.position, rotation: t.rotation ?? 0, floorId: t.floorId ?? 'floor-main' };
        if (t._id && !String(t._id).startsWith('new-'))
          await api.patch(`/owner/tables/${t._id}`, payload);
        else
          await api.post('/owner/tables', payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-tables'] });
      qc.invalidateQueries({ queryKey: ['my-restaurant'] });
      setDeletedIds([]); setDirty(false); setSelected(null);
      historyRef.current = { past: [], future: [] };
      toast.success('VIP setup saved!');
    },
    onError: err => toast.error(err?.response?.data?.message ?? 'Save failed'),
  });

  // ── Keyboard ─────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
      if (e.key === 'Escape') { setToolMode('select'); setWallFirst(null); setWallPreview(null); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [undo, redo, deleteSelected]);

  if (tablesLoading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#0c0a07' }}
        className="flex items-center justify-center">
        <RefreshCw size={24} className="animate-spin text-[#f97316]"/>
      </div>
    );
  }

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#0c0a07', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{ background: '#111009', borderBottom: '1px solid #2a1e0e', height: 52, flexShrink: 0 }}
        className="flex items-center gap-4 px-4">
        <button onClick={() => navigate('/admin')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#6b5c40] hover:text-[#e8c97a] hover:bg-[#1a1208] transition-colors text-xs font-semibold">
          <ArrowLeft size={14}/> Back
        </button>
        <div className="w-px h-5 bg-[#2a1e0e]"/>
        <div className="flex items-center gap-2">
          <Crown size={16} className="text-[#f97316]"/>
          <span className="text-sm font-bold text-[#e8c97a]">Floor Plan Builder</span>
          {dirty && <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]"/>}
        </div>
        <div className="flex-1"/>

        {/* VIP toggle */}
        <button onClick={() => { setVipMeta(p => ({ ...p, enabled: !p.enabled })); setDirty(true); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-[#2a1e0e] hover:border-[#f97316]/40">
          {vipMeta.enabled
            ? <><ToggleRight size={18} className="text-[#f97316]"/><span className="text-[#f97316]">VIP On</span></>
            : <><ToggleLeft size={18} className="text-[#4a3820]"/><span className="text-[#4a3820]">VIP Off</span></>}
        </button>

        {vipMeta.enabled && (
          <input type="number" min={0} value={vipMeta.minSpend} placeholder="Min spend"
            onChange={e => { setVipMeta(p => ({ ...p, minSpend: Number(e.target.value) })); setDirty(true); }}
            className="w-24 bg-[#1a1208] border border-[#2a1e0e] rounded-lg px-2 py-1.5 text-xs text-[#e8c97a] placeholder-[#3a2a14] outline-none focus:border-[#f97316]"/>
        )}

        <button onClick={() => saveAll()} disabled={saving || !dirty}
          className="flex items-center gap-2 px-4 py-2 bg-[#f97316] hover:bg-[#ea6c10] disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors">
          <Save size={13}/>{saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT SIDEBAR: floor list ── */}
        <div style={{ width: 200, background: '#111009', borderRight: '1px solid #2a1e0e', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid #2a1e0e' }} className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Layers size={12} className="text-[#6b5c40]"/>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6b5c40]">Floors</span>
            </div>
            <button onClick={addFloor}
              className="w-6 h-6 rounded-md bg-[#1a1208] border border-[#3a2a14] text-[#6b5c40] hover:text-[#f97316] hover:border-[#f97316]/40 flex items-center justify-center transition-colors">
              <Plus size={11}/>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }} className="py-2 px-2 space-y-1.5">
            {floors.map(f => {
              const isActive = f.id === activeFloorId;
              const fTables  = tables.filter(t => (t.floorId ?? 'floor-main') === f.id);
              return (
                <div key={f.id}
                  onClick={() => { setActiveFloorId(f.id); setSelected(null); setWallFirst(null); }}
                  style={{ border: isActive ? '1px solid #f97316' : '1px solid #2a1e0e', background: isActive ? '#1a1208' : 'transparent', cursor: 'pointer' }}
                  className="rounded-xl overflow-hidden transition-all hover:border-[#f97316]/40 group">

                  {/* Mini plan */}
                  <div style={{ background: '#0c0a07', borderBottom: '1px solid #2a1e0e' }}>
                    <FloorThumb floor={f} tables={fTables}/>
                  </div>

                  {/* Name row */}
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    {renamingFloor === f.id ? (
                      <input
                        autoFocus
                        value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { if (renameVal.trim()) renameFloor(f.id, renameVal.trim()); setRenamingFloor(null); }
                          if (e.key === 'Escape') setRenamingFloor(null);
                        }}
                        onBlur={() => { if (renameVal.trim()) renameFloor(f.id, renameVal.trim()); setRenamingFloor(null); }}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 bg-transparent text-[10px] font-bold text-[#e8c97a] outline-none border-b border-[#f97316]"
                      />
                    ) : (
                      <span
                        className={`flex-1 text-[10px] font-bold truncate ${isActive ? 'text-[#e8c97a]' : 'text-[#4a3820]'}`}
                        onDoubleClick={e => { e.stopPropagation(); setRenamingFloor(f.id); setRenameVal(f.name); }}>
                        {f.name}
                      </span>
                    )}
                    <span className="text-[9px] text-[#3a2a14] shrink-0">{fTables.length}t</span>
                    {floors.length > 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteFloor(f.id); }}
                        className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded flex items-center justify-center text-red-600 hover:text-red-400 transition-all shrink-0">
                        <X size={9}/>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CENTER: canvas ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Toolbar */}
          <div style={{ borderBottom: '1px solid #2a1e0e', background: '#111009', flexShrink: 0 }}
            className="flex items-center gap-1.5 px-3 py-2 flex-wrap">

            {/* Tool mode */}
            {[
              { mode: 'select', icon: <MousePointer2 size={11}/>, label: 'Select' },
              { mode: 'wall',   icon: <Minus size={11}/>,         label: toolMode === 'wall' && wallFirst ? 'Click 2nd…' : 'Wall' },
            ].map(({ mode, icon, label }) => (
              <button key={mode}
                onClick={() => { setToolMode(mode); if (mode !== 'wall') { setWallFirst(null); setWallPreview(null); } }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${toolMode === mode ? 'bg-[#f97316] text-white border-[#f97316]' : 'border-[#2a1e0e] text-[#6b5c40] hover:border-[#f97316]/40 hover:text-[#e8c97a]'}`}>
                {icon} {label}
              </button>
            ))}

            <div style={{ width: 1, height: 16, background: '#2a1e0e' }} className="mx-1"/>

            {/* Add elements */}
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#3a2a14]">Add:</span>
            <button onClick={addZone}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-[#2a1e0e] text-[#6b5c40] hover:border-[#f97316]/40 hover:text-[#e8c97a] transition-all">
              <Tag size={10}/> Zone
            </button>
            <button onClick={addDoor}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-[#2a1e0e] text-[#6b5c40] hover:border-[#f97316]/40 hover:text-[#e8c97a] transition-all">
              <DoorOpen size={10}/> Door
            </button>
            <button onClick={addWindow}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-[#2a1e0e] text-[#6b5c40] hover:border-[#f97316]/40 hover:text-[#e8c97a] transition-all">
              <span className="text-[10px] font-black">⊟</span> Window
            </button>

            <div style={{ flex: 1 }}/>

            {/* Status */}
            <span className="text-[9px] text-[#3a2a14]">
              {floorTables.length}t · {activeFloor?.walls?.length ?? 0}w · {activeFloor?.doors?.length ?? 0}d
            </span>

            <div style={{ width: 1, height: 16, background: '#2a1e0e' }} className="mx-1"/>

            {/* Undo/Redo */}
            <button onClick={undo} disabled={!canUndo} title="Ctrl+Z"
              className="p-1.5 rounded-lg text-[#4a3820] hover:text-[#e8c97a] hover:bg-[#1a1208] disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
              <Undo size={12}/>
            </button>
            <button onClick={redo} disabled={!canRedo} title="Ctrl+Y"
              className="p-1.5 rounded-lg text-[#4a3820] hover:text-[#e8c97a] hover:bg-[#1a1208] disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
              <Redo size={12}/>
            </button>

            <div style={{ width: 1, height: 16, background: '#2a1e0e' }} className="mx-1"/>

            {/* Zoom */}
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))}
              className="p-1.5 rounded-lg text-[#4a3820] hover:text-[#e8c97a] hover:bg-[#1a1208] transition-colors"><ZoomOut size={12}/></button>
            <button onClick={() => setZoom(1)}
              className="px-2 py-1 text-[10px] font-bold text-[#4a3820] hover:text-[#e8c97a] min-w-[40px] text-center transition-colors">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.15))}
              className="p-1.5 rounded-lg text-[#4a3820] hover:text-[#e8c97a] hover:bg-[#1a1208] transition-colors"><ZoomIn size={12}/></button>
            <button onClick={() => { setZoom(1); setSelected(null); }} title="Reset view"
              className="p-1.5 rounded-lg text-[#4a3820] hover:text-[#e8c97a] hover:bg-[#1a1208] transition-colors"><RotateCcw size={12}/></button>
          </div>

          {/* Canvas */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <FloorCanvas
              svgRef={svgRef}
              floor={activeFloor}
              tables={floorTables}
              selected={selected}
              zoom={zoom}
              toolMode={toolMode}
              wallFirst={wallFirst}
              wallPreview={wallPreview}
              startTableDrag={startTableDrag}
              startZoneDrag={startZoneDrag}
              startZoneResize={startZoneResize}
              startRoomResize={startRoomResize}
              startWallDrag={startWallDrag}
              startDoorDrag={startDoorDrag}
              startWindowDrag={startWindowDrag}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
              onCanvasClick={handleCanvasClick}
              onSelect={(type, id) => setSelected({ type, id })}
            />
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ width: 220, background: '#111009', borderLeft: '1px solid #2a1e0e', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Table palette */}
          <div style={{ borderBottom: '1px solid #2a1e0e', flexShrink: 0 }} className="px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#6b5c40] mb-2">Place Table</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TABLE_PRESETS.map(({ shape, cap, label }) => (
                <button key={`${shape}-${cap}`}
                  onClick={() => addTable(shape, cap)}
                  className="flex flex-col items-center gap-1 py-2 rounded-xl border border-[#2a1e0e] hover:border-[#f97316]/50 hover:bg-[#1a1208] transition-all group">
                  <TablePreviewSvg shape={shape} cap={cap}/>
                  <span className="text-[8px] font-bold text-[#4a3820] group-hover:text-[#e8c97a] transition-colors">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Properties */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <PropertiesPanel
              selected={selected}
              tables={tables}
              floor={activeFloor}
              onUpdateTable={updateSelectedTable}
              onUpdateZone={updateSelectedZone}
              onUpdateWall={updateSelectedWall}
              onUpdateDoor={updateSelectedDoor}
              onUpdateWindow={updateSelectedWindow}
              onDelete={deleteSelected}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
