'use client';

import { useEffect, useState } from 'react';
import { 
  subscribeToActiveCrisis, 
  subscribeToEventLog, 
  subscribeToRespondingStaff, 
  subscribeToGuestAcks,
  subscribeToSystemSettings
} from '@backend/lib/db';
import type { Crisis, EventLogEntry } from '@backend/types';

export function useCrisisState() {
  const [crisis, setCrisis] = useState<Crisis | null>(null);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [respondingStaff, setRespondingStaff] = useState<Record<string, { name: string; checkedInAt: number }>>({});
  const [guestAcks, setGuestAcks] = useState<Record<string, any>>({});
  const [systemSettings, setSystemSettings] = useState<{ hotelName: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub1 = subscribeToActiveCrisis((c) => {
      setCrisis(c);
      setLoading(false);
    });
    const unsub2 = subscribeToEventLog(setEventLog);
    const unsub3 = subscribeToRespondingStaff(setRespondingStaff);
    const unsub4 = subscribeToGuestAcks(setGuestAcks);
    const unsub5 = subscribeToSystemSettings(setSystemSettings);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, []);

  const isActive = crisis?.status === 'active';
  const respondingCount = Object.keys(respondingStaff).length;
  const acksCount = Object.values(guestAcks).filter((a: any) => !a.needsHelp).length;
  const helpRequests = Object.values(guestAcks).filter((a: any) => a.needsHelp).length;

  return {
    crisis,
    eventLog,
    respondingStaff,
    guestAcks,
    systemSettings,
    loading,
    isActive,
    respondingCount,
    acksCount,
    helpRequests,
  };
}
