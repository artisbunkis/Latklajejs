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

export interface LocationInfo {
  title: string;
  description: string;
  facts: string[];
  nearbyPlaces: NearbyPlace[];
  type: LocationType;
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