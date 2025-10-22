"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar
} from "recharts";

/**
 * F1 Telemetry Dashboard Component
 * ---------------------------------------------------------------
 * Authentic F1-style telemetry visualization for UTFR racing data.
 * Integrates with existing UTFR data management system.
 */

// === COLOR TOKENS (aligned to F1 telemetry screenshots) ===
const C = {
  bg: "#0A0A0A",
  panel: "#0E0E0E",
  grid: "#262626",
  text: "#EAEAEA",
  subtext: "#B5B5B5",
  ok: "#00FF66",
  warn: "#FFD633",
  err: "#FF3333",
  secondary: "#00E5FF",
  fastest: "#B066FF",
  white: "#FFFFFF",
};

// === MOCK DATA (will be replaced with real UTFR data) ===
const laps = Array.from({ length: 17 }, (_, i) => ({
  t: i,
  spd: 210 + Math.sin(i / 2) * 15 + (i % 3 === 0 ? 10 : 0),
  thr: 100 * Math.abs(Math.sin(i / 3)),
  brk: 100 * Math.abs(Math.cos(i / 3 + 0.6)),
}));

const timingRows = [
  { label: "Oil Temp", value: 106, unit: "°C", state: "ok" },
  { label: "Water Temp", value: 98, unit: "°C", state: "ok" },
  { label: "Brake FR", value: 432, unit: "°C", state: "warn" },
  { label: "Brake FL", value: 414, unit: "°C", state: "ok" },
  { label: "Battery", value: 78, unit: "%", state: "ok" },
  { label: "MGU-K", value: 91, unit: "%", state: "ok" },
  { label: "Fuel Rem.", value: 13.4, unit: "L", state: "warn" },
  { label: "ERS Mode", value: "H", unit: "", state: "ok" },
];

const tyreTemps = [
  { name: "FL", val: 105 },
  { name: "FR", val: 104 },
  { name: "RL", val: 99 },
  { name: "RR", val: 101 },
];

