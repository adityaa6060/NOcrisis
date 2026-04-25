import { database } from './firebase';
import { ref, set, push, onValue, update, off, get, remove } from 'firebase/database';
import type { Crisis, CrisisInstructions, EventLogEntry } from '@backend/types';

// ─── Crisis Operations ────────────────────────────────────────────────────────

export function subscribeToActiveCrisis(callback: (crisis: Crisis | null) => void) {
  const crisisRef = ref(database, 'activeCrisis');
  const handler = onValue(crisisRef, (snapshot) => {
    const data = snapshot.val();
    if (!data || data.status === 'idle') return callback(null);
    callback(data as Crisis);
  });
  return () => off(crisisRef, 'value', handler);
}

export async function triggerCrisis(crisis: Omit<Crisis, 'id'>) {
  const crisisRef = ref(database, 'activeCrisis');
  const id = `crisis_${Date.now()}`;
  const fullCrisis: Crisis = {
    ...crisis,
    id,
  };
  await set(crisisRef, fullCrisis);

  // Log to history
  const historyRef = ref(database, `crisisHistory/${id}`);
  await set(historyRef, fullCrisis);

  // Add system event
  await addEventLog(id, {
    message: `🚨 ${crisis.type.toUpperCase()} crisis triggered at ${crisis.location} — Severity ${crisis.severity}/5`,
    author: crisis.triggeredBy,
    role: 'system',
    timestamp: Date.now(),
  });

  return id;
}

export async function resolveCrisis(crisisId: string) {
  const crisisRef = ref(database, 'activeCrisis');
  await update(crisisRef, {
    status: 'resolved',
  });

  // Update history
  const historyRef = ref(database, `crisisHistory/${crisisId}`);
  await update(historyRef, { status: 'resolved' });

  await addEventLog(crisisId, {
    message: '✅ Crisis RESOLVED — All Clear',
    author: 'Admin',
    role: 'system',
    timestamp: Date.now(),
  });
}

export async function setCrisisInstructions(crisisId: string, instructions: CrisisInstructions) {
  const crisisRef = ref(database, 'activeCrisis');
  await update(crisisRef, { instructions });

  // Update history
  const historyRef = ref(database, `crisisHistory/${crisisId}`);
  await update(historyRef, { instructions });

  await addEventLog(crisisId, {
    message: '🤖 AI-generated instructions deployed to all roles',
    author: 'Gemini AI',
    role: 'ai',
    timestamp: Date.now(),
  });
}

// ─── Staff Operations ─────────────────────────────────────────────────────────

export async function staffCheckIn(crisisId: string, staffId: string, staffName: string) {
  const staffRef = ref(database, `activeCrisis/respondingStaff/${staffId}`);
  await set(staffRef, { name: staffName, checkedInAt: Date.now() });

  await addEventLog(crisisId, {
    message: `👷 ${staffName} checked in — responding to crisis`,
    author: staffName,
    role: 'staff',
    timestamp: Date.now(),
  });
}

export function subscribeToRespondingStaff(callback: (staff: Record<string, { name: string; checkedInAt: number }>) => void) {
  const staffRef = ref(database, 'activeCrisis/respondingStaff');
  const handler = onValue(staffRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
  return () => off(staffRef, 'value', handler);
}

// ─── Guest Operations ─────────────────────────────────────────────────────────

export async function guestAcknowledge(crisisId: string, roomNumber: string) {
  const guestRef = ref(database, `activeCrisis/guestAcknowledgments/${roomNumber}`);
  await set(guestRef, { room: roomNumber, timestamp: Date.now() });

  await addEventLog(crisisId, {
    message: `🛎️ Room ${roomNumber} acknowledged the alert`,
    author: `Room ${roomNumber}`,
    role: 'guest',
    timestamp: Date.now(),
  });
}

export async function guestNeedsHelp(crisisId: string, roomNumber: string) {
  const guestRef = ref(database, `activeCrisis/guestAcknowledgments/${roomNumber}`);
  await update(guestRef, { needsHelp: true, helpRequestedAt: Date.now() });

  await addEventLog(crisisId, {
    message: `🆘 Room ${roomNumber} NEEDS HELP — Send assistance immediately`,
    author: `Room ${roomNumber}`,
    role: 'guest',
    timestamp: Date.now(),
  });
}

export function subscribeToGuestAcks(callback: (acks: Record<string, any>) => void) {
  const acksRef = ref(database, 'activeCrisis/guestAcknowledgments');
  const handler = onValue(acksRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
  return () => off(acksRef, 'value', handler);
}

// ─── Event Log ────────────────────────────────────────────────────────────────

export async function addEventLog(crisisId: string, entry: EventLogEntry) {
  // Write to active crisis log
  const activeLogRef = ref(database, 'activeCrisis/eventLog');
  const newRef = push(activeLogRef);
  await set(newRef, { ...entry, id: newRef.key });

  // Also write to history
  const historyLogRef = ref(database, `crisisHistory/${crisisId}/eventLog`);
  const histRef = push(historyLogRef);
  await set(histRef, { ...entry, id: histRef.key });
}

export function subscribeToEventLog(callback: (entries: EventLogEntry[]) => void) {
  const logRef = ref(database, 'activeCrisis/eventLog');
  const handler = onValue(logRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return callback([]);
    const entries = Object.values(data) as EventLogEntry[];
    entries.sort((a, b) => b.timestamp - a.timestamp);
    callback(entries);
  });
  return () => off(logRef, 'value', handler);
}

// ─── Crisis History ───────────────────────────────────────────────────────────

export function subscribeToCrisisHistory(callback: (crises: Crisis[]) => void) {
  const historyRef = ref(database, 'crisisHistory');
  const handler = onValue(historyRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return callback([]);
    const crises = Object.values(data) as Crisis[];
    crises.sort((a, b) => b.timestamp - a.timestamp);
    callback(crises);
  });
  return () => off(historyRef, 'value', handler);
}

// ─── System Settings ──────────────────────────────────────────────────────────

export async function getSystemSettings() {
  const s = await get(ref(database, 'systemSettings'));
  return s.exists() ? s.val() : null;
}

export async function updateSystemSettings(settings: { hotelName: string, locations?: string[] }) {
  await set(ref(database, 'systemSettings'), settings);
}

export async function resetSystemState() {
  await set(ref(database, 'activeCrisis'), null);
  await set(ref(database, 'systemSettings'), null);
  await set(ref(database, 'crisisHistory'), null);
}

export function subscribeToSystemSettings(callback: (s: any) => void) {
  const sRef = ref(database, 'systemSettings');
  const handler = onValue(sRef, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(sRef, 'value', handler);
}
