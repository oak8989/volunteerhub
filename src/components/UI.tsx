import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, AlertCircle, Info, Menu } from 'lucide-react';

// ============ TOAST SYSTEM ============
type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: string; message: string; type: ToastType; }

let toastListeners: Set<(toasts: ToastItem[]) => void> = new Set();
let currentToasts: ToastItem[] = [];

function notifyToastListeners() { toastListeners.forEach(fn => fn([...currentToasts])); }

export function showToast(message: string, type: ToastType = 'success') {
  const id = Math.random().toString(36).slice(2);
  currentToasts = [...currentToasts, { id, message, type }];
  notifyToastListeners();
  setTimeout(() => {
    currentToasts = currentToasts.filter(t => t.id !== id);
    notifyToastListeners();
  }, 4000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  useEffect(() => {
    toastListeners.add(setToasts);
    return () => { toastListeners.delete(setToasts); };
  }, []);
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="flex items-center gap-2">
            {t.type === 'success' && <Check size={16} />}
            {t.type === 'error' && <AlertCircle size={16} />}
            {t.type === 'info' && <Info size={16} />}
            {t.message}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ MODAL ============
export function Modal({ open, onClose, title, children, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${widths[size]} max-h-[90vh] overflow-auto animate-pop`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ============ COUNT UP ============
export function CountUp({ end, duration = 2000, suffix = '', prefix = '' }: { end: number; duration?: number; suffix?: string; prefix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * end));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span ref={ref}>{prefix}{value.toLocaleString()}{suffix}</span>;
}

// ============ PROGRESS RING ============
export function ProgressRing({ progress, size = 120, strokeWidth = 8, color = 'var(--accent)' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

// ============ LIVE CLOCK ============
export function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="text-center">
      <div className="text-3xl font-mono font-bold accent-text">
        {time.toLocaleTimeString()}
      </div>
      <div className="text-sm text-gray-500 mt-1">
        {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
  );
}

// ============ LIVE TIMER ============
export function LiveTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(startTime).getTime();
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(`${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startTime]);
  return <span className="font-mono text-lg font-bold accent-text">{elapsed}</span>;
}

// ============ CONFIRM DIALOG ============
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText?: string; danger?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md animate-pop" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className={`btn-primary ${danger ? '!bg-red-500 hover:!bg-red-600' : ''}`} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ EMPTY STATE ============
export function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3 opacity-50">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
}

// ============ MOBILE MENU BUTTON ============
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg">
      <Menu size={24} />
    </button>
  );
}

// ============ TABS ============
export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string; icon?: React.ReactNode }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${active === tab.id ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
          {tab.icon}{tab.label}
        </button>
      ))}
    </div>
  );
}

// ============ QR CODE (Simple visual) ============
export function QRCode({ value, size = 200 }: { value: string; size?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const ctx = canvas.current.getContext('2d');
    if (!ctx) return;
    const cellSize = size / 25;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#1a3a2a';
    // Generate deterministic pattern from value
    let hash = 0;
    for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash) + value.charCodeAt(i);
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 25; col++) {
        const seed = (hash * (row * 25 + col + 1)) & 0xFFFF;
        if (seed % 3 === 0 || (row < 7 && col < 7) || (row < 7 && col > 17) || (row > 17 && col < 7)) {
          // Position markers
          if ((row < 7 && col < 7) || (row < 7 && col > 17) || (row > 17 && col < 7)) {
            const isOuter = row === 0 || row === 6 || col === 0 || col === 6 || (row > 17 ? row === 18 || row === 24 : false) || (col > 17 ? col === 18 || col === 24 : false);
            const isInner = (row >= 2 && row <= 4 && col >= 2 && col <= 4) || (row >= 2 && row <= 4 && col >= 20 && col <= 22) || (row >= 20 && row <= 22 && col >= 2 && col <= 4);
            if (isOuter || isInner) {
              ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
          } else {
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
          }
        }
      }
    }
  }, [value, size]);
  return <canvas ref={canvas} width={size} height={size} className="rounded-lg border" />;
}

// ============ ACTIVITY TICKER ============
export function ActivityTicker({ activities }: { activities: { message: string; timestamp: string }[] }) {
  return (
    <div className="overflow-hidden bg-white/80 backdrop-blur rounded-lg py-2 px-4 border">
      <div className="flex animate-ticker whitespace-nowrap gap-8">
        {[...activities, ...activities].map((a, i) => (
          <span key={i} className="text-sm text-gray-600">
            <span className="accent-text font-medium">●</span> {a.message}
          </span>
        ))}
      </div>
    </div>
  );
}
