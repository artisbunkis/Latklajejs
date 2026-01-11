import React, { useState, useCallback, useEffect } from 'react';
import { Compass, Loader2, Menu, Clock, Trash2, ArrowRight, ChevronLeft, Dices, SlidersHorizontal, Map as MapIcon, Satellite } from 'lucide-react';
import Map from './components/Map';
import InfoCard from './components/InfoCard';
import FilterBar from './components/FilterBar';
import Logo from './components/Logo';
import LoadingOverlay from './components/LoadingOverlay';
import { generateRandomLatviaCoordinates } from './utils/geo';
import { fetchLocationDetails } from './services/geminiService';
import { Coordinates, LocationInfo, HistoryItem, NearbyPlace } from './types';
import { INITIAL_VIEW } from './constants';

const App: React.FC = () => {
  const [viewState, setViewState] = useState({ center: { lat: INITIAL_VIEW.lat, lng: INITIAL_VIEW.lng }, zoom: INITIAL_VIEW.zoom });
  const [pinLocation, setPinLocation] = useState<Coordinates | null>(null);
  const [hoveredPlace, setHoveredPlace] = useState<NearbyPlace | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'full' | 'minimal'>('full');
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite'>('standard');
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [viewingHistoryIndex, setViewingHistoryIndex] = useState(0);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Load history
  useEffect(() => {
    const savedHistory = localStorage.getItem('latvia_explorer_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          const validHistory = parsed.filter((item: any) => 
            item && item.coords && !isNaN(item.coords.lat) && !isNaN(item.coords.lng)
          );
          setHistory(validHistory);
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('latvia_explorer_history', JSON.stringify(history));
  }, [history]);

  const loadPlace = useCallback(async (targetCoords?: Coordinates, targetName?: string) => {
    setLoading(true);
    setShowWelcome(false);
    setIsMenuOpen(false);
    
    setHoveredPlace(null);
    setLocationInfo(null);
    
    // Determine if this is a random search or a specific navigation
    const isRandomSearch = !targetCoords;
    
    // Set Loading Type: Full screen for random, Minimal for nearby/specific
    setLoadingType(isRandomSearch ? 'full' : 'minimal');

    const searchCoords = targetCoords || generateRandomLatviaCoordinates();
    
    if (!searchCoords || isNaN(searchCoords.lat) || isNaN(searchCoords.lng)) {
        setLoading(false);
        return;
    }

    if (isRandomSearch) {
        // HIDE pin immediately for random search
        setPinLocation(null);
        // Do NOT change viewState yet - wait for result
    } else {
        // For nearby places, we temporarily show the pin at the expected location
        // The AI will refine this shortly
        setPinLocation(searchCoords);
        setViewState({ center: searchCoords, zoom: 14 });
    }

    try {
      // Fetch info. If targetName is provided, AI will search specifically for that place's real coords
      const info = await fetchLocationDetails(searchCoords, targetName, selectedFilters) as LocationInfo & { exactCoordinates?: Coordinates };
      
      // PREFER the Exact Coordinates found by AI Search over the random/estimated ones
      const finalCoords = info.exactCoordinates || searchCoords;
      
      setLocationInfo(info);
      setPinLocation(finalCoords);
      setViewState({ center: finalCoords, zoom: 15 }); // Closer zoom for precise location

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        coords: finalCoords,
        info: info
      };
      
      setHistory(prev => [newItem, ...prev].slice(0, 50));
      setViewingHistoryIndex(0);

    } catch (error) {
      console.error("Failed to fetch info", error);
      // If failed, and we were searching randomly, ensure we don't leave a ghost state
      if (isRandomSearch) {
        setPinLocation(null);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedFilters]);

  const handleGenerateRandom = () => loadPlace();

  const handleNavigateToPlace = (place: NearbyPlace) => {
    // When navigating to a nearby place, we pass its name so the AI performs a new Search for it
    loadPlace(place.coordinates, place.name);
  };

  const handleBack = () => {
    const nextIndex = viewingHistoryIndex + 1;
    if (nextIndex < history.length) {
        setViewingHistoryIndex(nextIndex);
        restoreHistoryItem(history[nextIndex], false);
    }
  };

  const restoreHistoryItem = (item: HistoryItem, updateIndex = true) => {
    if (!item.coords || isNaN(item.coords.lat) || isNaN(item.coords.lng)) return;
    
    setPinLocation(item.coords);
    setLocationInfo(item.info);
    setViewState({ center: item.coords, zoom: 14 });
    setShowWelcome(false);
    setIsMenuOpen(false);
    setHoveredPlace(null);

    if (updateIndex) {
        const index = history.findIndex(h => h.id === item.id);
        if (index !== -1) setViewingHistoryIndex(index);
    }
  };

  const clearHistory = () => {
    if(confirm("Vai tiešām dzēst vēsturi?")) {
        setHistory([]);
        setViewingHistoryIndex(0);
        setLocationInfo(null);
        setPinLocation(null);
        setShowWelcome(true);
    }
  };

  const handleToggleFilter = (filter: string) => {
    setSelectedFilters(prev => {
        if (prev.includes(filter)) return prev.filter(f => f !== filter);
        return [...prev, filter];
    });
  };

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('lv-LV', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    }).format(new Date(ts));
  };

  const canGoBack = history.length > 0 && viewingHistoryIndex < history.length - 1;

  // Components for buttons to reuse
  const FilterButton = ({ onClick, className }: { onClick: (e: any) => void, className?: string }) => (
    <button 
        onClick={onClick}
        className={`
            backdrop-blur-md p-3 rounded-full shadow-lg hover:shadow-xl transition-all border border-slate-100 relative
            ${isFilterOpen || selectedFilters.length > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white/90 text-slate-700 hover:bg-white'}
            ${className}
        `}
    >
        <SlidersHorizontal className="w-6 h-6" />
        {selectedFilters.length > 0 && !isFilterOpen && (
             <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#A4343A] text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {selectedFilters.length}
             </span>
        )}
    </button>
  );

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans text-gray-900 bg-gray-100">
      {/* Background Map */}
      <div className="absolute inset-0 z-0">
        <Map 
          center={viewState.center} 
          zoom={viewState.zoom} 
          pinLocation={pinLocation} 
          hoveredPlace={hoveredPlace}
          mapStyle={mapStyle}
        />
      </div>

      {/* Loading Overlay with Type */}
      {loading && <LoadingOverlay type={loadingType} />}

      {/* Filter Backdrop - Click outside to close */}
      {isFilterOpen && (
        <div 
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsFilterOpen(false)}
        />
      )}

      {/* Filter Bar */}
      <FilterBar 
        isOpen={isFilterOpen}
        selectedFilters={selectedFilters}
        onToggleFilter={handleToggleFilter}
        onClearFilters={() => setSelectedFilters([])}
        onClose={() => setIsFilterOpen(false)}
      />

      {/* Top Left - Logo */}
      <div className={`absolute top-6 left-6 z-40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}>
         <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-white/50">
           <Logo />
         </div>
      </div>

      {/* Top Left - Back Button (DESKTOP ONLY) */}
      {canGoBack && !loading && (
        <div className="hidden md:flex absolute top-28 left-6 z-30 animate-in fade-in slide-in-from-left-4 duration-300">
            <button 
                onClick={handleBack}
                className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:bg-white transition-all border border-slate-100 text-slate-700 flex items-center gap-2 font-semibold text-xs group"
            >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Atpakaļ
            </button>
        </div>
      )}

      {/* Top Right Buttons Group (Mobile & Desktop) */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-3 md:gap-3">
        
        {/* Mobile: Back Button */}
        {canGoBack && !loading && (
             <button
                onClick={handleBack}
                className="md:hidden bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:shadow-xl text-slate-700 hover:bg-white active:scale-95 transition-all border border-slate-100"
                aria-label="Atpakaļ"
             >
                <ChevronLeft className="w-6 h-6" />
             </button>
        )}

        {/* Mobile: Random Button (Small) */}
        <button
          onClick={handleGenerateRandom}
          disabled={loading}
          aria-label="Atklāt nejaušu vietu"
          style={{ backgroundColor: '#A4343A' }}
          className={`
            md:hidden group relative flex items-center justify-center p-3 rounded-full 
            text-white shadow-lg shadow-red-900/20
            transition-all duration-300 active:scale-95 border border-red-800/20
            ${loading ? 'cursor-not-allowed opacity-80' : 'hover:brightness-110'}
          `}
        >
          {loading ? (
             <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
             <Dices className="w-6 h-6" />
          )}
        </button>

        {/* Both: Filter Button */}
        <FilterButton 
            onClick={(e) => {
                e.stopPropagation();
                setIsFilterOpen(!isFilterOpen);
            }} 
        />
        
        {/* Both: Menu Button */}
        <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:shadow-xl hover:bg-white transition-all border border-slate-100 text-slate-700"
        >
            <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop Bottom Right: Big Random Button */}
      <div className="hidden md:flex absolute bottom-12 right-12 z-40">
        <button
          onClick={handleGenerateRandom}
          disabled={loading}
          aria-label="Atklāt nejaušu vietu"
          style={{ backgroundColor: '#A4343A' }}
          className={`
            group relative flex items-center justify-center px-8 py-4 gap-3
            rounded-full text-white font-bold shadow-xl shadow-red-900/20
            transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl active:scale-95
            ${loading ? 'cursor-not-allowed opacity-80' : 'hover:brightness-110'}
          `}
        >
          {loading ? (
             <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
             <Dices className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
          )}
          <span className="text-lg">{loading ? 'Ceļojam...' : selectedFilters.length > 0 ? 'Meklēt filtrēto' : 'Atklāt Nejaušu Vietu'}</span>
        </button>
      </div>

      {/* History Sidebar */}
      <div className={`
        absolute top-0 right-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-white/50
        ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Vēsture
                </h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {history.length === 0 ? (
                    <div className="text-center text-slate-400 mt-10">
                        <p>Vēsture ir tukša.</p>
                        <p className="text-sm">Atklājiet jaunas vietas!</p>
                    </div>
                ) : (
                    history.map((item, index) => (
                        <div 
                            key={item.id}
                            onClick={() => restoreHistoryItem(item, true)}
                            className={`
                                border p-4 rounded-xl shadow-sm transition-all cursor-pointer group
                                ${index === viewingHistoryIndex && !showWelcome ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-slate-100 hover:shadow-md hover:border-indigo-200'}
                            `}
                        >
                            <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600">{item.info.title}</h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.info.description}</p>
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">
                                    {String(item.info.type)}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                    {formatDate(item.timestamp)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {/* Sidebar Bottom Controls */}
            <div className="p-4 border-t border-slate-100 bg-white/50 flex flex-col gap-3">
                <div className="flex bg-slate-100 rounded-lg p-1 relative">
                    <div className={`absolute inset-y-1 w-1/2 bg-white shadow rounded-md transition-all duration-300 ${mapStyle === 'standard' ? 'left-1' : 'left-[calc(50%-4px)] translate-x-1'}`} />
                    <button 
                        onClick={() => setMapStyle('standard')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold relative z-10 transition-colors ${mapStyle === 'standard' ? 'text-slate-900' : 'text-slate-500'}`}
                    >
                        <MapIcon className="w-3 h-3" />
                        Karte
                    </button>
                    <button 
                        onClick={() => setMapStyle('satellite')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold relative z-10 transition-colors ${mapStyle === 'satellite' ? 'text-slate-900' : 'text-slate-500'}`}
                    >
                        <Satellite className="w-3 h-3" />
                        Satelīts
                    </button>
                </div>

                {history.length > 0 && (
                    <button 
                        onClick={clearHistory}
                        className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-[#A4343A] hover:bg-red-50 py-3 rounded-xl transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Dzēst vēsturi
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* Overlay to close menu */}
      {isMenuOpen && (
        <div 
            className="absolute inset-0 bg-black/20 z-40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Floating UI Layer */}
      <div className={`absolute inset-0 z-10 pointer-events-none flex flex-col justify-end md:justify-center md:items-start transition-opacity duration-300 md:pt-24 ${isMenuOpen ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
        
        {/* Welcome Card */}
        {showWelcome && (
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md p-8 m-6 rounded-3xl shadow-2xl max-w-md animate-in fade-in slide-in-from-left-5 duration-700 border border-white/20 mt-20 md:mt-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#A4343A] p-2.5 rounded-xl shadow-lg">
                <Compass className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Latklājējs
              </h1>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Atklājiet Latvijas apslēptās pērles. Nospiediet pogu, lai teleportētos uz nejaušu vietu un ļautu mākslīgajam intelektam pastāstīt tās stāstu.
            </p>
            <div className="flex gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-100">
                  Gemini AI
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100">
                  OpenStreetMap
                </span>
            </div>
          </div>
        )}

        {/* Location Info Card */}
        {!loading && locationInfo && pinLocation && (
          <div className={`pointer-events-auto w-full md:max-w-md md:m-12`}>
            <InfoCard 
              info={locationInfo} 
              coords={pinLocation} 
              onClose={() => setLocationInfo(null)}
              onHoverPlace={setHoveredPlace}
              onNavigateToPlace={handleNavigateToPlace}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default App;