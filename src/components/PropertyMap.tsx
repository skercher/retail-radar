'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Property } from '@/types/property';

interface PropertyMapProps {
  properties: Property[];
  selectedProperty?: Property | null;
  onPropertySelect?: (property: Property) => void;
}

// Set NEXT_PUBLIC_MAPBOX_TOKEN in environment variables
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function PropertyMap({ properties, selectedProperty, onPropertySelect }: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98.5795, 39.8283], // Center of US
      zoom: 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setIsLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    properties.forEach(property => {
      const el = document.createElement('div');
      el.className = 'property-marker';
      
      const getColor = (score: number) => {
        if (score >= 75) return '#22c55e';
        if (score >= 50) return '#eab308';
        return '#6b7280';
      };

      el.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background-color: ${getColor(property.upsideScore)};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          color: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          transition: transform 0.2s;
        ">
          ${property.upsideScore}
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([property.longitude, property.latitude])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onPropertySelect?.(property);
      });

      markers.current.push(marker);
    });
  }, [properties, isLoaded, onPropertySelect]);

  // Fly to selected property
  useEffect(() => {
    if (!map.current || !selectedProperty) return;

    map.current.flyTo({
      center: [selectedProperty.longitude, selectedProperty.latitude],
      zoom: 12,
      duration: 1500,
    });
  }, [selectedProperty]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}
