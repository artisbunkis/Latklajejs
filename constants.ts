// Latvia approximate bounds for random generation
// We use a simplified set of bounds to keep points mostly within the country
export const LATVIA_BOUNDS = {
  minLat: 55.7,
  maxLat: 57.8,
  minLng: 21.0,
  maxLng: 28.0,
};

export const INITIAL_VIEW = {
  lat: 56.9496, // Riga
  lng: 24.1052,
  zoom: 7,
};

export const MAP_TILE_LAYER = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
export const MAP_SATELLITE_LAYER = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
export const MAP_SATELLITE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

export interface CategoryStyle {
  label: string; // Display name
  color: string; // Hex for Map Marker
  bgClass: string; // Tailwind bg for icon
  textClass: string; // Tailwind text for icon
  gradient: string; // Header gradient
}

export const CATEGORY_CONFIG: Record<string, CategoryStyle> = {
  'Forest': { label: 'Mežs', color: '#166534', bgClass: 'bg-green-50', textClass: 'text-green-700', gradient: 'from-emerald-900 to-green-800' },
  'Nature': { label: 'Daba', color: '#166534', bgClass: 'bg-green-50', textClass: 'text-green-700', gradient: 'from-emerald-900 to-green-800' },
  'Field': { label: 'Lauks', color: '#854d0e', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700', gradient: 'from-yellow-800 to-amber-700' },
  'Lake': { label: 'Ezers', color: '#1e40af', bgClass: 'bg-blue-50', textClass: 'text-blue-700', gradient: 'from-blue-900 to-cyan-700' },
  'River': { label: 'Upe', color: '#3730a3', bgClass: 'bg-indigo-50', textClass: 'text-indigo-700', gradient: 'from-indigo-900 to-blue-700' },
  'Sea': { label: 'Jūra', color: '#0e7490', bgClass: 'bg-cyan-50', textClass: 'text-cyan-700', gradient: 'from-sky-950 to-cyan-800' },
  'City': { label: 'Pilsēta', color: '#334155', bgClass: 'bg-slate-50', textClass: 'text-slate-700', gradient: 'from-slate-900 to-gray-700' },
  'Village': { label: 'Ciemats', color: '#7c2d12', bgClass: 'bg-orange-50', textClass: 'text-orange-700', gradient: 'from-orange-950 to-amber-900' },
  
  // Historical / Cultural
  'Castle': { label: 'Pils', color: '#7e22ce', bgClass: 'bg-purple-50', textClass: 'text-purple-700', gradient: 'from-purple-950 to-fuchsia-900' },
  'Manor': { label: 'Muiža', color: '#be185d', bgClass: 'bg-pink-50', textClass: 'text-pink-700', gradient: 'from-pink-950 to-rose-900' },
  'Ruins': { label: 'Drupas', color: '#57534e', bgClass: 'bg-stone-100', textClass: 'text-stone-600', gradient: 'from-stone-800 to-stone-600' },
  'Museum': { label: 'Muzejs', color: '#be123c', bgClass: 'bg-rose-50', textClass: 'text-rose-700', gradient: 'from-rose-950 to-red-900' },
  'Church': { label: 'Baznīca', color: '#44403c', bgClass: 'bg-stone-50', textClass: 'text-stone-700', gradient: 'from-stone-900 to-stone-700' },
  
  // Tourism Objects
  'Tower': { label: 'Tornis', color: '#ea580c', bgClass: 'bg-orange-50', textClass: 'text-orange-600', gradient: 'from-orange-900 to-red-700' },
  'Trail': { label: 'Taka', color: '#3f6212', bgClass: 'bg-lime-50', textClass: 'text-lime-700', gradient: 'from-lime-900 to-green-700' },
  'Hill': { label: 'Kalns', color: '#365314', bgClass: 'bg-green-100', textClass: 'text-green-800', gradient: 'from-green-950 to-emerald-900' },
  
  'Cafe': { label: 'Kafejnīca', color: '#c2410c', bgClass: 'bg-orange-50', textClass: 'text-orange-700', gradient: 'from-orange-950 to-orange-800' },
  'Other': { label: 'Cits', color: '#475569', bgClass: 'bg-gray-50', textClass: 'text-gray-700', gradient: 'from-gray-900 to-slate-700' },
};

export const getCategoryStyle = (type: string): CategoryStyle => {
  // Normalize type to match keys
  const key = Object.keys(CATEGORY_CONFIG).find(k => k.toLowerCase() === type.toLowerCase());
  return CATEGORY_CONFIG[key || 'Other'];
};

// Filter categories (ordered for UI)
export const FILTER_CATEGORIES = [
  'Manor', 'Castle', 'Ruins', 
  'Tower', 'Trail', 'Hill',
  'Lake', 'River', 'Sea', 
  'Forest', 'Nature', 'Field',
  'Museum', 'Church', 'Cafe',
  'City', 'Village'
];