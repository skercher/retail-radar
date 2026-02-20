'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindowF,
  MarkerClustererF,
} from '@react-google-maps/api';
import { Property } from '@/types/property';
import { Locate, Plus, Minus, Layers, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES } from '@/lib/google-maps';

interface PropertyMapProps {
  properties: Property[];
  selectedProperty?: Property | null;
  onPropertySelect?: (property: Property) => void;
  onBoundsChange?: (bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => void;
  onSearchArea?: (bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => void;
  searchCenter?: { lat: number; lng: number } | null;
  fullScreen?: boolean;
}

// Dark mode map style
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b8b8b' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d4d4d4' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2c2c2c' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1d1d1d' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3c3c3c' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f1f1f' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#b0b0b0' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f2f2f' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1626' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
];

// Satellite style (no custom styling)
const satelliteMapTypeId = 'hybrid';

// Create custom marker icon SVG
function createMarkerSvg(score: number, isSelected: boolean): string {
  const bgColor = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#6b7280';
  const size = isSelected ? 48 : 40;
  const borderColor = isSelected ? '#3b82f6' : 'white';
  const borderWidth = isSelected ? 4 : 3;
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - borderWidth/2}" fill="${bgColor}" stroke="${borderColor}" stroke-width="${borderWidth}"/>
      <text x="${size/2}" y="${size/2 + 5}" text-anchor="middle" fill="white" font-size="${isSelected ? 14 : 12}" font-weight="700" font-family="system-ui, sans-serif">${score}</text>
    </svg>
  `)}`;
}

// Cluster styles
const clusterStyles = [
  {
    textColor: 'white',
    textSize: 14,
    width: 44,
    height: 44,
    className: 'cluster-marker',
  },
];

