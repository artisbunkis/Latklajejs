import React from 'react';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3 select-none pointer-events-none">
      {/* Text Only */}
      <div className="flex flex-col pt-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          <span className="text-[#A4343A]">Lat</span>klājējs
        </h1>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none ml-0.5 mt-2">
            AI Ceļvedis
        </span>
      </div>
    </div>
  );
};

export default Logo;