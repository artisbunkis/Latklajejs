

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface NearbyPlace {
  name: string;
  type: string;
  distance: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export type LocationType = 
  | 'Lake' | 'River' | 'Sea' | 'Forest' | 'Field' | 'Nature'
  | 'City' | 'Village' 
  | 'Castle' | 'Manor' | 'Ruins' 
  | 'Museum' | 'Church' | 'Tower' | 'Trail' | 'Hill'
  | 'Cafe' | 'Other';

export type Region = 'Kurzeme' | 'Vidzeme' | 'Latgale' | 'Zemgale' | 'Sēlija' | 'Rīga' | null;

export interface Fact {
  text: string;
  sourceUrl?: string;
}

export interface LocationInfo {
  title: string;
  description: string;
  facts: Fact[]; // Updated from string[]
  nearbyPlaces: NearbyPlace[];
  type: LocationType;
  region: Region;
  sources?: { uri: string; title: string }[];
  exactCoordinates?: Coordinates;
  website?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  coords: Coordinates;
  info: LocationInfo;
}

export interface MapState {
  center: Coordinates;
  zoom: number;
}