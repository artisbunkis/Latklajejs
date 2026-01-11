import React, { useState } from 'react';
import { LocationInfo, Coordinates, NearbyPlace } from '../types';
import { getCategoryStyle } from '../constants';
import { 
  MapPin, Info, Trees, Waves, X, 
  Castle, Landmark, Church, Coffee, Home, Droplets, Map as MapIcon,
  Mountain, ExternalLink, ArrowRight,
  TowerControl as Tower, Footprints, Component, Crown, Copy, Check
} from 'lucide-react';

interface InfoCardProps {
  info: LocationInfo;
  coords: Coordinates;
  onClose: () => void;
  onHoverPlace?: (place: NearbyPlace | null) => void;
  onNavigateToPlace: (place: NearbyPlace) => void;
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

const InfoCard: React.FC<InfoCardProps> = ({ info, coords, onClose, onHoverPlace, onNavigateToPlace }) => {
  const [copied, setCopied] = useState(false);
  
  const mainStyle = getCategoryStyle(info.type);

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
    <div className="bg-white/95 backdrop-blur-xl rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden w-full max-w-lg border border-white/40 animate-in slide-in-from-bottom-10 fade-in duration-500 flex flex-col max-h-[60vh] md:max-h-[calc(100vh-120px)] isolate z-20">
      
      {/* Visual Header with Image */}
      <div className="relative h-32 md:h-48 w-full shrink-0 overflow-hidden group bg-gray-900 z-10">
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

        {/* Decorative Big Icon */}
        <div className="absolute top-0 right-0 p-10 opacity-20 transform rotate-12 translate-x-10 -translate-y-10 pointer-events-none z-20">
            {getIcon(info.type, "w-64 h-64 text-white")}
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all z-30 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="absolute bottom-0 left-0 p-4 md:p-6 z-30 w-full pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5 border border-white/20 shadow-sm">
                {getIcon(info.type, "w-3 h-3")}
                {getCategoryStyle(info.type).label}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg line-clamp-2">{info.title}</h2>
        </div>
      </div>

      <div className="p-4 md:p-6 overflow-y-auto no-scrollbar relative z-0 bg-white">
        {/* Main Actions & Coords */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
           <div className="flex items-center gap-2">
               <p className="text-xs text-slate-500 font-mono flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <MapPin className="w-3 h-3 text-[#A4343A]" />
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </p>
                <button 
                    onClick={copyCoordinates}
                    className="p-1.5 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-600"
                    title="Kopēt koordinātas"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
           </div>
            
            <button 
              onClick={openMainLocationInMaps}
              className="flex items-center gap-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer border border-green-500 w-full sm:w-auto justify-center"
            >
              <GoogleMapsIcon className="w-3.5 h-3.5" />
              Atvērt Google Maps
            </button>
        </div>

        {/* Description */}
        <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">
          {info.description}
        </p>

        {/* Facts */}
        {info.facts.length > 0 && (
          <div className="mb-6 space-y-3">
            <ul className="grid gap-2">
              {info.facts.map((fact, index) => (
                <li key={index} className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-2">
                   <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                   {fact}
                </li>
              ))}
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
                    onMouseEnter={() => onHoverPlace?.(place)}
                    onMouseLeave={() => onHoverPlace?.(null)}
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
                    
                    {/* Action Icon overlay */}
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