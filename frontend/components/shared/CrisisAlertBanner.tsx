'use client';

import { useEffect, useState } from 'react';
import type { Crisis } from '@backend/types';
import { CRISIS_META } from '@backend/types';

interface Props {
  crisis: Crisis;
  compact?: boolean;
}

export default function CrisisAlertBanner({ crisis, compact }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const meta = CRISIS_META[crisis.type];

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - crisis.timestamp) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [crisis.timestamp]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (crisis.status === 'resolved') {
    return (
      <div className="w-full px-4 py-3 flex items-center justify-center gap-3 bg-green-500/10 border-b-2 border-green-500">
        <span className="text-lg">✅</span>
        <span className="text-green-400 text-sm font-bold tracking-wide">ALL CLEAR — Crisis Resolved</span>
      </div>
    );
  }

  return (
    <div
      className="w-full px-4 py-3 flex items-center justify-between gap-3 siren-border"
      style={{
        background: `linear-gradient(90deg, ${meta.color}15, ${meta.color}08, ${meta.color}15)`,
        borderBottom: `2px solid ${meta.color}`,
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl siren-pulse">{meta.icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background: meta.color, color: 'white' }}
            >
              SEV {crisis.severity}
            </span>
            <span className="font-bold text-sm siren-pulse" style={{ color: meta.color }}>
              {meta.label} ALERT
            </span>
          </div>
          {!compact && (
            <p className="text-xs text-gray-400 mt-0.5">
              📍 {crisis.location}
            </p>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div
          className="font-mono text-lg font-bold tabular-nums"
          style={{ color: meta.color, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {formatTime(elapsed)}
        </div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">elapsed</div>
      </div>
    </div>
  );
}
