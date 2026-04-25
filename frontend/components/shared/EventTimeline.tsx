'use client';

import type { EventLogEntry } from '@backend/types';

const ROLE_COLORS: Record<string, string> = {
  admin: '#FF6B35',
  staff: '#4ECDC4',
  guest: '#45B7D1',
  system: '#888',
  ai: '#A855F7',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'ADMIN',
  staff: 'STAFF',
  guest: 'GUEST',
  system: 'SYSTEM',
  ai: 'AI',
};

interface Props {
  entries: EventLogEntry[];
  maxHeight?: string;
}

export default function EventTimeline({ entries, maxHeight = '300px' }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-gray-600">No events yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight }}>
      <div className="space-y-1">
        {entries.map((entry, i) => (
          <div
            key={entry.id || i}
            className="flex gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-all slide-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Timeline dot */}
            <div className="flex flex-col items-center shrink-0 pt-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: ROLE_COLORS[entry.role] }}
              />
              {i < entries.length - 1 && (
                <div className="w-px flex-1 bg-gray-800 mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    color: ROLE_COLORS[entry.role],
                    background: `${ROLE_COLORS[entry.role]}15`,
                  }}
                >
                  {ROLE_LABELS[entry.role]}
                </span>
                <span className="text-[10px] text-gray-600 font-mono">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{entry.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
