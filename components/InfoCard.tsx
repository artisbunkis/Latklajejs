import React, { useState, useEffect, useRef } from 'react';
import { LocationInfo, Coordinates, NearbyPlace } from '../types';
import { getCategoryStyle } from '../constants';
import { 
  MapPin, Info, Trees, Waves, X, 
  Castle, Landmark, Church, Coffee, Home, Droplets, Map as MapIcon,
  Mountain, ExternalLink, ArrowRight,
  TowerControl as Tower, Footprints, Component, Crown, Copy, Check, ChevronLeft, Link as LinkIcon
} from 'lucide-react';

interface InfoCardProps {
  info: LocationInfo;
  coords: Coordinates;
  onClose: () => void;
  onHoverPlace?: (place: NearbyPlace | null) => void;
  onNavigateToPlace: (place: NearbyPlace) => void;
  onBack?: () => void;
}

const PLACE_IMAGES: Record<string, string> = {
  'Forest': 'https://images.unsplash.com/photo-1448375240586-dfd8d395ea6c?q=80&w=800&auto=format&fit=crop',
  'Nature': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop',
  'Field': 'https://images.unsplash.com/photo-1472214103451-9374bd1c7dd1?q=80&w=800&auto=format&fit=crop',
  'Lake': 'https://images.unsplash.com/photo-1557456170-0cf4f4d0d3ce?q=80&w=800&auto=format&fit=crop',
  'River': 'https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?q=80&w=800&auto=format&fit=crop',
  'Sea': 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=800&auto=format&fit=crop',
  'City': 'https://images.unsplash.com/photo-1449824913929-49aa714953dc?q=80&w=800&auto=format&fit=crop',
  'Village': 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=800&auto=format&fit=crop',
  'Castle': 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?q=80&w=800&auto=format&fit=crop',
  'Manor': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop',
  'Ruins': 'https://images.unsplash.com/photo-1552554627-020556216447?q=80&w=800&auto=format&fit=crop',
  'Museum': 'https://images.unsplash.com/photo-1518998053901-5348d3969105?q=80&w=800&auto=format&fit=crop',
  'Church': 'https://images.unsplash.com/photo-1548625361-998310d65a2c?q=80&w=800&auto=format&fit=crop',
  'Tower': 'https://images.unsplash.com/photo-1574088012674-c08170d13374?q=80&w=800&auto=format&fit=crop',
  'Trail': 'https://images.unsplash.com/photo-1596238615784-91288ca3c788?q=80&w=800&auto=format&fit=crop',
  'Hill': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop',
  'Cafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800&auto=format&fit=crop',
  'Other': 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=800&auto=format&fit=crop',
};

// Custom Google Maps Icon SVG
const GoogleMapsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

type ViewState = 'minimized' | 'normal' | 'expanded';

