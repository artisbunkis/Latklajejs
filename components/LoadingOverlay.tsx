import React, { useEffect, useState } from 'react';
import { MapPin, Trees, Castle, Waves, Mountain, Cloud, Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  type?: 'full' | 'minimal';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ type = 'full' }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = [
    "Skenējam Latvijas karti...",
    "Meklējam apslēptās pērles...",
    "Aprēķinām koordinātas...",
    "Ģenerējam tūrisma gidu...",
    "Gatavojam maršrutu..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // MINIMAL MODE (For Nearby Places)
  if (type === 'minimal') {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-transparent cursor-wait pointer-events-auto">
         {/* Compact Floating Card */}
         <div className="bg-white/90 backdrop-blur-xl px-8 py-5 rounded-2xl shadow-2xl border border-white/60 flex flex-col items-center gap-3 animate-in zoom-in-95 fade-in duration-300 transform translate-y-12 md:translate-y-0">
             
             {/* Small animated icon group */}
             <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-[#A4343A]/20 rounded-full animate-ping" />
                <MapPin className="w-8 h-8 text-[#A4343A] drop-shadow-md animate-bounce" />
             </div>

             <div className="flex flex-col items-center gap-1">
                 <span className="text-sm font-bold text-slate-800 tracking-wide min-w-[200px] text-center">
                    {messages[messageIndex]}
                 </span>
                 {/* Mini progress bar */}
                 <div className="h-0.5 w-24 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-indigo-600 animate-[progress_1.5s_ease-in-out_infinite]" />
                 </div>
             </div>
         </div>
         <style>{`
            @keyframes progress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `}</style>
      </div>
    );
  }

  // FULL MODE (For Random Search)
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/40 backdrop-blur-md animate-in fade-in duration-500">
        
        {/* Animated Scene Container */}
        <div className="relative w-64 h-64 flex items-center justify-center">
            
            {/* Pulsing Radar Rings */}
            <div className="absolute inset-0 border-4 border-[#A4343A]/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-4 border-4 border-[#A4343A]/20 rounded-full animate-ping delay-75" style={{ animationDuration: '3s' }} />
            
            {/* Orbiting Elements Track */}
            <div className="absolute w-full h-full animate-[spin_10s_linear_infinite] opacity-60">
                 {/* North */}
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/80 p-2 rounded-full shadow-sm backdrop-blur">
                    <Trees className="w-5 h-5 text-green-600 transform -rotate-0" />
                 </div>
                 {/* East */}
                 <div className="absolute top-1/2 -right-3 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-sm backdrop-blur">
                    <Castle className="w-5 h-5 text-purple-600 transform -rotate-90" />
                 </div>
                 {/* South */}
                 <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white/80 p-2 rounded-full shadow-sm backdrop-blur">
                    <Waves className="w-5 h-5 text-blue-600 transform -rotate-180" />
                 </div>
                 {/* West */}
                 <div className="absolute top-1/2 -left-3 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-sm backdrop-blur">
                    <Mountain className="w-5 h-5 text-stone-600 transform rotate-90" />
                 </div>
            </div>

            {/* Inner Floating Elements (Clouds) */}
            <div className="absolute top-10 left-10 animate-bounce delay-700 opacity-40">
                <Cloud className="w-6 h-6 text-slate-400" />
            </div>
             <div className="absolute bottom-12 right-12 animate-bounce delay-100 opacity-40">
                <Cloud className="w-4 h-4 text-slate-400" />
            </div>

            {/* Central Pin */}
            <div className="relative z-10 flex flex-col items-center">
                <MapPin className="w-16 h-16 text-[#A4343A] drop-shadow-2xl animate-bounce" fill="#A4343A" stroke="white" strokeWidth={2} />
                <div className="w-8 h-2 bg-black/20 rounded-[100%] blur-[2px] animate-pulse mt-[-4px]" />
            </div>

        </div>

        {/* Text Status */}
        <div className="mt-8 bg-white/90 backdrop-blur-xl px-8 py-4 rounded-2xl shadow-xl border border-white/60 flex flex-col items-center gap-2 transform transition-all hover:scale-105">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-3 h-3 bg-[#A4343A] rounded-full animate-ping absolute" />
                    <div className="w-3 h-3 bg-[#A4343A] rounded-full relative" />
                </div>
                <span className="text-sm font-bold text-slate-800 tracking-wide min-w-[200px] text-center">
                    {messages[messageIndex]}
                </span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-[#A4343A] to-indigo-600 animate-[progress_2s_ease-in-out_infinite] w-1/2 rounded-full" />
            </div>
        </div>
    </div>
  );
};

export default LoadingOverlay;