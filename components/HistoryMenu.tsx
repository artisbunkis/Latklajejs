import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { Clock, MapPin, X, Trash2, ChevronRight, Map, Satellite, Search } from 'lucide-react';
import { getCategoryStyle } from '../constants';

interface HistoryMenuProps {
  isOpen: boolean;
  history: HistoryItem[];
  mapStyle: 'standard' | 'satellite';
  onSetMapStyle: (style: 'standard' | 'satellite') => void;
  onClose: () => void;
  onRestore: (item: HistoryItem) => void;
  onClear: () => void;
  onSearch: (query: string) => void;
}

const HistoryMenu: React.FC<HistoryMenuProps> = ({ 
    isOpen, 
    history, 
    mapStyle,
    onSetMapStyle,
    onClose, 
    onRestore, 
    onClear,
    onSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('lv-LV', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    }).format(new Date(ts));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
        onSearch(searchQuery);
        setSearchQuery(''); // Optional: clear after search
    }
  };

  return (
    <>
        {/* Backdrop */}
        <div 
            className={`fixed inset-0 z-50 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />

        {/* Drawer */}
        <div 
            className={`
                fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white/95 backdrop-blur-2xl shadow-2xl 
                transform transition-transform duration-300 ease-out border-l border-white/50 flex flex-col
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white/50 shrink-0">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#A4343A]" />
                    <h2 className="text-xl font-bold text-slate-900">Izvēlne</h2>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Search Section */}
            <div className="p-4 pb-0 shrink-0">
                <form onSubmit={handleSearchSubmit} className="relative">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Meklēt vietu..." 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4343A]/20 focus:border-[#A4343A] transition-all text-base font-medium text-slate-800 placeholder:text-slate-400"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <button 
                        type="submit"
                        disabled={!searchQuery.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#A4343A] text-white rounded-lg hover:bg-[#8a2b30] disabled:opacity-0 disabled:pointer-events-none transition-all"
                    >
                        <ArrowRight className="w-3 h-3" />
                    </button>
                </form>
            </div>

            {/* Map Style Toggle Section */}
            <div className="p-4 border-b border-slate-100 shrink-0">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1 mt-2">Kartes Stils</h3>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onSetMapStyle('standard')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                            mapStyle === 'standard' 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                            : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Map className="w-4 h-4" />
                        <span className="text-sm font-semibold">Karte</span>
                    </button>
                    <button
                        onClick={() => onSetMapStyle('satellite')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                            mapStyle === 'satellite' 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                            : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Satellite className="w-4 h-4" />
                        <span className="text-sm font-semibold">Satelīts</span>
                    </button>
                </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Vēsture ({history.length})</h3>
                
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 p-8">
                        <Clock className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm font-medium">Vēsture ir tukša</p>
                        <p className="text-xs opacity-70 mt-1">Atklātās vietas parādīsies šeit.</p>
                    </div>
                ) : (
                    history.map((item) => {
                        const style = getCategoryStyle(item.info.type);
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onRestore(item);
                                    onClose();
                                }}
                                className="w-full text-left bg-white p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-md transition-all group relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start gap-3 relative z-10">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${style.bgClass.replace('bg-', 'bg-slate-')}`} style={{ backgroundColor: style.color }}></span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                {formatDate(item.timestamp)}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
                                            {item.info.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                                            <MapPin className="w-3 h-3" />
                                            {item.coords.lat.toFixed(3)}, {item.coords.lng.toFixed(3)}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all mt-3" />
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            {history.length > 0 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                    <button
                        onClick={onClear}
                        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 py-3 rounded-xl transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Dzēst vēsturi
                    </button>
                </div>
            )}
        </div>
    </>
  );
};

// Helper for icon component in input
function ArrowRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}

export default HistoryMenu;