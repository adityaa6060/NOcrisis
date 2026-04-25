'use client';

import { useCrisisState } from '@frontend/hooks/useCrisisState';

export default function MetricsPanel() {
  const { respondingCount, acksCount } = useCrisisState();

  const metrics = [
    { label: 'Active Staff Responding', value: respondingCount, icon: '👷', color: 'text-teal-400' },
    { label: 'Verified Safe Guests', value: acksCount, icon: '🛡️', color: 'text-blue-400' },
    { label: 'Response Time', value: '< 1s', icon: '⚡', color: 'text-orange-400' },
    { label: 'Sync Speed', value: '< 100ms', icon: '📡', color: 'text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div key={m.label} className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 hover:bg-white/[0.05] transition-all">
          <div className="text-xl mb-1">{m.icon}</div>
          <div className={`text-2xl font-black ${m.color} tabular-nums`}>{m.value}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{m.label}</div>
        </div>
      ))}
    </div>
  );
}
