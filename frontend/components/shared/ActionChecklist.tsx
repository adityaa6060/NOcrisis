'use client';

import { useState } from 'react';

interface Props {
  actions: string[];
  color: string;
  label: string;
  onComplete?: (index: number) => void;
}

export default function ActionChecklist({ actions, color, label, onComplete }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        onComplete?.(index);
      }
      return next;
    });
  };

  const progress = actions.length > 0 ? (checked.size / actions.length) * 100 : 0;

  return (
    <div
      className="rounded-xl border p-4 slide-in-up"
      style={{ borderColor: `${color}30`, background: `${color}06` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black"
          style={{ background: color, color: 'white' }}
        >
          AI
        </div>
        <span className="font-bold text-sm" style={{ color }}>
          {label}
        </span>
        <span className="ml-auto text-xs font-mono" style={{ color: `${color}99` }}>
          {checked.size}/{actions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-800 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: color }}
        />
      </div>

      {/* Checklist */}
      <ul className="space-y-2">
        {actions.map((action, i) => {
          const done = checked.has(i);
          return (
            <li
              key={i}
              onClick={() => toggle(i)}
              className="flex items-start gap-3 cursor-pointer group py-1.5 px-2 rounded-lg hover:bg-white/5 transition-all"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                style={{
                  borderColor: done ? color : `${color}40`,
                  background: done ? color : 'transparent',
                }}
              >
                {done && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm leading-snug transition-all duration-200 ${done ? 'line-through text-gray-600' : 'text-gray-200'}`}>
                {action}
              </span>
            </li>
          );
        })}
      </ul>

      {progress === 100 && (
        <div className="mt-3 pt-3 border-t border-gray-800 text-center">
          <span className="text-xs font-bold" style={{ color }}>
            ✓ All tasks completed
          </span>
        </div>
      )}
    </div>
  );
}
