import React, { useEffect, useState } from 'react';
import { MapPin, Trees, Castle, Waves, Mountain, Cloud } from 'lucide-react';

interface LoadingOverlayProps {
  type?: 'full' | 'minimal';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ type = 'full' }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = [
    "Meklējam...",
    "Identificējam...",
    "Ielādējam datus...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000); // Slower rotation (2 seconds)
    return () => clearInterval(interval);
  }, []);

  // MINIMAL MODE (For Nearby Places)
  if (type === 'minimal') {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-transparent cursor-wait pointer-events-auto">
         <div className="bg-white/90 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-2xl border border-white/60 flex flex-col items-center gap-2 animate-in zoom-in-95 fade-in duration-300 transform translate-y-12 md:translate-y-0">
             <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-[#A4343A]/20 rounded-full animate-ping" />
                <MapPin className="w-6 h-6 text-[#A4343A] drop-shadow-md animate-bounce" />
             </div>
             <span className="text-xs font-bold text-slate-800 tracking-wide">
                {messages[messageIndex]}
             </span>
         </div>
      </div>
    );
  }

  // FULL MODE
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/40 backdrop-blur-md animate-in fade-in duration-300">
        <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-[#A4343A]/10 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-4 border-4 border-[#A4343A]/20 rounded-full animate-ping delay-75" style={{ animationDuration: '1.5s' }} />
            
            <div className="absolute w-full h-full animate-[spin_4s_linear_infinite] opacity-60">
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/80 p-3 rounded-full shadow-lg backdrop-blur">
                    <Trees className="w-6 h-6 text-green-600" />
                 </div>
                 <div className="absolute top-1/2 -right-3 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-lg backdrop-blur">
                    <Castle className="w-6 h-6 text-purple-600 transform -rotate-90" />
                 </div>
                 <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white/80 p-3 rounded-full shadow-lg backdrop-blur">
                    <Waves className="w-6 h-6 text-blue-600 transform -rotate-180" />
                 </div>
                 <div className="absolute top-1/2 -left-3 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-lg backdrop-blur">
                    <Mountain className="w-6 h-6 text-stone-600 transform rotate-90" />
                 </div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <MapPin className="w-20 h-20 text-[#A4343A] drop-shadow-2xl animate-bounce" fill="#A4343A" stroke="white" strokeWidth={1.5} />
            </div>
        </div>

        <div className="mt-10 bg-white/90 backdrop-blur-xl px-10 py-5 rounded-3xl shadow-xl border border-white/60 flex flex-col items-center gap-3">
            <span className="text-lg font-bold text-slate-800 tracking-wide min-w-[160px] text-center">
                {messages[messageIndex]}
            </span>
            <div className="h-1.5 w-48 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#A4343A] to-indigo-600 animate-[progress_1s_ease-in-out_infinite] w-1/2 rounded-full" />
            </div>
        </div>
    </div>
  );
};

export default LoadingOverlay;