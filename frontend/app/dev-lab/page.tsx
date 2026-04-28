'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCrisisState } from '@frontend/hooks/useCrisisState';

export default function DevLab() {
  const { isActive } = useCrisisState();
  const [labRoom, setLabRoom] = useState('101');

  return (
    <div className={`min-h-screen bg-black text-white flex flex-col`}>
      {/* Lab Header */}
      <header className="p-4 bg-gray-900/50 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs font-black text-gray-500 hover:text-white">← BACK</Link>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-sm font-black tracking-widest uppercase">Sync Test Lab</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isActive ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-green-500/20 text-green-500 border border-green-500/50'}`}>
            {isActive ? 'Active Crisis' : 'System Normal'}
          </div>
        </div>
      </header>

      {/* Grid of Roles */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
        
        {/* Admin Frame */}
        <div className="flex flex-col border-r border-white/5">
          <div className="p-2 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest border-b border-orange-500/20">
            Admin View
          </div>
          <iframe 
            src="/admin" 
            className="flex-1 w-full border-none pointer-events-auto"
          />
        </div>

        {/* Staff Frame */}
        <div className="flex flex-col border-r border-white/5">
          <div className="p-2 bg-teal-500/10 text-teal-400 text-[10px] font-black uppercase tracking-widest border-b border-teal-500/20">
            Staff View
          </div>
          <iframe 
            src="/staff" 
            className="flex-1 w-full border-none pointer-events-auto"
          />
        </div>

        {/* Guest Frame */}
        <div className="flex flex-col">
          <div className="p-2 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border-b border-blue-500/20 flex items-center justify-between">
            <span>Guest View (Room {labRoom})</span>
            <input 
              type="text"
              value={labRoom}
              onChange={(e) => setLabRoom(e.target.value.toUpperCase())}
              className="bg-black/40 border border-blue-500/30 rounded px-2 py-0.5 text-[8px] w-12 focus:outline-none focus:border-blue-500"
              placeholder="ROOM"
            />
          </div>
          <iframe 
            src={`/guest?room=${labRoom}`} 
            className="flex-1 w-full border-none pointer-events-auto"
          />
        </div>

      </div>

      {/* Footer Info */}
      <footer className="p-2 bg-gray-950 border-t border-white/5 text-[10px] font-mono text-gray-700 text-center uppercase tracking-widest">
        Real-time Synchronization Lab · Firebase RTDB Latency: &lt; 100ms
      </footer>
    </div>
  );
}
