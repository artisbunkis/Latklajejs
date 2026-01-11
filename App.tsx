import React, { useState, useCallback, useEffect } from 'react';
import { Compass, Loader2, Menu, Clock, Trash2, ArrowRight, ChevronLeft, Dices, SlidersHorizontal, Map as MapIcon, Satellite, AlertCircle, X } from 'lucide-react';
import Map from './components/Map';
import InfoCard from './components/InfoCard';
import FilterBar from './components/FilterBar';
import Logo from './components/Logo';
import LoadingOverlay from './components/LoadingOverlay';
import HistoryMenu from './components/HistoryMenu';
import { generateRandomLatviaCoordinates, isValidCoord } from './utils/geo'; // Import isValidCoord
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
  const [error, setError] = useState<string | null>(null);
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false); // New state for first interaction
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite'>('standard');
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [viewingHistoryIndex, setViewingHistoryIndex] = useState(0);

  // Added missing state declarations
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
            item && item.coords && isValidCoord(item.coords) // Use isValidCoord here too for historical data
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
    setError(null);
    setShowWelcome(false);
    setIsMenuOpen(false);
    setHasInteracted(true); // Mark as interacted
    
    setHoveredPlace(null);
    setLocationInfo(null);
    
    const isRandomSearch = !targetCoords && !targetName;
    setLoadingType(isRandomSearch || targetName ? 'full' : 'minimal');

    // If searching by name, we might not have coords yet, so generate a placeholder
    // The Gemini service will use the name to find real coords and ignore these
    const searchCoords = targetCoords || generateRandomLatviaCoordinates();
    
    if (!searchCoords || !isValidCoord(searchCoords)) { // Use isValidCoord for searchCoords validation
        setLoading(false);
        setError("Nederīgas koordinātas.");
        return;
    }

    if (!isRandomSearch && !targetName) {
        // If clicking a map pin/nearby place, zoom immediately
        setPinLocation(searchCoords);
        setViewState({ center: searchCoords, zoom: 14 });
    } else {
        // For random or text search, clear pin initially
        setPinLocation(null);
    }

    try {
      const info = await fetchLocationDetails(searchCoords, targetName, selectedFilters) as LocationInfo & { exactCoordinates?: Coordinates };
      
      // Use the exact coordinates from the AI if available AND VALID, otherwise fallback to searchCoords
      const finalCoords = (info.exactCoordinates && isValidCoord(info.exactCoordinates)) ? info.exactCoordinates : searchCoords;
      
      setLocationInfo(info);
      setPinLocation(finalCoords);
      setViewState({ center: finalCoords, zoom: 15 });

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        coords: finalCoords,
        info: info
      };
      
      setHistory(prev => [newItem, ...prev].slice(0, 50));
      setViewingHistoryIndex(0);

    } catch (error: any) {
      console.error("Failed to fetch info", error);
      if (error.message.includes("Kvota pārsniegta")) { // Check for the specific quota message from geminiService
        setError(error.message); 
      } else {
        setError("Neizdevās iegūt informāciju. Lūdzu, mēģiniet vēlreiz.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedFilters]); // Added selectedFilters to dependency array

  const handleGenerateRandom = () => {
    setIsFilterOpen(false);
    loadPlace();
  };

  const handleSearch = (query: string) => {
    loadPlace(undefined, query);
  };

  const handleNavigateToPlace = (place: NearbyPlace) => {
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
    if (!item.coords || !isValidCoord(item.coords)) return; // Use isValidCoord here too
    
    setPinLocation(item.coords);
    setLocationInfo(item.info);
    setViewState({ center: item.coords, zoom: 14 });
    setShowWelcome(false);
    setIsMenuOpen(false);
    setHoveredPlace(null);
    setError(null);

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
        setError(null);
    }
  };

  const handleHome = () => {
    // Returns to main screen but keeps history and filters
    setPinLocation(null);
    setLocationInfo(null);
    setHoveredPlace(null);
    setError(null);
    setShowWelcome(true);
    setViewState({ center: { lat: INITIAL_VIEW.lat, lng: INITIAL_VIEW.lng }, zoom: INITIAL_VIEW.zoom });
  };

  const handleToggleFilter = (filter: string) => {
    setSelectedFilters(prev => {
        if (prev.includes(filter)) return prev.filter(f => f !== filter);
        return [...prev, filter];
    });
  };

  const canGoBack = history.length > 0 && viewingHistoryIndex < history.length - 1;

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

  const RATE_LIMIT_URL = "https://ai.google.dev/gemini-api/docs/rate-limits";

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans text-gray-900 bg-gray-100">
      <div className="absolute inset-0 z-0">
        <Map 
          center={viewState.center} 
          zoom={viewState.zoom} 
          pinLocation={pinLocation} 
          hoveredPlace={hoveredPlace}
          mapStyle={mapStyle}
        />
      </div>

      {loading && <LoadingOverlay type={loadingType} />}

      {/* Overlays for Menu & Filter */}
      {isFilterOpen && (
        <div 
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsFilterOpen(false)}
        />
      )}

      {/* History Menu Slide-In */}
      <HistoryMenu 
        isOpen={isMenuOpen}
        history={history}
        mapStyle={mapStyle}
        onSetMapStyle={setMapStyle}
        onClose={() => setIsMenuOpen(false)}
        onRestore={restoreHistoryItem}
        onClear={clearHistory}
        onSearch={handleSearch}
      />

      <FilterBar 
        isOpen={isFilterOpen}
        selectedFilters={selectedFilters}
        onToggleFilter={handleToggleFilter}
        onClearFilters={() => setSelectedFilters([])}
        onClose={() => setIsFilterOpen(false)}
      />

      {/* Logo Home Button */}
      <div 
        className={`absolute top-6 left-6 z-40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}
      >
         <button 
           onClick={handleHome}
           className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-white/50 hover:bg-white transition-all active:scale-95 text-left"
           title="Sākums"
         >
           <Logo />
         </button>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-3 md:gap-3">
        {canGoBack && !loading && (
             <button
                onClick={handleBack}
                className="md:hidden bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:shadow-xl text-slate-700 hover:bg-white active:scale-95 transition-all border border-slate-100"
                aria-label="Atpakaļ"
             >
                <ChevronLeft className="w-6 h-6" />
             </button>
        )}

        <button
          onClick={handleGenerateRandom}
          disabled={loading}
          aria-label="Atklāt nejaušu vietu"
          className={`
            md:hidden group relative flex items-center justify-center p-3 rounded-full 
            text-black shadow-lg
            transition-all duration-300 active:scale-95
            ${loading ? 'cursor-not-allowed opacity-80' : ''}
            google-ai-glow /* Always apply glow */
          `}
        >
          {loading ? (
             <Loader2 className="w-6 h-6 animate-spin text-black" />
          ) : (
             <Dices className="w-6 h-6 text-black" />
          )}
        </button>

        <FilterButton 
            onClick={(e) => {
                e.stopPropagation();
                setIsFilterOpen(!isFilterOpen);
            }} 
        />
        
        <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:shadow-xl hover:bg-white transition-all border border-slate-100 text-slate-700"
        >
            <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop Main CTA */}
      <div className="hidden md:flex absolute bottom-12 right-12 z-40">
        <button
          onClick={handleGenerateRandom}
          disabled={loading}
          aria-label="Atklāt nejaušu vietu"
          className={`
            group relative flex items-center justify-center px-8 py-4 gap-3
            rounded-full text-black font-bold shadow-xl 
            transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl active:scale-95
            ${loading ? 'cursor-not-allowed opacity-80' : ''}
            google-ai-glow /* Always apply glow */
          `}
        >
          {loading ? (
             <Loader2 className="w-6 h-6 animate-spin text-black" />
          ) : (
             <Dices className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700 text-black" />
          )}
          <span className="text-lg text-black">{loading ? 'Ceļojam...' : selectedFilters.length > 0 ? 'Meklēt filtrēto' : 'Atklāt Nejaušu Vietu'}</span>
        </button>
      </div>

      {/* Error Message Display */}
      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 p-4 bg-red-600 text-white rounded-xl shadow-lg border border-red-700 text-sm font-medium animate-in fade-in slide-in-from-bottom-5 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1">
            {error.includes("Kvota pārsniegta") ? (
                <>
                    Kvota pārsniegta. Lūdzu, pārbaudiet savu Gemini API plānu un norēķinu informāciju:{" "}
                    <a 
                        href={RATE_LIMIT_URL} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="underline text-blue-200 hover:text-blue-100 font-semibold"
                        onClick={(e) => e.stopPropagation()} // Prevent dismissing error when clicking link
                    >
                        {RATE_LIMIT_URL}
                    </a>
                </>
            ) : (
                error
            )}
          </span>
          <button 
            onClick={() => setError(null)}
            className="p-1 rounded-full hover:bg-red-700 transition-colors shrink-0"
            aria-label="Aizvērt paziņojumu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className={`
        absolute inset-0 z-10 pointer-events-none 
        flex flex-col 
        transition-opacity duration-300 
        ${isMenuOpen ? 'opacity-50 blur-sm' : 'opacity-100'} 
        /* 
           Layout Logic:
           - Mobile: 'justify-end' pushes content to bottom.
           - Desktop: 'md:justify-center' centers content vertically if welcome.
                      'md:justify-center md:pt-32' positions info card.
        */
        justify-end 
        md:items-start md:pl-12 md:pr-12 
        ${showWelcome ? 'md:justify-center' : 'md:justify-center md:pt-32 md:pb-12'}
      `}>
        
        {showWelcome && (
          <div className={`
            pointer-events-auto bg-white/90 backdrop-blur-md p-8 m-6 rounded-3xl shadow-2xl max-w-md animate-in fade-in slide-in-from-left-5 duration-700 border border-white/20 
            /* Mobile adjustment: Ensure it sits at bottom with margin */
            mb-12 md:mb-0 md:mt-0
          `}>
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

        {!loading && locationInfo && pinLocation && (
          <div className={`pointer-events-none w-full md:max-w-md md:m-0`}>
            <InfoCard 
              info={locationInfo} 
              coords={pinLocation} 
              onClose={() => setLocationInfo(null)}
              onHoverPlace={setHoveredPlace}
              onNavigateToPlace={handleNavigateToPlace}
              onBack={canGoBack ? handleBack : undefined}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default App;