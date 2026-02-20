'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Property, getUpsideBgColor } from '@/types/property';
import { Navigation, Locate, Plus, Minus, Layers, Search, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PropertyMapProps {
  properties: Property[];
  selectedProperty?: Property | null;
  onPropertySelect?: (property: Property) => void;
  onBoundsChange?: (bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => void;
  onSearchArea?: (bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => void;
  searchCenter?: { lat: number; lng: number } | null;
  fullScreen?: boolean;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function PropertyMap({
  properties,
  selectedProperty,
  onPropertySelect,
  onBoundsChange,
  onSearchArea,
  searchCenter,
  fullScreen = false,
}: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const searchMarker = useRef<mapboxgl.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark');
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<{
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  } | null>(null);
  const lastSearchBounds = useRef<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle === 'dark' 
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-98.5795, 39.8283],
      zoom: 4,
      attributionControl: false,
    });

    map.current.on('load', () => {
      setIsLoaded(true);
    });

    map.current.on('moveend', () => {
      if (map.current) {
        const bounds = map.current.getBounds();
        if (bounds) {
          const newBounds = {
            sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
            ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
          };
          setCurrentBounds(newBounds);
          onBoundsChange?.(newBounds);
          
          // Show "Search this area" button if bounds changed significantly
          const boundsKey = `${newBounds.sw.lat.toFixed(3)},${newBounds.sw.lng.toFixed(3)},${newBounds.ne.lat.toFixed(3)},${newBounds.ne.lng.toFixed(3)}`;
          if (lastSearchBounds.current && lastSearchBounds.current !== boundsKey) {
            setShowSearchButton(true);
          }
        }
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [onBoundsChange]);

  // Update markers when properties change
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Group nearby properties for clustering (simple distance-based)
    const clusters = clusterProperties(properties, map.current.getZoom());

    clusters.forEach((cluster) => {
      if (cluster.count > 1) {
        // Cluster marker
        const el = document.createElement('div');
        el.className = 'cluster-marker';
        el.innerHTML = `
          <div style="
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          ">
            ${cluster.count}
          </div>
        `;

        el.addEventListener('click', () => {
          map.current?.flyTo({
            center: [cluster.lng, cluster.lat],
            zoom: map.current.getZoom() + 2,
            duration: 800,
          });
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([cluster.lng, cluster.lat])
          .addTo(map.current!);
        markers.current.push(marker);
      } else {
        // Single property marker
        const property = cluster.properties[0];
        const el = document.createElement('div');
        const isSelected = selectedProperty?.id === property.id;
        
        const bgColor = property.upsideScore >= 75 
          ? '#22c55e' 
          : property.upsideScore >= 50 
          ? '#eab308' 
          : '#6b7280';

        el.innerHTML = `
          <div style="
            width: ${isSelected ? '48px' : '40px'};
            height: ${isSelected ? '48px' : '40px'};
            background-color: ${bgColor};
            border: ${isSelected ? '4px' : '3px'} solid ${isSelected ? '#3b82f6' : 'white'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '14px' : '12px'};
            font-weight: 700;
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            transition: all 0.2s;
            transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
          ">
            ${property.upsideScore}
          </div>
        `;

        el.addEventListener('click', () => {
          onPropertySelect?.(property);
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([property.longitude, property.latitude])
          .addTo(map.current!);
        markers.current.push(marker);
      }
    });
  }, [properties, isLoaded, selectedProperty, onPropertySelect]);

  // Fly to selected property
  useEffect(() => {
    if (!map.current || !selectedProperty) return;

    map.current.flyTo({
      center: [selectedProperty.longitude, selectedProperty.latitude],
      zoom: Math.max(map.current.getZoom(), 12),
      duration: 1000,
    });
  }, [selectedProperty]);

  // Handle search center changes
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Remove existing search marker
    if (searchMarker.current) {
      searchMarker.current.remove();
      searchMarker.current = null;
    }

    if (searchCenter) {
      // Add search center marker
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(0,0,0,0.4);
        "></div>
      `;

      searchMarker.current = new mapboxgl.Marker(el)
        .setLngLat([searchCenter.lng, searchCenter.lat])
        .addTo(map.current);

      // Fly to search location
      map.current.flyTo({
        center: [searchCenter.lng, searchCenter.lat],
        zoom: 11,
        duration: 1500,
      });

      // Update search bounds
      setTimeout(() => {
        if (map.current) {
          const bounds = map.current.getBounds();
          if (bounds) {
            const newBounds = {
              sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
              ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
            };
            lastSearchBounds.current = `${newBounds.sw.lat.toFixed(3)},${newBounds.sw.lng.toFixed(3)},${newBounds.ne.lat.toFixed(3)},${newBounds.ne.lng.toFixed(3)}`;
            setShowSearchButton(false);
          }
        }
      }, 1600);
    }
  }, [searchCenter, isLoaded]);

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
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([longitude, latitude]);
        map.current?.flyTo({
          center: [longitude, latitude],
          zoom: 10,
          duration: 1500,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  }, []);

  // Toggle map style
  const toggleStyle = useCallback(() => {
    const newStyle = mapStyle === 'dark' ? 'satellite' : 'dark';
    setMapStyle(newStyle);
    map.current?.setStyle(
      newStyle === 'dark'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/satellite-streets-v12'
    );
  }, [mapStyle]);

  // Zoom controls
  const handleZoom = useCallback((delta: number) => {
    map.current?.zoomTo(map.current.getZoom() + delta, { duration: 300 });
  }, []);

  return (
    <div className={`relative w-full ${fullScreen ? 'h-full' : 'h-full'}`}>
      <div ref={mapContainer} className="w-full h-full" />

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

      {/* User location marker */}
      {userLocation && (
        <div
          className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"
          style={{
            // This would need proper projection, simplified for now
          }}
        />
      )}
    </div>
  );
}

// Simple clustering function
interface Cluster {
  lat: number;
  lng: number;
  count: number;
  properties: Property[];
}

function clusterProperties(properties: Property[], zoom: number): Cluster[] {
  if (zoom >= 10) {
    // Don't cluster at high zoom
    return properties.map((p) => ({
      lat: p.latitude,
      lng: p.longitude,
      count: 1,
      properties: [p],
    }));
  }

  const gridSize = zoom < 5 ? 5 : zoom < 8 ? 2 : 1;
  const clusters: Map<string, Cluster> = new Map();

  properties.forEach((property) => {
    const gridLat = Math.floor(property.latitude / gridSize) * gridSize;
    const gridLng = Math.floor(property.longitude / gridSize) * gridSize;
    const key = `${gridLat},${gridLng}`;

    if (clusters.has(key)) {
      const cluster = clusters.get(key)!;
      cluster.properties.push(property);
      cluster.count++;
      // Update center to average
      cluster.lat = cluster.properties.reduce((sum, p) => sum + p.latitude, 0) / cluster.count;
      cluster.lng = cluster.properties.reduce((sum, p) => sum + p.longitude, 0) / cluster.count;
    } else {
      clusters.set(key, {
        lat: property.latitude,
        lng: property.longitude,
        count: 1,
        properties: [property],
      });
    }
  });

  return Array.from(clusters.values());
}
