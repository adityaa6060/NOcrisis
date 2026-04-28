'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useCrisisState } from '@frontend/hooks/useCrisisState';
import { triggerCrisis, resolveCrisis, setCrisisInstructions, addEventLog, resetSystemState } from '@backend/lib/db';
import { CRISIS_META } from '@backend/types';
import type { CrisisType } from '@backend/types';
import { hotelConfig, generateSmartCrisis } from '@backend/lib/hotelConfig';
import CrisisAlertBanner from '@frontend/components/shared/CrisisAlertBanner';
import EventTimeline from '@frontend/components/shared/EventTimeline';
import ActionChecklist from '@frontend/components/shared/ActionChecklist';
import QRCode from 'react-qr-code';

export default function AdminDashboard() {
  const { crisis, isActive, eventLog, respondingStaff, guestAcks, respondingCount, acksCount, helpRequests, systemSettings } = useCrisisState();

  const [showTrigger, setShowTrigger] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [triggerForm, setTriggerForm] = useState({
    type: 'fire' as CrisisType,
    severity: 4,
    location: hotelConfig.locations[0],
    description: '',
  });

  // Trigger Crisis
  const handleTriggerCrisis = useCallback(async (form: typeof triggerForm) => {
    const id = await triggerCrisis({
      type: form.type,
      severity: form.severity,
      location: form.location,
      description: form.description || `${CRISIS_META[form.type].label} emergency reported at ${form.location}`,
      status: 'active',
      timestamp: Date.now(),
      triggeredBy: 'Admin',
      instructions: null,
    });
    setShowTrigger(false);

    // Auto-generate AI instructions
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const instructions = await res.json();
      if (instructions.staff && instructions.guests) {
        await setCrisisInstructions(id, instructions);
      }
    } catch (e) {
      console.error('AI generation failed:', e);
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Reset System
  const handleHardReset = async () => {
    if (confirm('DANGER: This will wipe all current crisis data and hotel configuration. Proceed?')) {
       await resetSystemState();
       window.location.href = '/';
    }
  };

  // Simulate AI Detection (Smart)
  const handleSimulateDetection = useCallback(async () => {
    const smartCrisis = generateSmartCrisis();

    const smartForm = {
      ...smartCrisis,
      description: `AI ANALYTICS: ${smartCrisis.description}`,
    };

    await handleTriggerCrisis(smartForm);
  }, [handleTriggerCrisis]);

  // Resolve Crisis
  const handleResolveCrisis = useCallback(async () => {
    if (!crisis) return;
    await resolveCrisis(crisis.id);
  }, [crisis]);

  const guestUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/guest${selectedRoom ? `?room=${selectedRoom}` : ''}` 
    : '';
  const helpList = Object.values(guestAcks).filter((a: any) => a.needsHelp);

  const hotelDisplayName = systemSettings?.hotelName || hotelConfig.name;

  return (
    <div className={`min-h-screen text-[var(--app-text)] ${isActive ? 'crisis-active-bg' : 'bg-transparent'}`}>
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-40">
        {crisis && crisis.status !== 'idle' && <CrisisAlertBanner crisis={crisis} />}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-gray-500 hover:text-white transition-colors text-xs font-bold flex items-center gap-1">
              ← HOME
            </Link>
            <button
               onClick={handleHardReset}
               className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all transition-all"
            >
               Reset System
            </button>
            <div className="h-4 w-px bg-gray-800" />
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm ${isActive ? 'bg-red-500 glow-ring' : 'bg-orange-500'}`}>NO</div>
              <div>
                <h1 className="text-sm font-bold tracking-wide uppercase">{hotelDisplayName}</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Admin Command Center</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isActive && (
              <button
                onClick={handleSimulateDetection}
                className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30 hover:bg-purple-500/30 transition-all flex items-center gap-2"
              >
                <span>🤖</span> Simulate AI Detection
              </button>
            )}
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value.toUpperCase())}
                placeholder="ROOM #"
                className="w-20 px-2 py-2 rounded-lg bg-black/20 border border-gray-700 text-[10px] font-bold text-center focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-700"
              />
              <button
                onClick={() => setShowQR(true)}
                className="px-3 py-2 rounded-lg bg-gray-800 text-gray-400 text-xs font-bold border border-gray-700 hover:border-gray-600 transition-all flex items-center gap-2"
              >
                📱 QR
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">

          {/* Action Bar */}
          <div className="flex gap-3 mb-6">
            {!isActive ? (
              <button
                onClick={() => setShowTrigger(true)}
                className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                🚨 Activate Crisis
              </button>
            ) : (
              <button
                onClick={handleResolveCrisis}
                className="px-6 py-3 rounded-xl bg-green-500/20 text-green-400 font-bold text-sm border border-green-500/30 hover:bg-green-500/30 transition-all flex items-center gap-2"
              >
                ✅ Resolve Crisis
              </button>
            )}
            {aiLoading && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                <span className="text-xs text-purple-400 font-bold">Gemini generating instructions...</span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'STATUS', value: isActive ? 'ACTIVE' : 'CLEAR', icon: isActive ? '🔴' : '🟢', color: isActive ? '#FF3B30' : '#22C55E' },
              { label: 'TYPE', value: crisis ? CRISIS_META[crisis.type].label : '—', icon: crisis ? CRISIS_META[crisis.type].icon : '—', color: crisis ? CRISIS_META[crisis.type].color : '#666' },
              { label: 'STAFF', value: respondingCount, icon: '👷', color: '#4ECDC4' },
              { label: 'GUESTS OK', value: acksCount, icon: '✅', color: '#45B7D1' },
              { label: 'NEED HELP', value: helpRequests, icon: '🆘', color: helpRequests > 0 ? '#FF3B30' : '#666' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-900/80 backdrop-blur rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all">
                <div className="text-xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-black count-up" style={{ color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>
                  {stat.value}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column - AI Instructions */}
            <div className="lg:col-span-2 space-y-4">
              {crisis?.instructions ? (
                <>
                  <ActionChecklist
                    actions={crisis.instructions.staff}
                    color="#4ECDC4"
                    label="Staff Response Actions (AI-Generated)"
                  />
                  <ActionChecklist
                    actions={crisis.instructions.guests}
                    color="#45B7D1"
                    label="Guest Safety Instructions (AI-Generated)"
                  />
                </>
              ) : isActive ? (
                <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-8 text-center">
                  <div className="text-4xl mb-3 float-icon">🤖</div>
                  <p className="text-gray-400 text-sm">
                    {aiLoading ? 'Generating AI instructions via Gemini...' : 'Waiting for AI instructions...'}
                  </p>
                  {aiLoading && (
                    <div className="mt-3">
                      <div className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-12 text-center">
                  <div className="text-6xl mb-4">🏨</div>
                  <h2 className="text-lg font-bold text-white mb-2">All Systems Nominal</h2>
                  <p className="text-gray-500 text-sm">Trigger a crisis or simulate AI detection to begin</p>
                </div>
              )}

              {/* Responding Staff */}
              {isActive && respondingCount > 0 && (
                <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4">
                  <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Responding Staff ({respondingCount})</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(respondingStaff).map(([id, staff]) => (
                      <div key={id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30">
                        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        <span className="text-xs font-bold text-teal-400">{staff.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Help Requests */}
              {helpRequests > 0 && (
                <div className="bg-red-500/10 rounded-xl border border-red-500/30 p-4 siren-pulse">
                  <h3 className="text-xs text-red-400 uppercase tracking-wider font-bold mb-3">🆘 HELP REQUESTS ({helpRequests})</h3>
                  <div className="flex flex-wrap gap-2">
                    {helpList.map((ack: any, i: number) => (
                      <div key={i} className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40">
                        <span className="text-xs font-bold text-red-400">Room {ack.room}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Event Timeline */}
            <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4 h-fit">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                Live Event Log
              </h3>
              <EventTimeline entries={eventLog} maxHeight="500px" />
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Crisis Modal */}
      {showTrigger && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-md slide-in-up">
            <h3 className="text-lg font-black mb-5 text-red-400 flex items-center gap-2">
              🚨 ACTIVATE CRISIS ALERT
            </h3>

            <div className="space-y-5">
              {/* Crisis Type */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Crisis Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['fire', 'medical', 'security'] as CrisisType[]).map(type => {
                    const meta = CRISIS_META[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setTriggerForm(f => ({ ...f, type }))}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          triggerForm.type === type
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-2xl mb-1">{meta.icon}</div>
                        <div className="text-xs font-bold text-gray-300">{meta.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
                  Severity: <span className="text-white font-bold">{triggerForm.severity}/5</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      onClick={() => setTriggerForm(f => ({ ...f, severity: s }))}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-black border transition-all ${
                        triggerForm.severity >= s
                          ? s >= 4 ? 'border-red-500 bg-red-500 text-white' :
                            s >= 3 ? 'border-orange-500 bg-orange-500 text-white' :
                            'border-yellow-500 bg-yellow-500 text-black'
                          : 'border-gray-700 text-gray-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Location</label>
                <select
                  value={triggerForm.location}
                  onChange={e => setTriggerForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gray-500"
                >
                  {hotelConfig.locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Description (optional)</label>
                <textarea
                  value={triggerForm.description}
                  onChange={e => setTriggerForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description..."
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none resize-none focus:border-gray-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTrigger(false)}
                className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTriggerCrisis(triggerForm)}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-black transition-all active:scale-95"
              >
                🚨 ACTIVATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 text-center w-full max-w-sm slide-in-up">
            <h3 className="text-sm font-black mb-1 text-blue-400">GUEST PORTAL</h3>
            <p className="text-xs text-gray-500 mb-4">Scan to open guest crisis view</p>
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <QRCode value={guestUrl} size={180} />
            </div>
            <p className="text-[10px] text-gray-600 break-all mb-4 font-mono">{guestUrl}</p>
            <button
              onClick={() => setShowQR(false)}
              className="w-full py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-600 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
