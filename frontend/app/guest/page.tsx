'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCrisisState } from '@frontend/hooks/useCrisisState';
import { guestAcknowledge, guestNeedsHelp } from '@backend/lib/db';
import { CRISIS_META } from '@backend/types';
import ThemeToggle from '@frontend/components/shared/ThemeToggle';
import { getAvailableRooms } from '@backend/lib/hotelConfig';

function GuestContent() {
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get('room');
  const [roomNumber, setRoomNumber] = useState(initialRoom || '');
  const { crisis, isActive, systemSettings, loading: coreLoading } = useCrisisState();
  const [step, setStep] = useState<'loading' | 'set-identity' | 'safe' | 'alert' | 'acknowledged' | 'help-sent'>('loading');
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  useEffect(() => {
    if (coreLoading) return;
    
    // If no room is set, we MUST be in identity step
    if (!roomNumber) {
      setStep('set-identity');
      return;
    }

    // Only auto-transition if we are already "in" the portal
    if (step !== 'set-identity' && step !== 'loading') {
      if (isActive && crisis) {
        setStep(prev => (prev === 'safe') ? 'alert' : prev);
      } else {
        setStep('safe');
      }
    }
  }, [isActive, crisis?.id, roomNumber, coreLoading]);

  const handleAcknowledge = async () => {
    if (!crisis) return;
    await guestAcknowledge(crisis.id, roomNumber);
    setStep('acknowledged');
  };

  const handleNeedHelp = async () => {
    if (!crisis) return;
    await guestNeedsHelp(crisis.id, roomNumber);
    setStep('help-sent');
  };

  const meta = crisis ? CRISIS_META[crisis.type] : null;
  const hotelDisplayName = systemSettings?.hotelName || 'Grand Horizon Hotel';

  const translations = {
    en: {
      emergencyAlert: 'EMERGENCY ALERT',
      room: `ROOM ${roomNumber}`,
      acknowledge: 'I UNDERSTAND',
      iAmSafe: '✓ I AM SAFE',
      needHelp: '🆘 I NEED HELP',
      stayCalm: 'Stay calm. Help is on the way.',
      followInstructions: 'Follow these instructions:',
      helpSent: 'HELP IS COMING',
      helpDesc: 'Staff have been notified of your location.',
      stayPut: 'Stay where you are. Do not move unless instructed.',
      safe: 'All Clear',
      safeDesc: 'No active emergencies at this time.',
      emergencyNumbers: 'Emergency Numbers',
      acknowledged: 'Alert Received',
      acknowledgedDesc: 'Your status has been recorded.',
      waitForStaff: 'Follow the safety instructions below.',
    },
    hi: {
      emergencyAlert: 'आपातकालीन चेतावनी',
      room: `कमरा ${roomNumber}`,
      acknowledge: 'मैं समझता/समझती हूँ',
      iAmSafe: '✓ मैं सुरक्षित हूँ',
      needHelp: '🆘 मुझे मदद चाहिए',
      stayCalm: 'शांत रहें। मदद आ रही है।',
      followInstructions: 'इन निर्देशों का पालन करें:',
      helpSent: 'मदद आ रही है',
      helpDesc: 'कर्मचारियों को आपके स्थान की सूचना दी गई है।',
      stayPut: 'जहाँ हैं वहीं रहें। निर्देश मिलने तक न हटें।',
      safe: 'सब ठीक है',
      safeDesc: 'इस समय कोई आपातकालीन स्थिति नहीं है।',
      emergencyNumbers: 'आपातकालीन नंबर',
      acknowledged: 'अलर्ट प्राप्त',
      acknowledgedDesc: 'आपकी स्थिति दर्ज की गई है।',
      waitForStaff: 'नीचे दिए गए सुरक्षा निर्देशों का पालन करें।',
    },
  };

  const t = translations[lang];

  // ─── Step 1: Who are you? (Identity) ──────────────────────────────────
  if (step === 'set-identity') {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center">
         <div className="max-w-xs w-full">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-3xl mb-8 mx-auto shadow-2xl">
              🏨
            </div>
            <h1 className="text-3xl font-black mb-2 tracking-tighter uppercase">{hotelDisplayName}</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-10">Guest Safety Portal</p>
            
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-3 block text-left">Your Room Number</label>
                  <input 
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 204"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-bold focus:outline-none focus:border-blue-500 transition-all text-center placeholder:text-gray-700"
                  />
               </div>

               <button 
                  onClick={() => { if (roomNumber.trim()) setStep('safe'); }}
                  disabled={!roomNumber.trim()}
                  className="w-full py-5 rounded-2xl bg-white text-black font-black text-lg hover:bg-blue-500 hover:text-white transition-all active:scale-95 disabled:opacity-20"
               >
                  ENTER PORTAL
               </button>
            </div>
         </div>
      </div>
    );
  }

  // ─── All Clear ────────────────────────────────────────────────────────
  if (step === 'safe') {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center">
        {/* Language toggle */}
        <div className="fixed top-4 right-4 flex gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800">
          {(['en', 'hi'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${lang === l ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>
              {l === 'en' ? 'EN' : 'हिं'}
            </button>
          ))}
        </div>

        <div className="text-7xl mb-4">✅</div>
        <h1 className="text-3xl font-black text-white mb-2">{t.safe}</h1>
        <p className="text-gray-400 text-lg">{t.safeDesc}</p>
        <p className="text-gray-700 text-sm mt-2 font-mono uppercase tracking-widest">{t.room} · {hotelDisplayName}</p>

        <div className="mt-12 bg-gray-900 rounded-2xl p-5 border border-gray-800 w-full max-w-xs">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">{t.emergencyNumbers}</p>
          <div className="space-y-3">
            {[
              { label: 'Front Desk', number: 'Ext. 0' },
              { label: 'Security', number: 'Ext. 100' },
              { label: 'Emergency', number: '112' },
            ].map(c => (
              <a key={c.label} href={`tel:${c.number}`}
                className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-800/50 hover:bg-gray-800">
                <span className="text-gray-400 text-sm">{c.label}</span>
                <span className="font-bold text-white font-mono text-sm">{c.number}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Help Sent ────────────────────────────────────────────────────────
  if (step === 'help-sent') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ background: 'linear-gradient(180deg, #1a0505 0%, #0a0000 100%)' }}>
        <div className="text-7xl mb-4 siren-pulse">🆘</div>
        <h1 className="text-3xl font-black text-red-400 mb-3">{t.helpSent}</h1>
        <p className="text-gray-300 text-lg mb-2">{t.helpDesc}</p>
        <p className="text-gray-500 text-sm">{t.stayPut}</p>

        <div className="mt-8 px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/30">
          <p className="text-red-400 text-sm font-bold">{t.room}</p>
          <p className="text-gray-500 text-xs mt-1">Help request sent · {new Date().toLocaleTimeString()}</p>
        </div>

        <a href="tel:112"
          className="mt-8 px-8 py-4 rounded-2xl bg-red-500 text-white font-black text-lg active:scale-95 transition-all">
          📞 CALL 112
        </a>
      </div>
    );
  }

  // ─── Active Crisis: Alert + Acknowledged ──────────────────────────────
  const guestActions = crisis?.instructions?.guests || [
    'Stay calm and follow hotel staff instructions',
    'Do NOT use elevators — use stairs only',
    'Proceed to the nearest emergency exit',
  ];

  return (
    <div className="min-h-screen flex flex-col text-[var(--app-text)] transition-colors duration-300"
      style={{ background: isActive ? 'linear-gradient(180deg, #1a0505 0%, var(--app-bg) 100%)' : 'var(--app-bg)' }}>

      {/* Top Controls */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
        <Link href="/" className="w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all">
          ←
        </Link>
      </div>

      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <div className="flex gap-1 bg-black/50 backdrop-blur p-1 rounded-xl border border-white/5">
          {(['en', 'hi'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${lang === l ? 'bg-white text-black shadow-lg' : 'text-gray-500'}`}>
              {l === 'en' ? 'EN' : 'हिं'}
            </button>
          ))}
        </div>
        <ThemeToggle />
      </div>

      {meta && (
        <div className="px-4 py-4 text-center siren-pulse"
          style={{ background: `${meta.color}15`, borderBottom: `2px solid ${meta.color}` }}>
          <p className="text-xs font-black tracking-[0.3em]" style={{ color: meta.color }}>
            ⚠ {t.emergencyAlert}
          </p>
        </div>
      )}

      <div className="flex-1 p-5 max-w-sm mx-auto w-full flex flex-col">

        {step === 'alert' && meta && crisis && (
          <div className="flex-1 flex flex-col justify-center py-4">
            {/* Big crisis icon */}
            <div className="text-center mb-6">
              <div className="text-8xl mb-4 float-icon">{meta.icon}</div>
              <h1 className="text-4xl font-black uppercase siren-pulse" style={{ color: meta.color }}>
                {meta.label}
              </h1>
              <p className="text-gray-300 text-lg mt-2">📍 {crisis.location}</p>
              <p className="text-gray-500 text-sm mt-1">{t.stayCalm}</p>
            </div>

            {/* Instructions */}
            <div className="rounded-2xl p-5 border mb-6"
              style={{ borderColor: `${meta.color}30`, background: `${meta.color}08` }}>
              <p className="text-xs font-black mb-4 tracking-wider" style={{ color: meta.color }}>
                {t.followInstructions}
              </p>
              <ul className="space-y-3">
                {guestActions.map((action, i) => (
                  <li key={i} className="flex gap-3 text-base text-gray-200 items-start">
                    <span className="text-lg font-black shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: `${meta.color}20`, color: meta.color }}>
                      {i + 1}
                    </span>
                    <span className="pt-1">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Acknowledge button */}
            <button
              onClick={handleAcknowledge}
              className="w-full py-5 rounded-2xl text-white font-black text-xl transition-all active:scale-95"
              style={{ background: meta.color }}
            >
              {t.acknowledge}
            </button>
          </div>
        )}

        {step === 'acknowledged' && meta && crisis && (
          <div className="flex-1 flex flex-col justify-center py-4">
            {/* Acknowledged confirmation */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: `${meta.color}20`, border: `2px solid ${meta.color}` }}>
                <span className="text-2xl" style={{ color: meta.color }}>✓</span>
              </div>
              <h2 className="text-xl font-black text-white">{t.acknowledged}</h2>
              <p className="text-xs text-gray-500 mt-1">{t.acknowledgedDesc}</p>
              <p className="text-xs text-gray-600 mt-1">{t.waitForStaff}</p>
            </div>

            {/* Instructions checklist */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-6">
              <ul className="space-y-4">
                {guestActions.map((action, i) => (
                  <li key={i} className="flex gap-3 text-base text-gray-200 items-start">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                      style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}` }}>
                      {i + 1}
                    </div>
                    <span className="pt-0.5">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (crisis) guestAcknowledge(crisis.id, roomNumber);
                  setStep('safe');
                }}
                className="w-full py-4 rounded-2xl text-white font-black text-lg transition-all active:scale-95"
                style={{ background: '#22C55E' }}
              >
                {t.iAmSafe}
              </button>

              <button
                onClick={handleNeedHelp}
                className="w-full py-4 rounded-2xl text-white font-black text-lg transition-all active:scale-95 border-2 border-red-500 bg-red-500/10"
              >
                {t.needHelp}
              </button>
            </div>

            {/* Emergency call */}
            <div className="mt-6 text-center">
              <a href="tel:112" className="text-sm text-gray-500 hover:text-white transition-all">
                📞 Emergency: <span className="font-bold font-mono">112</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GuestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-[var(--app-text)] rounded-full animate-spin" />
      </div>
    }>
      <GuestContent />
    </Suspense>
  );
}
