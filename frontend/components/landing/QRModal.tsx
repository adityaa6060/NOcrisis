'use client';

import QRCode from 'react-qr-code';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export default function QRModal({ isOpen, onClose, url }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={onClose}>
      <div 
        className="bg-[#0A0A0A] border border-white/10 p-8 rounded-[32px] w-full max-w-sm text-center shadow-2xl animate-in fade-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-black text-white mb-2">Guest Experience</h3>
        <p className="text-gray-500 text-xs mb-8 uppercase tracking-widest font-bold">Scan to enter portal</p>
        
        <div className="bg-white p-6 rounded-[24px] inline-block mb-8 shadow-xl">
          <QRCode value={url} size={200} />
        </div>

        <p className="text-[10px] text-gray-700 font-mono mb-8 break-all border border-white/5 p-2 rounded-lg">{url}</p>

        <button 
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-white text-black font-black hover:bg-gray-200 transition-all active:scale-95"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
