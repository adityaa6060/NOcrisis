'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useCrisisState } from '@frontend/hooks/useCrisisState';
import { triggerCrisis, setCrisisInstructions, updateSystemSettings, resetSystemState } from '@backend/lib/db';
import { CRISIS_META } from '@backend/types';
import { hotelConfig, generateSmartCrisis } from '@backend/lib/hotelConfig';
import LiveStatusBadge from '@frontend/components/landing/LiveStatusBadge';
import MetricsPanel from '@frontend/components/landing/MetricsPanel';
import QRModal from '@frontend/components/landing/QRModal';
import ThemeToggle from '@frontend/components/shared/ThemeToggle';

export default function Home() {
  const { crisis, isActive, systemSettings, loading, dbError } = useCrisisState();
  const [isQRModalOpen, setQRModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [setupHotelName, setSetupHotelName] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');

  const guestUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/guest${selectedRoom ? `?room=${selectedRoom}` : ''}` 
    : '';

  const handleSimulateDetection = useCallback(async () => {
    setIsSimulating(true);
    const smartCrisis = generateSmartCrisis();

    const id = await triggerCrisis({
      ...smartCrisis,
      status: 'active',
      timestamp: Date.now(),
      triggeredBy: 'SYSTEM (AI)',
      instructions: null,
    });

    try {
      const res = await fetch('/api/ai-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smartCrisis),
      });
      const instructions = await res.json();
      if (instructions.staff) {
        await setCrisisInstructions(id, instructions);
      }
    } catch (e) {
      console.error('AI Instructions failed:', e);
    } finally {
      setIsSimulating(false);
    }
  }, []);

  const [setupLocations, setSetupLocations] = useState('Lobby, Floor 1 (Rooms 101-120), Floor 2 (Rooms 201-220), Pool Area');
  const [hotelPlaceholder, setHotelPlaceholder] = useState('e.g. Royal Crown Plaza');

  useEffect(() => {
    const names = ['Royal Crown Plaza', 'Sapphire Resort', 'Oceanview Inn', 'Metropolis Hotel', 'Skyline Suites', 'The Grand Horizon'];
    setHotelPlaceholder('e.g. ' + names[Math.floor(Math.random() * names.length)]);
  }, []);

  const handleInitialize = async () => {
    if (!setupHotelName.trim()) return;
    setIsInitializing(true);
    const locations = setupLocations.split(',').map(l => l.trim()).filter(l => l);
    await updateSystemSettings({ 
      hotelName: setupHotelName.trim(),
      locations: locations.length > 0 ? locations : hotelConfig.locations 
    });
    setIsInitializing(false);
    setShowSetup(false);
  };

  const handleHardReset = async () => {
    if (confirm('DANGER: This will wipe all system data. Proceed?')) {
      await resetSystemState();
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center text-[var(--app-text)] font-black tracking-tighter">
        <div className="animate-pulse">LOADING SYSTEM...</div>
      </div>
    );
  }

  const hotelDisplayName = systemSettings?.hotelName || 'NOcrisis';

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isActive ? 'crisis-active-bg' : 'bg-[var(--app-bg)]'} text-[var(--app-text)] overflow-x-hidden`}>
      
      {dbError && (
        <div className="max-w-7xl mx-auto px-6 pt-4 relative z-30">
          <div className="bg-red-500/10 border-2 border-red-500/30 text-red-400 p-4 rounded-2xl backdrop-blur-md flex items-center gap-3 text-sm font-semibold shadow-lg shadow-red-500/5 animate-pulse">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-bold uppercase tracking-wider text-xs text-red-500">Firebase System Alert</p>
              <p className="text-xs opacity-80 mt-0.5">Connection failed: {dbError}. Please verify your .env.local variables and Firebase security rules.</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${isActive ? 'bg-red-500 glow-ring' : 'bg-blue-500 text-white'}`}>
            NO
          </div>
          <div>
            <span className="text-sm font-black tracking-widest block uppercase">NOcrisis</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Autonomous Emergency Network</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {systemSettings?.hotelName && <span className="text-[10px] font-black text-blue-500 border border-blue-500/20 px-2 py-1 rounded-md uppercase tracking-tighter">Deployed at {systemSettings.hotelName}</span>}
          <LiveStatusBadge />
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24 relative z-20">
        <div className="max-w-3xl mb-24">
          <h1 className="text-6xl lg:text-8xl font-black mb-6 leading-[0.8] tracking-tighter uppercase">
            {hotelDisplayName}
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-xl font-medium leading-relaxed">
            {isActive ? (
              <span className="text-red-500 animate-pulse">⚠️ EMERGENCY CRISIS ACTIVE ⚠️</span>
            ) : (
              <>Autonomous Emergency Coordination Network. 
              Powered by <span className="text-blue-500 font-bold">NOcrisis Tech</span>.</>
            )}
          </p>

          <div className="flex flex-wrap gap-4">
            {!systemSettings?.hotelName ? (
              <button 
                onClick={() => setShowSetup(true)}
                className="px-10 py-5 rounded-3xl bg-blue-500 text-white font-black text-xl hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
              >
                🚀 DEPLOY TO HOTEL
              </button>
            ) : (
              <>
                <Link href="/admin" className="px-8 py-4 rounded-2xl bg-white text-black font-black hover:bg-gray-200 transition-all active:scale-95">
                  🛡️ ADMIN PANEL
                </Link>
                <Link href="/staff" className="px-8 py-4 rounded-2xl border border-[var(--card-border)] font-black hover:bg-white/5 transition-all text-[var(--app-text)]">
                  👷 STAFF
                </Link>
                <button 
                  onClick={() => setQRModalOpen(true)}
                  className="px-8 py-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black hover:bg-blue-500/20 transition-all flex items-center gap-2"
                >
                  📱 GUEST QR
                </button>
              </>
            )}
          </div>
        </div>

        {/* AI Simulation Section */}
        {systemSettings?.hotelName && !isActive && (
          <div className="mb-24 p-8 rounded-[32px] border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-md">
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                   🤖 Simulate AI Detection
                </h2>
                <p className="text-gray-500 text-sm">
                  Trigger a crisis event to test real-time synchronization and AI instructions.
                </p>
              </div>
              <button 
                onClick={handleSimulateDetection}
                disabled={isSimulating}
                className="w-full lg:w-auto px-12 py-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-50 text-white"
              >
                {isSimulating ? 'DETECTION IN PROGRESS...' : 'TRIGGER AI SIMULATION'}
              </button>
            </div>
          </div>
        )}

        {/* Metrics Panel */}
        <div className="mb-24">
          <MetricsPanel />
        </div>

        {/* How it Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-[var(--card-border)] pt-24 mb-24">
          {[
            { step: '01', title: 'DETECT', desc: 'AI analyzes surveillance and IoT data to identify crises instantly.' },
            { step: '02', title: 'SYNC', desc: 'Firebase RTDB broadcasts the state globally in under 100ms.' },
            { step: '03', title: 'RESPOND', desc: 'Gemini AI generates and pushes specialized instructions to all roles.' },
          ].map((s) => (
            <div key={s.step}>
              <div className="text-4xl font-black opacity-10 mb-4 font-mono">{s.step}</div>
              <h3 className="text-xl font-black mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <QRModal 
        isOpen={isQRModalOpen} 
        onClose={() => setQRModalOpen(false)} 
        url={guestUrl} 
      />

      {/* Full Page Initialization Wizard */}
      {(showSetup || !systemSettings?.hotelName) && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6 overflow-y-auto">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
          </div>

          <div className="max-w-2xl w-full z-10 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-700">
            {/* Scaled Hero Branding */}
            <div className="text-center mb-8">
              <div className="inline-flex w-16 h-16 rounded-3xl bg-blue-500 items-center justify-center font-black text-2xl mb-4 shadow-2xl shadow-blue-500/30 text-white">
                NO
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-2 tracking-tighter text-white uppercase leading-[0.8]">
                NOCRISIS
              </h1>
              <p className="text-blue-400 font-bold uppercase tracking-[0.3em] text-xs md:text-sm">
                System Initialization
              </p>
            </div>
            
            <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2rem] p-6 md:p-8 shadow-2xl">
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2 block">Deployment Location (Hotel Name)</label>
                  <input 
                    type="text" 
                    value={setupHotelName}
                    onChange={(e) => setSetupHotelName(e.target.value)}
                    placeholder={hotelPlaceholder}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-lg font-bold text-white focus:outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all placeholder:text-gray-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2 block">Define Zones/Rooms (Comma Separated)</label>
                  <textarea 
                    value={setupLocations}
                    onChange={(e) => setSetupLocations(e.target.value)}
                    placeholder="Lobby, Rooms 101-120, etc."
                    rows={2}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all placeholder:text-gray-700 resize-none"
                  />
                </div>
                
                <button 
                  onClick={handleInitialize}
                  disabled={isInitializing || !setupHotelName.trim()}
                  className="w-full py-4 rounded-2xl bg-white text-black font-black text-lg hover:bg-blue-500 hover:text-white transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none mt-2 shadow-xl"
                >
                  {isInitializing ? 'INITIALIZING OS...' : 'ACTIVATE NO-CRISIS'}
                </button>
                
                {systemSettings?.hotelName && (
                  <button onClick={() => setShowSetup(false)} className="w-full mt-2 text-[10px] text-gray-500 uppercase font-bold tracking-widest hover:text-white transition-colors">
                    Close Setup
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-[var(--card-border)] flex flex-col md:flex-row justify-between items-center gap-6 opacity-30">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">NOcrisis v2.5 Platform</p>
        <div className="flex gap-8 text-[10px] font-mono">
          <Link href="/dev-lab" className="text-blue-500 hover:underline">🧪 SYNC TEST LAB</Link>
          <span>LATENCY: 42ms</span>
          <span>UPTIME: 99.9%</span>
          <span>SECURED BY AI</span>
        </div>
      </footer>
    </div>
  );
}