const InfoCard: React.FC<InfoCardProps> = ({ info, coords, onClose, onHoverPlace, onNavigateToPlace, onBack }) => {
  const [copied, setCopied] = useState(false);
  
  // 3-State Swipe States
  const [viewState, setViewState] = useState<ViewState>('normal');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [currentTranslateY, setCurrentTranslateY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  const cardRef = useRef<HTMLDivElement>(null);

  // Update window width listener for responsiveness
  useEffect(() => {
    const handleResize = () => {
        setWindowWidth(window.innerWidth);
        // Reset transform if switching to desktop
        if (window.innerWidth >= 768) {
            setCurrentTranslateY(null);
            setViewState('normal'); // doesn't affect desktop visual but resets state logic
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Constants for calculating snap points (in pixels based on window height)
  // These are recalculated on touch start to handle potential resizes
  const getSnapPoints = () => {
    // Safety check for SSR or hidden window
    if (typeof window === 'undefined') return { expanded: 0, normal: 0, minimized: 0 };
    
    const h = window.innerHeight;
    const sheetHeight = h * 0.85; // 85vh
    const headerHeight = 128; // 8rem approx 128px (h-32)
    const normalVisible = h * 0.45; // 45vh visible in normal mode
    
    return {
        expanded: 0,
        normal: sheetHeight - normalVisible,
        minimized: sheetHeight - headerHeight
    };
  };

  // Reset to normal when new info arrives
  useEffect(() => {
    setViewState('normal');
    setCurrentTranslateY(null);
  }, [info]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (windowWidth >= 768) return;
    setTouchStart(e.touches[0].clientY);
    setIsDragging(true);
    e.stopPropagation(); // Prevent map interaction while dragging
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null || windowWidth >= 768) return;
    e.stopPropagation();
    
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStart;
    
    const snaps = getSnapPoints();
    const baseTranslate = snaps[viewState];
    
    // Apply resistance if pulling beyond bounds (pulling up beyond expanded)
    let newTranslate = baseTranslate + delta;
    if (newTranslate < snaps.expanded) {
        newTranslate = snaps.expanded + (delta * 0.3); // Resistance at top
    }
    
    setCurrentTranslateY(newTranslate);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (windowWidth >= 768 || touchStart === null) return;
    e.stopPropagation();
    
    const endY = e.changedTouches[0].clientY;
    const delta = endY - touchStart;
    const threshold = 50; // px to trigger change
    
    let nextState: ViewState = viewState;

    if (delta > threshold) {
        if (viewState === 'expanded') nextState = 'normal';
        else if (viewState === 'normal') nextState = 'minimized';
    } else if (delta < -threshold) {
        if (viewState === 'minimized') nextState = 'normal';
        else if (viewState === 'normal') nextState = 'expanded';
    }

    setViewState(nextState);
    setIsDragging(false);
    setTouchStart(null);
    setCurrentTranslateY(null); // Let CSS transition take over
  };
  
  // Calculate style for current state
  const getStyle = () => {
    // STRICT: Return empty object if desktop. 
    if (windowWidth >= 768) return {};

    const snaps = getSnapPoints();
    
    // During drag, use direct pixel value
    if (isDragging && currentTranslateY !== null) {
        return { transform: `translateY(${currentTranslateY}px)` };
    }

    // Passive state
    return { transform: `translateY(${snaps[viewState]}px)` };
  };
  
  const mainStyle = getCategoryStyle(info.type);
  const regionStyle = info.region ? getCategoryStyle(info.region) : null;

  const getIcon = (type: string, className = "w-6 h-6") => {
    switch (type) {
      case 'Forest': return <Trees className={className} />;
      case 'Nature': return <Trees className={className} />;
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

  const getPlaceIcon = (type: string, className = "w-4 h-4") => getIcon(type, className);

  const getGoogleMapsUrl = (name: string) => {
    const query = name.toLowerCase().includes('latvija') ? name : `${name}, Latvia`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const openMainLocationInMaps = () => {
    window.open(getGoogleMapsUrl(info.title), '_blank');
  };

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normalizedType = Object.keys(PLACE_IMAGES).find(key => key.toLowerCase() === info.type.toLowerCase()) || 'Other';
  const bgImage = PLACE_IMAGES[normalizedType] || PLACE_IMAGES['Other'];

  return (
    <div 
        ref={cardRef}
        className={`
            bg-white/95 backdrop-blur-xl rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden 
            w-full max-w-lg border border-white/40 isolate z-20 pointer-events-auto
            
            /* Mobile: Fixed Bottom Sheet */
            fixed bottom-0 left-0 right-0 h-[85vh]
            
            /* Desktop: Strict Vertical Constraints */
            md:static md:w-full md:transform-none
            
            /* Max height calculation: 100vh - 176px (128 top + 48 bottom) = approx 11rem chrome */
            md:max-h-[calc(100vh-11rem)] 
            md:h-auto

            flex flex-col 
            
            ${isDragging ? 'duration-0' : 'duration-300 ease-out'}
        `}
        style={getStyle()}
    >
      
      {/* Visual Header */}
      <div 
        className="relative h-32 md:h-48 w-full shrink-0 overflow-hidden group bg-gray-900 z-10 cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: 'none' }} 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`absolute inset-0 bg-gradient-to-t ${mainStyle.gradient} opacity-90 z-20`} />
        
        {/* Background Image */}
        <img 
            src={bgImage} 
            alt={info.type}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 z-10 opacity-80"
            onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
            }}
        />

        {/* Swipe Handle for Mobile */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-white/50 rounded-full z-40 backdrop-blur-md md:hidden shadow-sm" />

        {/* Decorative Big Icon */}
        <div className="absolute top-0 right-0 p-10 opacity-20 transform rotate-12 translate-x-10 -translate-y-10 pointer-events-none z-20">
            {getIcon(info.type, "w-64 h-64 text-white")}
        </div>

        {/* Desktop Back Button */}
        {onBack && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onBack();
                }}
                className="hidden md:flex absolute top-4 left-4 p-2 bg-black/30 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all z-30 cursor-pointer items-center justify-center group"
                title="Atpakaļ"
            >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
        )}

        {/* Close Button */}
        <button 
          onClick={(e) => {
              e.stopPropagation();
              onClose();
          }}
          className="hidden md:block absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all z-30 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="absolute bottom-0 left-0 p-4 md:p-6 z-30 w-full pointer-events-none">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5 border border-white/20 shadow-sm">
                {getIcon(info.type, "w-3 h-3")}
                {getCategoryStyle(info.type).label}
            </span>
            
            {info.region && regionStyle && (
                <span 
                    className="backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5 border border-white/20 shadow-sm"
                    style={{ backgroundColor: regionStyle.color }}
                >
                    <MapPin className="w-3 h-3" />
                    {info.region}
                </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg line-clamp-2">{info.title}</h2>
        </div>
      </div>

      <div className="p-4 md:p-6 overflow-y-auto no-scrollbar relative z-0 bg-white">
        {/* Main Actions & Coords */}
        <div className="flex flex-row items-center justify-between gap-2 mb-6">
           <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 shrink-0">
               <MapPin className="w-3.5 h-3.5 text-[#A4343A]" />
               <p className="text-xs text-slate-500 font-mono font-medium">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </p>
                <div className="w-px h-3 bg-slate-200 mx-1"></div>
                <button 
                    onClick={copyCoordinates}
                    className="hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-600 active:scale-95"
                    title="Kopēt koordinātas"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
           </div>
            
            <button 
              onClick={openMainLocationInMaps}
              className="flex items-center gap-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer border border-green-500 shrink-0"
            >
              <GoogleMapsIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Atvērt Google Maps</span>
              <span className="sm:hidden">Google Maps</span>
            </button>
        </div>

        {/* Description */}
        <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">
          {info.description}
        </p>

        {/* Sources */}
        {info.sources && info.sources.length > 0 && (
          <div className="mb-6">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <ExternalLink className="w-3 h-3" />
              Avoti no tīmekļa
            </h3>
            <div className="flex flex-wrap gap-2">
              {info.sources.map((source, index) => (
                <a 
                  key={index}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-1.5 font-bold shadow-sm"
                >
                  <span className="truncate max-w-[150px]">{source.title || 'Informācija'}</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Facts - Cleaned Up */}
        {info.facts.length > 0 && (
          <div className="mb-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-3 h-3" />
              Interesanti fakti
            </h3>
            <ul className="grid gap-2">
              {info.facts.map((fact, index) => {
                const url = fact.sourceUrl || `https://www.google.com/search?q=${encodeURIComponent(fact.text)}`;
                
                return (
                  <li key={index}>
                    <a 
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative text-xs text-slate-600 bg-slate-50 p-3 pr-8 rounded-xl border border-slate-100 flex gap-2 items-start hover:bg-indigo-50 hover:border-indigo-100 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99]"
                      title="Skatīt avotu"
                    >
                       <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0 group-hover:scale-150 transition-transform" />
                       <span className="group-hover:text-indigo-900 transition-colors">{fact.text}</span>
                       
                       {/* Subtle Link Icon in Top Right */}
                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <LinkIcon className="w-3 h-3 text-indigo-400" />
                       </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Nearby Places */}
        {info.nearbyPlaces && info.nearbyPlaces.length > 0 && (
          <div className="relative">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <MapIcon className="w-3 h-3" />
              Tuvākās vietas
            </h3>
            
            <div className="grid grid-cols-1 gap-2 relative z-10 pb-6">
              {info.nearbyPlaces.map((place, index) => {
                const style = getCategoryStyle(place.type);
                
                return (
                  <div 
                    key={index}
                    onMouseEnter={() => {
                        if (window.innerWidth >= 768) {
                           onHoverPlace?.(place);
                        }
                    }}
                    onMouseLeave={() => {
                        if (window.innerWidth >= 768) {
                            onHoverPlace?.(null);
                        }
                    }}
                    onClick={() => onNavigateToPlace(place)}
                    className="bg-white border border-slate-100 p-2 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group shadow-sm flex items-center gap-3 w-full relative transform transition-transform hover:-translate-y-0.5 active:translate-y-0"
                    style={{ isolation: 'isolate' }}
                  >
                    <div className={`${style.bgClass} ${style.textClass} p-1.5 rounded-lg transition-colors shrink-0`}>
                       {getPlaceIcon(place.type, "w-4 h-4")}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                             <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors" title={place.name}>
                                {place.name}
                            </h4>
                            <span className="text-[10px] text-slate-500 truncate block">{style.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">{place.distance}</span>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity px-1">
                         <ArrowRight className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoCard;