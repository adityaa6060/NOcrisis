export type CrisisType = 'fire' | 'medical' | 'security';

export type CrisisStatus = 'idle' | 'active' | 'resolved';

export interface CrisisInstructions {
  staff: string[];
  guests: string[];
}

export interface Crisis {
  id: string;
  type: CrisisType;
  severity: number; // 1-5
  location: string;
  status: CrisisStatus;
  timestamp: number;
  description: string;
  triggeredBy: string;
  instructions: CrisisInstructions | null;
  respondingStaff?: Record<string, { name: string; checkedInAt: number }>;
  guestAcknowledgments?: Record<string, { room: string; timestamp: number; needsHelp?: boolean }>;
  eventLog?: Record<string, EventLogEntry>;
}

export interface EventLogEntry {
  id?: string;
  message: string;
  author: string;
  role: 'admin' | 'staff' | 'guest' | 'system' | 'ai';
  timestamp: number;
}

export const CRISIS_META: Record<CrisisType, { label: string; icon: string; color: string }> = {
  fire: { label: 'FIRE', icon: '🔥', color: '#FF3B30' },
  medical: { label: 'MEDICAL', icon: '🚑', color: '#FF9500' },
  security: { label: 'SECURITY', icon: '🚨', color: '#FF2D55' },
};
