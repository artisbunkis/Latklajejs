import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Coordinates, NearbyPlace } from '../types';
import { MAP_ATTRIBUTION, MAP_TILE_LAYER, MAP_SATELLITE_LAYER, MAP_SATELLITE_ATTRIBUTION, getCategoryStyle } from '../constants';
import { isValidCoord } from '../utils/geo'; // Import isValidCoord

interface MapProps {
  center: Coordinates;
  zoom: number;
  pinLocation: Coordinates | null;
  hoveredPlace?: NearbyPlace | null;
  onMapReady?: () => void;
  mapStyle?: 'standard' | 'satellite';
}

const Map: React.FC<MapProps> = ({ center, zoom, pinLocation, hoveredPlace, mapStyle = 'standard' }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const hoverMarkerRef = useRef<L.Marker | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Removed local isValidCoord as it's now imported from utils/geo.ts

  const inferCategoryFromText = (type: string): string => {
    const t = type.toLowerCase();
    if (t.includes('mežs') || t.includes('forest')) return 'Forest';
    if (t.includes('ezers') || t.includes('lake')) return 'Lake';
    if (t.includes('upe') || t.includes('river')) return 'River';
    if (t.includes('pils') || t.includes('castle')) return 'Castle';
    if (t.includes('baznīca') || t.includes('church')) return 'Church';
    if (t.includes('kafejnīca') || t.includes('cafe')) return 'Cafe';
    if (t.includes('muzejs') || t.includes('museum')) return 'Museum';
    return 'Other';
  }

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const safeLat = isValidCoord(center) ? center.lat : 56.9496;
    const safeLng = isValidCoord(center) ? center.lng : 24.1052;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false, 
      attributionControl: false
    }).setView([safeLat, safeLng], zoom);

    // Initial Tile Layer
    const layerUrl = mapStyle === 'satellite' ? MAP_SATELLITE_LAYER : MAP_TILE_LAYER;
    const attribution = mapStyle === 'satellite' ? MAP_SATELLITE_ATTRIBUTION : MAP_ATTRIBUTION;

    tileLayerRef.current = L.tileLayer(layerUrl, {
      maxZoom: 19,
    }).addTo(map);

    L.control.attribution({ position: 'bottomright' }).setPrefix(attribution).addTo(map);
    
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Style Change
  useEffect(() => {
     if (!mapInstanceRef.current || !tileLayerRef.current) return;
     
     const layerUrl = mapStyle === 'satellite' ? MAP_SATELLITE_LAYER : MAP_TILE_LAYER;
     const attribution = mapStyle === 'satellite' ? MAP_SATELLITE_ATTRIBUTION : MAP_ATTRIBUTION;

     tileLayerRef.current.setUrl(layerUrl);
     mapInstanceRef.current.attributionControl.setPrefix(attribution);
  }, [mapStyle]);

  // Handle View Updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const isDesktop = windowSize.width >= 768; 
    const desktopSidebarWidth = 520; 
    const mobileBottomPadding = windowSize.height * 0.60; 

    if (hoveredPlace && isValidCoord(hoveredPlace.coordinates) && isValidCoord(pinLocation)) {
        const bounds = L.latLngBounds(
            [pinLocation!.lat, pinLocation!.lng],
            [hoveredPlace.coordinates.lat, hoveredPlace.coordinates.lng]
        );
        map.flyToBounds(bounds, {
            paddingTopLeft: isDesktop ? [desktopSidebarWidth, 50] : [50, 50],
            paddingBottomRight: isDesktop ? [50, 50] : [50, mobileBottomPadding],
            maxZoom: 15,
            duration: 0.8,
            animate: true
        });
    } else if (isValidCoord(center)) {
        const targetZoom = zoom;
        const targetPoint = map.project([center.lat, center.lng], targetZoom);
        
        let offsetX = 0;
        let offsetY = 0;

        if (isDesktop) {
            offsetX = -(desktopSidebarWidth / 2.5); 
        } else {
            offsetY = (mobileBottomPadding / 2); 
        }

        const newTargetPoint = targetPoint.add([offsetX, offsetY]);
        const newCenter = map.unproject(newTargetPoint, targetZoom);

        map.flyTo(newCenter, targetZoom, {
            duration: 1.5,
            easeLinearity: 0.25
        });
    }
  }, [center, zoom, hoveredPlace, pinLocation, windowSize]);

  // Handle Main Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isValidCoord(pinLocation) && pinLocation) {
      if (markerRef.current) {
        markerRef.current.setLatLng([pinLocation.lat, pinLocation.lng]);
      } else {
        const customIcon = L.divIcon({
          className: 'custom-pin-container',
          html: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="#A4343A" stroke="#5c1a1e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.5));">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
              <circle cx="12" cy="9" r="3" fill="white"></circle>
            </svg>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40]
        });

        markerRef.current = L.marker([pinLocation.lat, pinLocation.lng], { icon: customIcon }).addTo(map);
      }
    } else {
       if (markerRef.current) {
         markerRef.current.remove();
         markerRef.current = null;
       }
    }
  }, [pinLocation]);

  // Handle Hover Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (hoveredPlace && isValidCoord(hoveredPlace.coordinates)) {
      const category = inferCategoryFromText(hoveredPlace.type);
      const style = getCategoryStyle(category);

      const svgHtml = `
         <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full animate-ping opacity-75" style="background-color: ${style.color}"></div>
            <div class="relative w-4 h-4 border-2 border-white rounded-full shadow-md" style="background-color: ${style.color}"></div>
         </div>
      `;

      if (hoverMarkerRef.current) {
        hoverMarkerRef.current.setLatLng([hoveredPlace.coordinates.lat, hoveredPlace.coordinates.lng]);
        const newIcon = L.divIcon({
            className: 'hover-marker-container',
            html: svgHtml,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
        hoverMarkerRef.current.setIcon(newIcon);

      } else {
        const hoverIcon = L.divIcon({
          className: 'hover-marker-container',
          html: svgHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        hoverMarkerRef.current = L.marker([hoveredPlace.coordinates.lat, hoveredPlace.coordinates.lng], { 
          icon: hoverIcon,
          zIndexOffset: 1000 
        }).addTo(map);
      }
    } else {
      if (hoverMarkerRef.current) {
        hoverMarkerRef.current.remove();
        hoverMarkerRef.current = null;
      }
    }
  }, [hoveredPlace]);

  return (
    <div className="w-full h-full min-h-screen bg-gray-100 relative z-0">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};

export default Map;