export function PropertyMap({
  properties,
  selectedProperty,
  onPropertySelect,
  onBoundsChange,
  onSearchArea,
  searchCenter,
  fullScreen = false,
}: PropertyMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark');
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<{
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  } | null>(null);
  const [infoWindowProperty, setInfoWindowProperty] = useState<Property | null>(null);
  const lastSearchBounds = useRef<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const mapOptions = useMemo<google.maps.MapOptions>(() => ({
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: mapStyle === 'dark' ? darkMapStyle : undefined,
    mapTypeId: mapStyle === 'satellite' ? satelliteMapTypeId : 'roadmap',
    gestureHandling: 'greedy',
    minZoom: 3,
    maxZoom: 20,
  }), [mapStyle]);

  const defaultCenter = useMemo(() => ({ lat: 39.8283, lng: -98.5795 }), []);

  // Handle map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Handle bounds change
  const onBoundsChanged = useCallback(() => {
    if (!mapRef.current) return;
    
    const bounds = mapRef.current.getBounds();
    if (bounds) {
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const newBounds = {
        sw: { lat: sw.lat(), lng: sw.lng() },
        ne: { lat: ne.lat(), lng: ne.lng() },
      };
      setCurrentBounds(newBounds);
      onBoundsChange?.(newBounds);

      // Show "Search this area" button if bounds changed significantly
      const boundsKey = `${newBounds.sw.lat.toFixed(3)},${newBounds.sw.lng.toFixed(3)},${newBounds.ne.lat.toFixed(3)},${newBounds.ne.lng.toFixed(3)}`;
      if (lastSearchBounds.current && lastSearchBounds.current !== boundsKey) {
        setShowSearchButton(true);
      }
    }
  }, [onBoundsChange]);

  // Fly to selected property
  useEffect(() => {
    if (!mapRef.current || !selectedProperty) return;

    mapRef.current.panTo({
      lat: selectedProperty.latitude,
      lng: selectedProperty.longitude,
    });
    
    const currentZoom = mapRef.current.getZoom() || 10;
    if (currentZoom < 12) {
      mapRef.current.setZoom(12);
    }
  }, [selectedProperty]);

  // Handle search center changes
  useEffect(() => {
    if (!mapRef.current || !searchCenter) return;

    mapRef.current.panTo({ lat: searchCenter.lat, lng: searchCenter.lng });
    mapRef.current.setZoom(11);

    // Update search bounds after animation
    setTimeout(() => {
      if (mapRef.current) {
        const bounds = mapRef.current.getBounds();
        if (bounds) {
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          const newBounds = {
            sw: { lat: sw.lat(), lng: sw.lng() },
            ne: { lat: ne.lat(), lng: ne.lng() },
          };
          lastSearchBounds.current = `${newBounds.sw.lat.toFixed(3)},${newBounds.sw.lng.toFixed(3)},${newBounds.ne.lat.toFixed(3)},${newBounds.ne.lng.toFixed(3)}`;
          setShowSearchButton(false);
        }
      }
    }, 500);
  }, [searchCenter]);

  // Handle "Search this area" click
  const handleSearchArea = useCallback(() => {
    if (currentBounds && onSearchArea) {
      onSearchArea(currentBounds);
      lastSearchBounds.current = `${currentBounds.sw.lat.toFixed(3)},${currentBounds.sw.lng.toFixed(3)},${currentBounds.ne.lat.toFixed(3)},${currentBounds.ne.lng.toFixed(3)}`;
      setShowSearchButton(false);
    }
  }, [currentBounds, onSearchArea]);

  // Geolocation
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapRef.current?.panTo({ lat: latitude, lng: longitude });
        mapRef.current?.setZoom(10);
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  }, []);

  // Toggle map style
  const toggleStyle = useCallback(() => {
    setMapStyle(prev => prev === 'dark' ? 'satellite' : 'dark');
  }, []);

  // Zoom controls
  const handleZoom = useCallback((delta: number) => {
    if (!mapRef.current) return;
    const currentZoom = mapRef.current.getZoom() || 10;
    mapRef.current.setZoom(currentZoom + delta);
  }, []);

  // Handle marker click
  const handleMarkerClick = useCallback((property: Property) => {
    setInfoWindowProperty(property);
    onPropertySelect?.(property);
  }, [onPropertySelect]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-red-500">
        Error loading Google Maps
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-400">
        Loading map...
      </div>
    );
  }

  return (
    <div className={`relative w-full ${fullScreen ? 'h-full' : 'h-full'}`}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={defaultCenter}
        zoom={4}
        options={mapOptions}
        onLoad={onMapLoad}
        onIdle={onBoundsChanged}
      >
        {/* Property Markers with Clustering */}
        <MarkerClustererF
          averageCenter
          enableRetinaIcons
          gridSize={60}
          styles={[
            {
              url: `data:image/svg+xml,${encodeURIComponent(`
                <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#3b82f6"/>
                      <stop offset="100%" style="stop-color:#8b5cf6"/>
                    </linearGradient>
                  </defs>
                  <circle cx="22" cy="22" r="19" fill="url(#grad)" stroke="white" stroke-width="3"/>
                </svg>
              `)}`,
              height: 44,
              width: 44,
              textColor: 'white',
              textSize: 14,
              fontWeight: 'bold',
            },
          ]}
        >
          {(clusterer) => (
            <>
              {properties.map((property) => {
                const isSelected = selectedProperty?.id === property.id;
                return (
                  <MarkerF
                    key={property.id}
                    position={{ lat: property.latitude, lng: property.longitude }}
                    clusterer={clusterer}
                    icon={{
                      url: createMarkerSvg(property.upsideScore ?? 0, isSelected),
                      scaledSize: new google.maps.Size(isSelected ? 48 : 40, isSelected ? 48 : 40),
                      anchor: new google.maps.Point(isSelected ? 24 : 20, isSelected ? 24 : 20),
                    }}
                    onClick={() => handleMarkerClick(property)}
                    zIndex={isSelected ? 1000 : (property.upsideScore ?? 0)}
                  />
                );
              })}
            </>
          )}
        </MarkerClustererF>

        {/* Search Center Marker */}
        {searchCenter && (
          <MarkerF
            position={{ lat: searchCenter.lat, lng: searchCenter.lng }}
            icon={{
              url: `data:image/svg+xml,${encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="3"/>
                  <circle cx="12" cy="12" r="12" fill="rgba(59, 130, 246, 0.3)" stroke="none"/>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(24, 24),
              anchor: new google.maps.Point(12, 12),
            }}
            zIndex={500}
          />
        )}

        {/* Info Window for selected property */}
        {infoWindowProperty && (
          <InfoWindowF
            position={{ lat: infoWindowProperty.latitude, lng: infoWindowProperty.longitude }}
            onCloseClick={() => setInfoWindowProperty(null)}
            options={{ pixelOffset: new google.maps.Size(0, -20) }}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-zinc-900 text-sm">{infoWindowProperty.address}</h3>
              <p className="text-xs text-zinc-600 mt-1">
                {infoWindowProperty.city}, {infoWindowProperty.state}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  infoWindowProperty.upsideScore >= 75 ? 'bg-green-100 text-green-800' :
                  infoWindowProperty.upsideScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Score: {infoWindowProperty.upsideScore}
                </span>
                <span className="text-xs text-zinc-600">
                  ${infoWindowProperty.price?.toLocaleString() || 'N/A'}
                </span>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* Search This Area Button */}
      <AnimatePresence>
        {showSearchButton && onSearchArea && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
          >
            <button
              onClick={handleSearchArea}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg font-medium text-sm transition-colors"
            >
              <RefreshCw size={16} />
              Search this area
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={handleLocate}
          className="w-11 h-11 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-xl flex items-center justify-center text-white hover:bg-zinc-800 active:scale-95 transition-all shadow-lg"
          title="My Location"
        >
          <Locate size={20} />
        </button>
        <button
          onClick={() => handleZoom(1)}
          className="w-11 h-11 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-xl flex items-center justify-center text-white hover:bg-zinc-800 active:scale-95 transition-all shadow-lg"
        >
          <Plus size={20} />
        </button>
        <button
          onClick={() => handleZoom(-1)}
          className="w-11 h-11 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-xl flex items-center justify-center text-white hover:bg-zinc-800 active:scale-95 transition-all shadow-lg"
        >
          <Minus size={20} />
        </button>
        <button
          onClick={toggleStyle}
          className="w-11 h-11 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-xl flex items-center justify-center text-white hover:bg-zinc-800 active:scale-95 transition-all shadow-lg"
          title="Toggle Satellite"
        >
          <Layers size={20} />
        </button>
      </div>
    </div>
  );
}
