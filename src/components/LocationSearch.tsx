'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Crosshair, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES } from '@/lib/google-maps';

interface LocationSearchProps {
  onLocationSelect: (location: {
    name: string;
    lat: number;
    lng: number;
  }) => void;
  onClear?: () => void;
  placeholder?: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function LocationSearch({
  onLocationSelect,
  onClear,
  placeholder = 'Search location...',
}: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Initialize services when Google Maps is loaded
  useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      // Create a dummy div for PlacesService (required)
      const dummyDiv = document.createElement('div');
      placesService.current = new google.maps.places.PlacesService(dummyDiv);
      geocoder.current = new google.maps.Geocoder();
    }
  }, [isLoaded]);

  // Search for place predictions
  const searchLocations = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2 || !autocompleteService.current) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      autocompleteService.current.getPlacePredictions(
        {
          input: searchQuery,
          componentRestrictions: { country: 'us' },
          types: ['geocode', 'establishment'],
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 5) as PlacePrediction[]);
          } else {
            setSuggestions([]);
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
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
  const handleSelect = useCallback((prediction: PlacePrediction) => {
    if (!placesService.current) return;

    setQuery(prediction.description);
    setSuggestions([]);
    setIsFocused(false);

    // Get place details to get lat/lng
    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'name', 'formatted_address'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          onLocationSelect({
            name: prediction.description,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
        }
      }
    );
  }, [onLocationSelect]);

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
        if (geocoder.current) {
          geocoder.current.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              let placeName = 'Current Location';
              if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                // Try to find a locality or neighborhood result
                const addressResult = results.find(r => 
                  r.types.includes('locality') || 
                  r.types.includes('sublocality') ||
                  r.types.includes('neighborhood')
                ) || results[0];
                placeName = addressResult.formatted_address;
              }

              setQuery(placeName);
              onLocationSelect({
                name: placeName,
                lat: latitude,
                lng: longitude,
              });
              setLocatingUser(false);
            }
          );
        } else {
          onLocationSelect({
            name: 'Current Location',
            lat: latitude,
            lng: longitude,
          });
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
            {suggestions.map((prediction) => (
              <button
                key={prediction.place_id}
                onClick={() => handleSelect(prediction)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800 transition-colors"
              >
                <MapPin size={16} className="text-zinc-500 flex-shrink-0" />
                <span className="text-sm text-white truncate">
                  {prediction.description}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
