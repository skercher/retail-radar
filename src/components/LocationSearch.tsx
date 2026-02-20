'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Crosshair, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationSearchProps {
  onLocationSelect: (location: {
    name: string;
    lat: number;
    lng: number;
  }) => void;
  onClear?: () => void;
  placeholder?: string;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function LocationSearch({
  onLocationSelect,
  onClear,
  placeholder = 'Search location...',
}: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Geocode search query
  const searchLocations = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${MAPBOX_TOKEN}&country=us&types=place,locality,neighborhood,address,poi&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error('Geocoding error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchLocations(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchLocations]);

  // Handle suggestion selection
  const handleSelect = (feature: MapboxFeature) => {
    setQuery(feature.place_name);
    setSuggestions([]);
    setIsFocused(false);
    onLocationSelect({
      name: feature.place_name,
      lat: feature.center[1],
      lng: feature.center[0],
    });
  };

  // Handle clear
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onClear?.();
    inputRef.current?.focus();
  };

  // Get user's current location
  const handleLocate = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get place name
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=place,locality&limit=1`
          );
          const data = await response.json();
          const placeName =
            data.features?.[0]?.place_name || 'Current Location';

          setQuery(placeName);
          onLocationSelect({
            name: placeName,
            lat: latitude,
            lng: longitude,
          });
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          onLocationSelect({
            name: 'Current Location',
            lat: latitude,
            lng: longitude,
          });
        } finally {
          setLocatingUser(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocatingUser(false);
        alert('Unable to get your location. Please enable location services.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-3 text-zinc-500">
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Search size={18} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl pl-10 pr-20 py-3 text-sm focus:outline-none focus:border-blue-500 placeholder:text-zinc-500"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              onClick={handleClear}
              className="p-1.5 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={handleLocate}
            disabled={locatingUser}
            className="p-1.5 text-zinc-500 hover:text-blue-400 transition-colors disabled:opacity-50"
            title="Use my location"
          >
            {locatingUser ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Crosshair size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-xl z-50"
          >
            {suggestions.map((feature) => (
              <button
                key={feature.id}
                onClick={() => handleSelect(feature)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800 transition-colors"
              >
                <MapPin size={16} className="text-zinc-500 flex-shrink-0" />
                <span className="text-sm text-white truncate">
                  {feature.place_name}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