// === SMALL UI PRIMS ===
const Panel = ({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-2xl border border-neutral-800 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] ${className}`}
    style={{ backgroundColor: C.panel }}
  >
    {title && (
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs tracking-[0.18em] text-neutral-400">{title}</h3>
        <div className="h-px flex-1 bg-neutral-800 ml-3" />
      </div>
    )}
    {children}
  </div>
);

const dotPulse = {
  animate: {
    opacity: [0.4, 1, 0.4],
    scale: [1, 1.18, 1],
    transition: { duration: 1.6, repeat: Infinity },
  },
};

const StatusPill = ({ state = "ok", label = "OK" }: { state?: string; label?: string }) => {
  const color = state === "ok" ? C.ok : state === "warn" ? C.warn : C.err;
  return (
    <span
      className="rounded-md px-2 py-0.5 text-[10px] font-medium"
      style={{ background: color, color: "#06140B" }}
    >
      {label}
    </span>
  );
};

const SectorBlock = ({ label, time, fastest = false }: { label: string; time: string; fastest?: boolean }) => (
  <div className="flex flex-col">
    <div
      className="px-2 py-1 text-[10px] tracking-[0.15em] uppercase rounded-sm mb-1"
      style={{ background: "#2A2A2A", color: fastest ? C.fastest : C.text }}
    >
      {label}
    </div>
    <div
      className="rounded-md px-2 py-1 text-lg font-semibold font-mono"
      style={{ background: fastest ? C.fastest : "#1F1F1F", color: C.white }}
    >
      {time}
    </div>
  </div>
);

// === CHARTS ===
const TelemetryChart = () => (
  <ResponsiveContainer width="100%" height={220}>
    <LineChart data={laps} margin={{ top: 6, right: 6, left: 0, bottom: 6 }}>
      <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
      <XAxis dataKey="t" stroke={C.subtext} tick={{ fontSize: 10 }} />
      <YAxis stroke={C.subtext} tick={{ fontSize: 10 }} />
      <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", color: C.text }} />
      <Line type="monotone" dataKey="spd" stroke={C.secondary} dot={false} strokeWidth={2} />
      <Line type="monotone" dataKey="thr" stroke={C.ok} dot={false} strokeWidth={2} />
      <Line type="monotone" dataKey="brk" stroke={C.err} dot={false} strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
);

const MiniArea = () => (
  <ResponsiveContainer width="100%" height={110}>
    <AreaChart data={laps} margin={{ top: 6, right: 6, left: 0, bottom: 6 }}>
      <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
      <XAxis dataKey="t" stroke={C.subtext} tick={{ fontSize: 10 }} />
      <YAxis stroke={C.subtext} tick={{ fontSize: 10 }} />
      <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", color: C.text }} />
      <Area type="monotone" dataKey="spd" stroke={C.secondary} fill="#003844" fillOpacity={0.6} />
    </AreaChart>
  </ResponsiveContainer>
);

const TyreRadials = () => (
  <div className="grid grid-cols-4 gap-3">
    {tyreTemps.map((t) => (
      <div key={t.name} className="flex flex-col items-center">
        <div className="w-full h-28">
          <ResponsiveContainer>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              barCategoryGap={2}
              data={[{ name: t.name, value: Math.min(120, t.val) }]}
              startAngle={230}
              endAngle={-50}
            >
              <RadialBar dataKey="value" cornerRadius={6} fill={C.ok} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 text-xs text-neutral-400">{t.name}</div>
        <div className="font-mono text-sm text-white">{t.val}°C</div>
      </div>
    ))}
  </div>
);

// === SVGs ===
const TrackMap = () => (
  <div className="relative">
    <svg viewBox="0 0 800 600" className="w-full h-[260px]">
      {/* Brechin Motorsport Park Layout */}
      {/* Main track outline - thick red line */}
      <path
        d="M150,450 C200,480 280,490 350,460 C420,430 480,400 520,360 C580,300 600,240 580,200 C560,160 500,140 450,150 C400,160 350,180 300,220 C250,260 200,300 180,350 C160,400 140,420 150,450 Z"
        fill="none"
        stroke="#DC2626"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Alternative track lines - light gray */}
      <path
        d="M150,450 C200,480 280,490 350,460 C420,430 480,400 520,360 C580,300 600,240 580,200 C560,160 500,140 450,150 C400,160 350,180 300,220 C250,260 200,300 180,350 C160,400 140,420 150,450 Z"
        fill="none"
        stroke="#6B7280"
        strokeWidth="2"
        strokeDasharray="4,4"
        opacity="0.6"
      />
      
      {/* Pit Lane and Paddock Area */}
      <rect x="320" y="420" width="80" height="60" fill="#374151" stroke="#6B7280" strokeWidth="1" />
      <rect x="330" y="430" width="20" height="15" fill="#1F2937" />
      <rect x="360" y="430" width="20" height="15" fill="#1F2937" />
      <rect x="330" y="450" width="20" height="15" fill="#1F2937" />
      <rect x="360" y="450" width="20" height="15" fill="#1F2937" />
      
      {/* Grid Area */}
      <rect x="400" y="440" width="40" height="20" fill="#374151" stroke="#6B7280" strokeWidth="1" />
      <text x="420" y="453" textAnchor="middle" fontSize="8" fill="#9CA3AF">GRID</text>
      
      {/* Start/Finish Line */}
      <line x1="150" y1="450" x2="150" y2="460" stroke="#FFFFFF" strokeWidth="3" />
      <text x="130" y="455" textAnchor="middle" fontSize="8" fill="#9CA3AF">START</text>
      
      {/* Marshal Posts */}
      <g>
        <circle cx="200" cy="400" r="3" fill="#6B7280" />
        <text x="205" y="405" fontSize="8" fill="#9CA3AF">M1</text>
        
        <circle cx="280" cy="380" r="3" fill="#6B7280" />
        <text x="285" y="385" fontSize="8" fill="#9CA3AF">M2</text>
        
        <circle cx="350" cy="360" r="3" fill="#6B7280" />
        <text x="355" y="365" fontSize="8" fill="#9CA3AF">M3</text>
        
        <circle cx="450" cy="320" r="3" fill="#6B7280" />
        <text x="455" y="325" fontSize="8" fill="#9CA3AF">M7</text>
        
        <circle cx="520" cy="280" r="3" fill="#6B7280" />
        <text x="525" y="285" fontSize="8" fill="#9CA3AF">M8</text>
        
        <circle cx="580" cy="220" r="3" fill="#6B7280" />
        <text x="585" y="225" fontSize="8" fill="#9CA3AF">M11</text>
        
        <circle cx="550" cy="180" r="3" fill="#6B7280" />
        <text x="555" y="185" fontSize="8" fill="#9CA3AF">M13</text>
        
        <circle cx="450" cy="160" r="3" fill="#6B7280" />
        <text x="455" y="165" fontSize="8" fill="#9CA3AF">M14</text>
      </g>
      
      {/* Sector segments with colors */}
      <path d="M150,450 C200,480 280,490 350,460" stroke={C.ok} strokeWidth="6" fill="none" />
      <path d="M350,460 C420,430 480,400 520,360" stroke={C.warn} strokeWidth="6" fill="none" />
      <path d="M520,360 C580,300 600,240 580,200 C560,160 500,140 450,150 C400,160 350,180 300,220 C250,260 200,300 180,350 C160,400 140,420 150,450" stroke={C.err} strokeWidth="6" fill="none" />
      
      {/* Driver position */}
      <motion.circle cx="350" cy="460" r="8" fill={C.secondary} {...dotPulse} />
      <text x="350" y="480" textAnchor="middle" fontSize="8" fill={C.secondary}>DRIVER</text>
    </svg>
    
    {/* Legend */}
    <div className="absolute left-2 top-2 bg-black/60 rounded p-2 text-xs">
      <div className="text-white font-bold mb-1">BRECHIN MOTORSPORT PARK</div>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-4 h-1 bg-red-600 rounded"></div>
        <span className="text-gray-300">MAIN TRACK</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-4 h-1 bg-gray-500 rounded"></div>
        <span className="text-gray-300">ALTERNATIVE</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
        <span className="text-gray-300">MARSHAL POST</span>
      </div>
    </div>
    
    <div className="absolute right-2 top-2 flex gap-2">
      <SectorLegend color={C.ok} label="SECTOR 1" />
      <SectorLegend color={C.warn} label="SECTOR 2" />
      <SectorLegend color={C.err} label="SECTOR 3" />
    </div>
  </div>
);

const SectorLegend = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-2 rounded-md bg-black/40 px-2 py-1">
    <span className="h-2 w-6 rounded" style={{ background: color }} />
    <span className="text-[10px] tracking-[0.18em] text-neutral-300">{label}</span>
  </div>
);

const CarWireframe = () => (
  <div className="relative">
    <svg viewBox="0 0 800 400" className="w-full h-[220px]">
      {/* UTFR Car - Dark Blue and White Livery */}
      
      {/* Main Chassis - Dark Blue */}
      <rect x="350" y="120" width="100" height="120" rx="8" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="2" />
      
      {/* Nose Cone - White with Blue Stripe */}
      <ellipse cx="450" cy="180" rx="60" ry="20" fill="#FFFFFF" stroke="#1E40AF" strokeWidth="2" />
      <rect x="390" y="160" width="60" height="40" fill="#FFFFFF" stroke="#1E40AF" strokeWidth="1" />
      {/* Blue Stripe on Nose */}
      <rect x="390" y="170" width="60" height="8" fill="#00E5FF" />
      
      {/* Car Number 24 */}
      <text x="420" y="185" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#000000">24</text>
      
      {/* Side Pods - Dark Blue with White Upper Surfaces */}
      <rect x="250" y="140" width="80" height="80" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="2" />
      <rect x="250" y="140" width="80" height="25" fill="#FFFFFF" stroke="#1E40AF" strokeWidth="1" />
      <rect x="250" y="160" width="80" height="8" fill="#00E5FF" />
      
      <rect x="470" y="140" width="80" height="80" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="2" />
      <rect x="470" y="140" width="80" height="25" fill="#FFFFFF" stroke="#1E40AF" strokeWidth="1" />
      <rect x="470" y="160" width="80" height="8" fill="#00E5FF" />
      
      {/* Front Wing - Multi-element with Blue Stripe */}
      <g>
        <rect x="480" y="150" width="120" height="8" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="1" />
        <rect x="480" y="160" width="120" height="6" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="1" />
        <rect x="480" y="168" width="120" height="4" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="1" />
        <rect x="480" y="174" width="120" height="3" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="1" />
        {/* Blue Stripe on Front Wing */}
        <rect x="480" y="150" width="120" height="4" fill="#00E5FF" />
        {/* Endplates */}
        <rect x="480" y="150" width="4" height="30" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="1" />
        <rect x="596" y="150" width="4" height="30" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="1" />
      </g>
      
      {/* Rear Wing - Multi-element */}
      <g>
        <rect x="200" y="120" width="120" height="8" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="1" />
        <rect x="200" y="110" width="120" height="6" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="1" />
        <rect x="200" y="102" width="120" height="4" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="1" />
        <rect x="200" y="96" width="120" height="3" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="1" />
        {/* Endplates with UTFR Branding */}
        <rect x="200" y="96" width="4" height="35" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="1" />
        <rect x="316" y="96" width="4" height="35" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="1" />
        
        {/* UTFR Logo on Left Endplate */}
        <text x="205" y="110" fontSize="6" fill="#FFFFFF" transform="rotate(-90 205 110)">UTFR</text>
        <text x="205" y="120" fontSize="4" fill="#FFFFFF" transform="rotate(-90 205 120)">UNIVERSITY OF TORONTO</text>
        
        {/* ACT-HPC Logo on Right Endplate */}
        <text x="320" y="110" fontSize="6" fill="#FFFFFF" transform="rotate(-90 320 110)">ACT-HPC</text>
        <text x="320" y="120" fontSize="4" fill="#FFFFFF" transform="rotate(-90 320 120)">BATEMO</text>
      </g>
      
      {/* Wheels and Tires - Black */}
      <circle cx="200" cy="200" r="35" fill="#000000" stroke="#374151" strokeWidth="2" />
      <circle cx="200" cy="200" r="25" fill="#1F2937" stroke="#374151" strokeWidth="1" />
      
      <circle cx="200" cy="120" r="35" fill="#000000" stroke="#374151" strokeWidth="2" />
      <circle cx="200" cy="120" r="25" fill="#1F2937" stroke="#374151" strokeWidth="1" />
      
      <circle cx="600" cy="200" r="35" fill="#000000" stroke="#374151" strokeWidth="2" />
      <circle cx="600" cy="200" r="25" fill="#1F2937" stroke="#374151" strokeWidth="1" />
      
      <circle cx="600" cy="120" r="35" fill="#000000" stroke="#374151" strokeWidth="2" />
      <circle cx="600" cy="120" r="25" fill="#1F2937" stroke="#374151" strokeWidth="1" />
      
      {/* Suspension System - Black and Silver */}
      <g stroke="#6B7280" strokeWidth="2" fill="none">
        {/* Front Suspension */}
        <path d="M200,200 L280,160 M200,200 L280,200" />
        <path d="M600,200 L520,160 M600,200 L520,200" />
        {/* Rear Suspension */}
        <path d="M200,120 L280,160 M200,120 L280,200" />
        <path d="M600,120 L520,160 M600,120 L520,200" />
      </g>
      
      {/* Engine/Powertrain Area - Dark Blue */}
      <g>
        {/* Engine Block */}
        <rect x="250" y="160" width="100" height="60" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="2" />
        
        {/* Cooling Lines - Blue */}
        <path d="M250,170 L350,170 M250,180 L350,180 M250,190 L350,190" stroke="#00E5FF" strokeWidth="2" />
        <path d="M250,200 L350,200 M250,210 L350,210" stroke="#00E5FF" strokeWidth="2" />
        
        {/* Electrical Cables - White */}
        <path d="M250,175 L350,175 M250,185 L350,185 M250,195 L350,195" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M250,205 L350,205 M250,215 L350,215" stroke="#FFFFFF" strokeWidth="2" />
        
        {/* Gearbox */}
        <rect x="350" y="180" width="40" height="40" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="1" />
      </g>
      
      {/* Sponsor Logos on Side Pods */}
      <g fontSize="4" fill="#FFFFFF">
        {/* Left Sidepod Sponsors */}
        <text x="260" y="155">RIVIAN</text>
        <text x="260" y="160">Ford</text>
        <text x="260" y="175">SIEMENS</text>
        <text x="260" y="180">TeXtreme</text>
        <text x="260" y="185">HAKKO</text>
        
        {/* Right Sidepod Sponsors */}
        <text x="480" y="155">roxglove</text>
        <text x="480" y="160">KENESTO</text>
        <text x="480" y="175">HARWIN</text>
        <text x="480" y="180">KISSsoft</text>
        <text x="480" y="185">Holley</text>
      </g>
      
      {/* Nose Cone Sponsors */}
      <g fontSize="3" fill="#000000">
        <text x="400" y="175">PETRO CANADA</text>
        <text x="400" y="180">SAE INTERNATIONAL</text>
        <text x="400" y="185">SKULE</text>
      </g>
      
      {/* Status Indicators */}
      <StatusNode x={200} y={200} label="FL" state="ok" />
      <StatusNode x={200} y={120} label="RL" state="ok" />
      <StatusNode x={600} y={200} label="FR" state="warn" />
      <StatusNode x={600} y={120} label="RR" state="ok" />
      
      {/* Engine Status */}
      <StatusNode x={300} y={190} label="ENG" state="ok" />
      <StatusNode x={370} y={200} label="GBX" state="ok" />
    </svg>
    
    <div className="grid grid-cols-2 gap-2 mt-2">
      <Spec label="FL Tyre" value="105" unit="°C" state="ok" />
      <Spec label="FR Tyre" value="104" unit="°C" state="ok" />
      <Spec label="RL Tyre" value="99" unit="°C" state="ok" />
      <Spec label="RR Tyre" value="101" unit="°C" state="ok" />
      <Spec label="Engine Temp" value="98" unit="°C" state="ok" />
      <Spec label="Oil Press" value="4.2" unit="bar" state="ok" />
      <Spec label="Downforce F" value="1367" unit="N" state="ok" />
      <Spec label="Downforce R" value="1370" unit="N" state="ok" />
    </div>
  </div>
);

const StatusNode = ({ x, y, state = "ok", label }: { x: number; y: number; state?: string; label: string }) => {
  const color = state === "ok" ? C.ok : state === "warn" ? C.warn : C.err;
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill={color} />
      <text x={x} y={y + 24} textAnchor="middle" fontSize="10" fill={C.white}>
        {label}
      </text>
    </g>
  );
};

const Spec = ({ label, value, unit, state }: { label: string; value: string; unit: string; state: string }) => (
  <div className="flex items-center justify-between rounded-md bg-black/40 px-2 py-1 min-w-0">
    <div className="text-[10px] tracking-[0.15em] text-neutral-400 truncate">{label}</div>
    <div className="flex items-baseline gap-1 min-w-0">
      <div className="font-mono text-white text-sm">{value}</div>
      <div className="text-neutral-400 text-[10px]">{unit}</div>
      <StatusPill state={state} />
    </div>
  </div>
);

const DenseTable = () => (
  <div className="max-h-[260px] overflow-hidden rounded-lg">
    <table className="w-full text-right text-sm">
      <thead>
        <tr className="text-neutral-400 text-[11px] tracking-[0.18em] uppercase">
          <th className="px-2 py-1 text-left">Metric</th>
          <th className="px-2 py-1">Value</th>
          <th className="px-2 py-1">Unit</th>
          <th className="px-2 py-1">State</th>
        </tr>
      </thead>
      <tbody>
        {timingRows.map((r, i) => (
          <tr key={r.label} className={i % 2 ? "bg-[#111]" : "bg-[#0D0D0D]"}>
            <td className="px-2 py-1 text-left text-neutral-300">{r.label}</td>
            <td className="px-2 py-1 font-mono text-white">{r.value}</td>
            <td className="px-2 py-1 text-neutral-400">{r.unit}</td>
            <td className="px-2 py-1">
              <StatusPill state={r.state} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SectorTimingStrip = () => (
  <div className="grid grid-cols-3 gap-2">
    <SectorBlock label="SECTOR 1" time="28.542" fastest />
    <SectorBlock label="SECTOR 2" time="30.118" />
    <SectorBlock label="SECTOR 3" time="26.905" />
  </div>
);

export default function F1TelemetryDashboard() {
  return (
    <div className="min-h-screen w-full bg-black text-[15px]" style={{ color: C.text }}>
      {/* Header Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-900 bg-[#0A0A0A]/95 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full" style={{ background: C.secondary }} />
          <div className="text-sm tracking-[0.2em] text-neutral-300">UTFR • LIVE • LAP 17</div>
        </div>
        <div className="flex items-end gap-6">
          <div className="text-4xl font-mono text-white">1:34.217</div>
          <div className="text-xs text-neutral-400">Δ −0.083</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-4 p-4">
        {/* LEFT COLUMN */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <Panel title="SECTOR TIMES">
            <SectorTimingStrip />
          </Panel>
          <Panel title="TYRE TEMPS">
            <TyreRadials />
          </Panel>
          <Panel title="SYSTEM STATUS">
            <DenseTable />
          </Panel>
        </div>

        {/* CENTER COLUMN */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <Panel title="TRACK MAP">
            <TrackMap />
          </Panel>
          <Panel title="TELEMETRY (SPD/THR/BRK)">
            <TelemetryChart />
          </Panel>
          <Panel title="SPEED TRACE (LAST LAP)">
            <MiniArea />
          </Panel>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <Panel title="CAR OVERVIEW">
            <CarWireframe />
          </Panel>
          <Panel title="NOTES">
            <ul className="list-disc pl-5 text-neutral-400 text-sm">
              <li>Brake FR running hot through S2.</li>
              <li>ERS Mode H; save on S1 exits.</li>
              <li>Fuel marginal, consider +0.2 lift/coast.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
