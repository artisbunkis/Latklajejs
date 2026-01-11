import { Coordinates } from "../types";

// High-precision Polygon of Latvia
// Traces the border more accurately to prevent points landing in Belarus, Russia, Estonia, or Lithuania.
export const LATVIA_POLYGON: [number, number][] = [
  // North (Estonia Border)
  [57.87, 24.35], // Ainaži
  [57.85, 25.00], // Mazsalaca area
  [57.60, 26.00], // Valmiera/Valka indent
  [57.75, 26.10], // Valka
  [57.50, 26.70], // Ape
  [57.55, 27.40], // Alūksne area (border creates a tip)
  
  // East (Russia Border)
  [57.40, 27.70], // Viļaka area
  [56.90, 28.10], // Kārsava area
  [56.60, 28.10], // Ludza area
  [56.40, 28.25], // Zilupe (Extreme East)
  
  // South-East (Belarus Border - The problematic area)
  [56.15, 28.15], // South of Zilupe
  [55.90, 27.60], // Piedruja/Krāslava area
  [55.80, 27.00], // Daugavpils distinct southern curve
  [55.67, 26.60], // Demene (Southernmost point)
  
  // South (Lithuania Border)
  [56.00, 26.00], // Subate area
  [56.10, 25.50], // Nereta
  [56.30, 24.50], // Bauska area
  [56.40, 24.10], // Bauska/Eleja
  [56.35, 23.30], // Auce/Dobele border
  [56.25, 22.50], // Mažeikiai border (LT side)
  [56.40, 22.10], // Saldus/Ezere area
  [56.15, 21.30], // Skuodas border
  [56.05, 21.05], // Rucava (SW Corner)
  
  // West (Baltic Sea Coast)
  [56.50, 21.00], // Liepāja
  [57.00, 21.00], // Pāvilosta
  [57.40, 21.55], // Ventspils
  [57.75, 22.60], // Kolka (Cape)
  
  // Gulf of Riga Coast
  [57.35, 22.90], // Roja
  [57.33, 23.12], // Mērsrags
  [57.05, 23.20], // Engure
  [56.95, 23.60], // Jūrmala
  [57.03, 24.03], // Rīga (Daugava mouth)
  [57.15, 24.40], // Saulkrasti
];

// Ray casting algorithm to check if point is inside polygon
export function isPointInPolygon(point: Coordinates, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    const intersect = ((yi > point.lng) !== (yj > point.lng))
        && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export const generateRandomLatviaCoordinates = (): Coordinates => {
  let validPoint = false;
  let coords: Coordinates = { lat: 0, lng: 0 };
  
  // Slightly tighter bounds to avoid edge cases near the bounding box limits
  const bounds = { minLat: 55.70, maxLat: 57.85, minLng: 21.05, maxLng: 28.20 };

  // Increase attempts significantly to ensure valid point
  let attempts = 0;
  while (!validPoint && attempts < 500) {
    const lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
    const lng = bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng);
    
    if (isPointInPolygon({ lat, lng }, LATVIA_POLYGON)) {
      coords = { lat, lng };
      validPoint = true;
    }
    attempts++;
  }

  // Fallback to Sigulda (central, interesting) if algorithm fails
  if (!validPoint) {
    console.warn("Could not generate random point inside polygon after 500 attempts.");
    return { lat: 57.1537, lng: 24.8505 };
  }

  return coords;
};

// Calculate distance between two points in km (Haversine formula)
export const calculateDistance = (start: Coordinates, end: Coordinates): string => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(end.lat - start.lat);
  const dLng = deg2rad(end.lng - start.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(start.lat)) * Math.cos(deg2rad(end.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  
  if (d < 1) {
    return (d * 1000).toFixed(0) + " m";
  }
  return d.toFixed(1) + " km";
};

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}