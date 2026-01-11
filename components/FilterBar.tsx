import React from 'react';
import { FILTER_CATEGORIES, getCategoryStyle } from '../constants';
import { 
  Trees, Droplets, Waves, Home, Castle, Crown, Component, 
  TowerControl as Tower, Footprints, Mountain, Landmark, Church, 
  MapPin, Coffee, Leaf
} from 'lucide-react';

interface FilterBarProps {
  isOpen: boolean;
  selectedFilters: string[];
  onToggleFilter: (filter: string) => void;
  onClearFilters: () => void;
  onClose: () => void;
}

const getIcon = (type: string, className = "w-4 h-4") => {
    switch (type) {
      case 'Forest': return <Trees className={className} />;
      case 'Nature': return <Leaf className={className} />;
      case 'Field': return <Trees className={className} />;
      case 'Lake': return <Droplets className={className} />;
      case 'River': return <Waves className={className} />;
      case 'Sea': return <Waves className={className} />;
      case 'City': return <Home className={className} />;
      case 'Village': return <Home className={className} />;
      case 'Castle': return <Castle className={className} />;
      case 'Manor': return <Crown className={className} />;
      case 'Ruins': return <Component className={className} />;
      case 'Tower': return <Tower className={className} />;
      case 'Trail': return <Footprints className={className} />;
      case 'Hill': return <Mountain className={className} />;
      case 'Museum': return <Landmark className={className} />;
      case 'Church': return <Church className={className} />;
      case 'Cafe': return <Coffee className={className} />;
      default: return <MapPin className={className} />;
    }
};

const FilterBar: React.FC<FilterBarProps> = ({ 
  isOpen, 
  selectedFilters, 
  onToggleFilter, 
  onClearFilters,
  onClose
}) => {
  
  return (
    <div 
        className={`
            fixed z-50 transition-all duration-300 ease-out
            
            /* Mobile Layout: Vertical Popup from Top Right (below buttons) */
            top-24 right-4 
            flex flex-col gap-2 
            bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl 
            max-h-[60vh] w-64 border border-white/20 origin-top-right

            /* Desktop Layout: Horizontal Strip to Left of Button Group */
            md:top-6 md:right-[160px]
            md:flex-row md:items-center md:gap-2
            md:h-12 md:p-0
            md:bg-transparent md:shadow-none md:border-none
            md:backdrop-blur-none
            md:origin-right
            
            /* Prevent Logo Overlap on Desktop - Increased padding from left/logo */
            md:max-w-[calc(100vw-400px)] md:w-auto

            /* State Classes */
            ${isOpen 
                ? 'opacity-100 scale-100 translate-y-0 md:translate-x-0 pointer-events-auto' 
                : 'opacity-0 scale-95 -translate-y-4 md:translate-y-0 md:translate-x-8 pointer-events-none'
            }
        `}
    >
        {/* Content Container - Ensure no hard overflow clips scaling elements unnecessarily on mobile */}
        <div 
            className="w-full h-full relative md:rounded-l-full"
        >
             {/* Scrollable List */}
             <div 
                className={`
                    flex flex-col gap-3 w-full max-h-[calc(60vh-32px)] overflow-y-auto p-2
                    md:flex-row md:items-center md:h-full md:max-h-none md:overflow-x-auto md:overflow-y-hidden md:gap-2 md:px-2 md:p-0
                    no-scrollbar
                    
                    /* Desktop Fade Mask */
                    md:[mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]
                    md:[-webkit-mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]
                `}
                onWheel={(e) => {
                    // Enable horizontal scrolling with mouse wheel on desktop
                    if (window.innerWidth >= 768) {
                        e.currentTarget.scrollLeft += e.deltaY;
                    }
                }}
             >
                <style>{`
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>

                {/* Left spacer for mask fade area */}
                <div className="hidden md:block w-2 shrink-0" />

                {[...FILTER_CATEGORIES].map(category => {
                    const style = getCategoryStyle(category);
                    const isSelected = selectedFilters.includes(category);

                    return (
                        <div key={category} className={`shrink-0 relative ${isSelected ? 'z-20' : 'z-0'}`}>
                            <button
                                onClick={() => onToggleFilter(category)}
                                className={`
                                    h-10 px-4 rounded-full text-xs font-semibold transition-all flex items-center gap-2 border whitespace-nowrap 
                                    
                                    /* Mobile: Center buttons, constrained width to allow scaling without clip */
                                    w-[95%] mx-auto justify-start shadow-sm
                                    
                                    /* Desktop: Auto width, Stronger Shadow */
                                    md:w-auto md:justify-center
                                    md:shadow-md md:hover:shadow-lg
                                    md:border-white/60 md:backdrop-blur-md md:bg-white/90

                                    ${isSelected 
                                        ? 'text-white shadow-xl scale-105 border-transparent !bg-opacity-100 z-10' 
                                        : `${style.bgClass} ${style.textClass} hover:brightness-95 border-slate-100/50`
                                    }
                                `}
                                style={isSelected ? { backgroundColor: style.color } : {}}
                            >
                                {getIcon(category, "w-4 h-4")}
                                {style.label}
                            </button>
                        </div>
                    );
                })}

                 {/* Clear Button */}
                 {selectedFilters.length > 0 && (
                    <button 
                        onClick={onClearFilters}
                        className="shrink-0 h-10 px-4 rounded-full text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap w-[95%] mx-auto md:w-auto md:ml-2"
                        style={{ backgroundColor: '#A4343A' }}
                    >
                        <span>Notīrīt</span>
                    </button>
                )}
                
                {/* Right spacer for mask fade area */}
                <div className="hidden md:block w-2 shrink-0" />
            </div>
        </div>
    </div>
  );
};

export default FilterBar;