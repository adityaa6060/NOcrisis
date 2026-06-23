'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCrisisState } from '@frontend/hooks/useCrisisState';
import { staffCheckIn, addEventLog, verifyGuestSafe } from '@backend/lib/db';
import { CRISIS_META } from '@backend/types';
import CrisisAlertBanner from '@frontend/components/shared/CrisisAlertBanner';
import ActionChecklist from '@frontend/components/shared/ActionChecklist';
import EventTimeline from '@frontend/components/shared/EventTimeline';

import { hotelConfig } from '@backend/lib/hotelConfig';

export default function StaffInterface() {
  const { crisis, isActive, eventLog, respondingStaff, respondingCount, guestAcks, systemSettings, loading, dbError } = useCrisisState();
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [hasChosenProfile, setHasChosenProfile] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'actions' | 'log' | 'team'>('actions');

  const [setupName, setSetupName] = useState('');
  const [setupRoleIdx, setSetupRoleIdx] = useState(0);

  // Reset check-in when crisis changes
  useEffect(() => {
    setHasCheckedIn(false);
  }, [crisis?.id]);

  useEffect(() => {
    if (selectedStaff && respondingStaff[selectedStaff.id]) {
      setHasCheckedIn(true);
    }
  }, [respondingStaff, selectedStaff]);

  const handleCheckIn = async () => {
    if (!crisis) return;
    await staffCheckIn(crisis.id, selectedStaff.id, selectedStaff.name);
    setHasCheckedIn(true);
  };

  const handleTaskComplete = async (index: number) => {
    if (!crisis) return;
    const action = allStaffActions[index];
    if (action) {
      // If this was a "Go to Room" action, mark the guest as safe
      const roomMatch = action.match(/GO TO ROOM (\w+) IMMEDIATELY/);
      if (roomMatch && roomMatch[1]) {
        await verifyGuestSafe(crisis.id, roomMatch[1], selectedStaff.name);
      } else {
        await addEventLog(crisis.id, {
          message: `✅ ${selectedStaff.name} completed: "${action}"`,
          author: selectedStaff.name,
          role: 'staff',
          timestamp: Date.now(),
        });
      }
    }
  };

  const dangerRooms = Object.values(guestAcks)
    .filter((a: any) => a.needsHelp)
    .map((a: any) => a.room);

  const emergencyActions = dangerRooms.map(room => `🚨 GO TO ROOM ${room} IMMEDIATELY`);
  const baseActions = crisis?.instructions?.staff || [];
  const allStaffActions = [...emergencyActions, ...baseActions];

  const meta = crisis ? CRISIS_META[crisis.type] : null;

  if (loading) return null;

  const hotelDisplayName = systemSettings?.hotelName || 'NOcrisis';

  // Step 1: Who are you?
  if (!hasChosenProfile || !selectedStaff) {
    return (
      <div className="min-h-screen bg-transparent text-[var(--app-text)] flex flex-col items-center justify-center p-6 bg-grid-pattern">
        <div className="max-w-md w-full">
          {dbError && (
            <div className="mb-6">
              <div className="bg-red-500/10 border-2 border-red-500/30 text-red-400 p-4 rounded-2xl backdrop-blur-md flex items-center gap-3 text-xs font-semibold shadow-lg shadow-red-500/5 animate-pulse text-left">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px] text-red-500">Firebase System Alert</p>
                  <p className="opacity-85 mt-0.5">Connection failed: {dbError}. Check .env.local and Firebase rules.</p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center mb-12">
            <h1 className="text-4xl font-black mb-2 tracking-tighter">STAFF IDENTIFICATION</h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Sign in to your emergency post at {hotelDisplayName}</p>
          </div>
          
          <div className="space-y-6 mb-10">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2 font-bold">Your Full Name</label>
              <input 
                type="text" 
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                placeholder="e.g. Aditya"
                className="w-full bg-black/10 border border-gray-600 rounded-2xl px-6 py-4 text-lg font-bold focus:outline-none focus:border-blue-500 transition-all text-center"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2 font-bold">Your Role</label>
              <select
                value={setupRoleIdx}
                onChange={(e) => setSetupRoleIdx(Number(e.target.value))}
                className="w-full bg-black/10 border border-gray-600 rounded-2xl px-6 py-4 text-lg font-bold focus:outline-none focus:border-blue-500 transition-all text-center"
              >
                {hotelConfig.staffRoles.map((role, i) => (
                  <option key={i} value={i}>{role.icon} {role.label} ({role.dept})</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            onClick={() => {
              if (!setupName.trim()) return;
              const roleInfo = hotelConfig.staffRoles[setupRoleIdx];
              setSelectedStaff({
                id: `staff-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                name: setupName.trim(),
                role: roleInfo.label,
                dept: roleInfo.dept,
                icon: roleInfo.icon
              });
              setHasChosenProfile(true);
            }}
            disabled={!setupName.trim()}
            className="w-full py-5 rounded-2xl bg-blue-500 text-white font-black text-lg hover:scale-[1.02] transition-all active:scale-95 shadow-xl disabled:opacity-50"
          >
            CONFIRM IDENTITY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-[var(--app-text)] ${isActive ? 'crisis-active-bg' : 'bg-transparent'}`}>

      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-40">
        {crisis && crisis.status !== 'idle' && <CrisisAlertBanner crisis={crisis} />}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-white transition-colors text-xs font-black">
               ←
            </Link>
            <div>
              <h1 className="text-sm font-black tracking-wide uppercase">{hotelDisplayName}</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Active Staff Force</p>
            </div>
          </div>
          <div className="flex bg-black/10 border border-gray-600 rounded-lg px-3 py-1.5 text-xs font-bold truncate max-w-[150px]">
            {selectedStaff.name}
          </div>
        </div>
      </header>

      {dbError && (
        <div className="p-4 max-w-lg mx-auto">
          <div className="bg-red-500/10 border-2 border-red-500/30 text-red-400 p-4 rounded-2xl backdrop-blur-md flex items-center gap-3 text-xs font-semibold shadow-lg shadow-red-500/5 animate-pulse">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px] text-red-500">Firebase System Alert</p>
              <p className="opacity-85 mt-0.5">Connection failed: {dbError}. Check .env.local and Firebase rules.</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 max-w-lg mx-auto">

        {/* Staff Identity Card */}
        <div className={`rounded-xl border p-4 mb-4 flex items-center gap-3 ${
          hasCheckedIn ? 'border-teal-500/50 bg-teal-500/5' : 'border-gray-800 bg-gray-900'
        }`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm ${
            hasCheckedIn ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-400'
          }`}>
            {selectedStaff.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">{selectedStaff.name}</p>
            <p className="text-[11px] text-gray-400 font-medium">{selectedStaff.role} · <span className="text-gray-600">{selectedStaff.dept}</span></p>
          </div>
          <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
            hasCheckedIn ? 'bg-teal-500/20 text-teal-400' : 'bg-gray-700 text-gray-500'
          }`}>
            {hasCheckedIn ? '🟢 RESPONDING' : '⚪ STANDBY'}
          </span>
        </div>

        {!isActive && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-black text-green-400 mb-2">ALL CLEAR</h2>
            <p className="text-gray-500 text-sm">No active emergencies</p>
            <p className="text-gray-700 text-xs mt-2 font-mono">System will alert you instantly</p>
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-400 font-bold">Monitoring active</span>
            </div>
          </div>
        )}

        {isActive && crisis && meta && (
          <>
            {/* Big Crisis Header */}
            <div className="rounded-xl border p-5 mb-4 siren-border text-center"
              style={{ background: `${meta.color}08`, borderColor: `${meta.color}40` }}>
              <div className="text-5xl mb-3 float-icon">{meta.icon}</div>
              <h2 className="text-2xl font-black siren-pulse" style={{ color: meta.color }}>
                {meta.label} ON {crisis.location.toUpperCase()}
              </h2>
              <div className="flex items-center justify-center gap-3 mt-3">
                <span className="text-xs px-2 py-1 rounded font-black text-white"
                  style={{ background: meta.color }}>
                  SEVERITY {crisis.severity}/5
                </span>
                <span className="text-xs text-gray-400">
                  {crisis.description}
                </span>
              </div>

              {/* Other staff responding */}
              {respondingCount > 0 && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: `${meta.color}20` }}>
                  <span className="text-xs text-gray-400">
                    👷 <span className="font-bold text-teal-400">{respondingCount}</span> staff member{respondingCount !== 1 ? 's' : ''} responding
                  </span>
                </div>
              )}
            </div>

            {/* Check-in Button */}
            {!hasCheckedIn && (
              <button
                onClick={handleCheckIn}
                className="w-full py-4 rounded-xl text-white font-black text-base transition-all active:scale-95 mb-4 glow-ring"
                style={{ background: '#4ECDC4' }}
              >
                ✓ I AM RESPONDING — CHECK IN
              </button>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-gray-900 p-1 rounded-xl">
              {([
                { key: 'actions' as const, label: '📋 Actions', count: crisis.instructions?.staff?.length },
                { key: 'log' as const, label: '📡 Live Log', count: eventLog.length },
                { key: 'team' as const, label: '👥 Team', count: respondingCount },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === tab.key
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-700">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'actions' && (
              <div>
                {allStaffActions.length > 0 ? (
                  <ActionChecklist
                    actions={allStaffActions}
                    color="#4ECDC4"
                    label="Your Response Actions"
                    onComplete={handleTaskComplete}
                  />
                ) : (
                  <div className="text-center py-10 bg-gray-900 rounded-xl border border-gray-800">
                    <div className="text-3xl mb-2 float-icon">🤖</div>
                    <p className="text-sm text-gray-400">Waiting for AI instructions...</p>
                    <p className="text-xs text-gray-600 mt-1">Admin is generating response plan</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'log' && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <EventTimeline entries={eventLog} maxHeight="400px" />
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-2">
                {Object.entries(respondingStaff).length === 0 ? (
                  <div className="text-center py-8 bg-gray-900 rounded-xl border border-gray-800">
                    <p className="text-sm text-gray-500">No staff have checked in yet</p>
                  </div>
                ) : (
                  Object.entries(respondingStaff).map(([id, staff]) => (
                    <div key={id} className="flex items-center gap-3 p-3 rounded-xl border border-teal-500/30 bg-teal-500/5">
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                      <span className="text-sm font-bold text-white">{staff.name}</span>
                      <span className="ml-auto text-[10px] text-gray-500 font-mono">
                        {new Date(staff.checkedInAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
