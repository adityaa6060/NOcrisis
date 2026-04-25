'use client';

import { useCrisisState } from '@frontend/hooks/useCrisisState';
import { CRISIS_META } from '@backend/types';

export default function LiveStatusBadge() {
  const { crisis, isActive } = useCrisisState();

  if (isActive && crisis) {
    const meta = CRISIS_META[crisis.type];
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 animate-pulse">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
          Active Crisis: {meta.label} at {crisis.location}
        </span>
      </div>
    );
  }

  if (crisis?.status === 'resolved') {
     return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30">
        <div className="w-2 h-2 rounded-full bg-yellow-500" />
        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
          Recently Resolved
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">
        All Systems Normal
      </span>
    </div>
  );
}
