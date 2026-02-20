'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Property, PropertyFilters, ViewMode, SortOption, formatPrice } from '@/types/property';
import { PropertyCard } from '@/components/PropertyCard';
import { BottomNav } from '@/components/BottomNav';
import { FilterSheet } from '@/components/FilterSheet';
import { PropertyDrawer } from '@/components/PropertyDrawer';
import {
  TrendingUp,
  Building2,
  Zap,
  SlidersHorizontal,
  Download,
  RefreshCw,
} from 'lucide-react';
import { LocationSearch } from '@/components/LocationSearch';

// Dynamic import for map to avoid SSR issues
const PropertyMap = dynamic(
  () => import('@/components/PropertyMap').then((mod) => mod.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
      </div>
    ),
  }
);

export default function Home() {
  // State
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>('upsideScore');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [savedProperties, setSavedProperties] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(25); // miles

  // Fetch properties from API
  const fetchProperties = useCallback(async (bounds?: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.minUpsideScore) params.set('minUpside', String(filters.minUpsideScore));
      if (filters.minCapRate) params.set('minCapRate', String(filters.minCapRate));
      if (filters.minVacancy) params.set('minVacancy', String(filters.minVacancy));
      if (filters.maxVacancy) params.set('maxVacancy', String(filters.maxVacancy));
      if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
      if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
      params.set('sortBy', sortBy === 'upsideScore' ? 'upside_score' : sortBy === 'capRate' ? 'cap_rate' : sortBy);

      // Add location-based search params
      if (searchLocation) {
        params.set('lat', String(searchLocation.lat));
        params.set('lng', String(searchLocation.lng));
        params.set('radius', String(searchRadius));
      }

      // Add bounds filter if provided (for "Search this area")
      if (bounds) {
        params.set('bounds', `${bounds.sw.lat},${bounds.sw.lng},${bounds.ne.lat},${bounds.ne.lng}`);
      }

      const response = await fetch(`/api/properties?${params.toString()}`);
      const data = await response.json();
      
      if (data.properties && data.properties.length > 0) {
        setProperties(data.properties);
      } else {
        // Fall back to sample data if no DB data
        const { sampleProperties } = await import('@/data/sample-properties');
        setProperties(sampleProperties);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      // Fall back to sample data
      const { sampleProperties } = await import('@/data/sample-properties');
      setProperties(sampleProperties);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, searchLocation, searchRadius]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Filter and sort properties client-side
  const filteredProperties = useMemo(() => {
    let result = [...properties];

    // Sort (for client-side filtering)
    result.sort((a, b) => {
      switch (sortBy) {
        case 'upsideScore':
          return b.upsideScore - a.upsideScore;
        case 'price':
          return a.price - b.price;
        case 'capRate':
          return b.capRate - a.capRate;
        case 'vacancy':
          return b.vacancyRate - a.vacancyRate;
        default:
          return 0;
      }
    });

    // If we have location search, sort by distance optionally
    if (searchLocation && result.some(p => p.distance !== undefined)) {
      // Already sorted by the selected criteria, but put closest properties
      // with similar scores first
    }

    return result;
  }, [properties, sortBy, searchLocation]);

  // Stats
  const stats = useMemo(() => {
    const highUpside = filteredProperties.filter((p) => p.upsideScore >= 75).length;
    const avgCapRate =
      filteredProperties.reduce((sum, p) => sum + p.capRate, 0) /
        filteredProperties.length || 0;
    const totalValue = filteredProperties.reduce((sum, p) => sum + p.price, 0);

    return { highUpside, avgCapRate, totalValue, count: filteredProperties.length };
  }, [filteredProperties]);

  // Toggle save property
  const toggleSave = (propertyId: string) => {
    setSavedProperties((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) {
        next.delete(propertyId);
      } else {
        next.add(propertyId);
      }
      return next;
    });
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Name', 'Address', 'City', 'State', 'Price', 'Sqft', 'Cap Rate', 'Vacancy', 'Upside Score', 'Source', 'URL'];
    const rows = filteredProperties.map((p) => [
      p.name,
      p.address,
      p.city,
      p.state,
      p.price,
      p.sqft,
      p.capRate,
      p.vacancyRate,
      p.upsideScore,
      p.source,
      p.listingUrl || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'retail-radar-export.csv';
    a.click();
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined);

  return (
    <main className="h-[100dvh] flex flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-800 px-4 py-3 pt-safe">
        {/* Top Row - Logo & Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">RetailRadar</h1>
              <span className="text-[10px] text-blue-400">Beta</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export - desktop only */}
            <button
              onClick={exportCSV}
              className="hidden md:flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-xl text-sm text-zinc-300 hover:bg-zinc-700"
            >
              <Download size={16} />
              Export
            </button>

            {/* Refresh */}
            <button
              onClick={() => fetchProperties()}
              className={`w-10 h-10 flex items-center justify-center bg-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-700 ${
                loading ? 'animate-spin' : ''
              }`}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Search Row */}
        <div className="flex gap-2">
          <div className="flex-1">
            <LocationSearch
              onLocationSelect={(location) => {
                setSearchLocation(location);
                setSearchQuery(location.name);
              }}
              onClear={() => {
                setSearchLocation(null);
                setSearchQuery('');
              }}
              placeholder="Search location..."
            />
          </div>

          {/* Radius selector (shown when location is selected) */}
          {searchLocation && (
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value={5}>5 mi</option>
              <option value={10}>10 mi</option>
              <option value={25}>25 mi</option>
              <option value={50}>50 mi</option>
              <option value={100}>100 mi</option>
            </select>
          )}

          {/* Filter Button */}
          <button
            onClick={() => setFilterSheetOpen(true)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              hasActiveFilters
                ? 'bg-blue-500 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                {Object.values(filters).filter((v) => v !== undefined).length}
              </span>
            )}
          </button>
        </div>

        {/* Stats Bar - desktop */}
        <div className="hidden md:flex gap-6 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-zinc-500" />
            <span className="text-zinc-400">{stats.count} Properties</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-500" />
            <span className="text-zinc-400">{stats.highUpside} High Upside</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">
              Avg Cap Rate: {stats.avgCapRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">
              Total Value: {formatPrice(stats.totalValue)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* List View - mobile or desktop sidebar */}
        <aside
          className={`
            ${viewMode === 'map' ? 'hidden' : 'flex'}
            md:flex
            w-full md:w-[420px] flex-shrink-0
            border-r border-zinc-800
            flex-col
          `}
        >
          {/* Mobile Stats */}
          <div className="md:hidden flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-zinc-800 text-xs">
            <span className="text-zinc-400">{stats.count} properties</span>
            <span className="text-emerald-400">{stats.highUpside} high upside</span>
          </div>

          {/* Property List */}
          <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 space-y-3">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-zinc-900 rounded-2xl overflow-hidden"
                >
                  <div className="h-32 skeleton" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-3/4 skeleton rounded" />
                    <div className="h-3 w-1/2 skeleton rounded" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-16 skeleton rounded-xl" />
                      <div className="h-16 skeleton rounded-xl" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No properties found</p>
                <p className="text-zinc-600 text-sm mt-1">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isSelected={selectedProperty?.id === property.id}
                  isSaved={savedProperties.has(property.id)}
                  onClick={() => setSelectedProperty(property)}
                  onSave={() => toggleSave(property.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Map View */}
        <div
          className={`
            ${viewMode === 'list' ? 'hidden' : 'flex'}
            md:flex
            flex-1 relative
          `}
        >
          <PropertyMap
            properties={filteredProperties}
            selectedProperty={selectedProperty}
            onPropertySelect={setSelectedProperty}
            searchCenter={searchLocation}
            onSearchArea={(bounds) => fetchProperties(bounds)}
            fullScreen={viewMode === 'map'}
          />
        </div>
      </div>

      {/* Bottom Navigation - mobile only */}
      <BottomNav
        activeView={viewMode}
        onViewChange={setViewMode}
        savedCount={savedProperties.size}
      />

      {/* Filter Sheet */}
      <FilterSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Property Detail Drawer */}
      <PropertyDrawer
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        isSaved={selectedProperty ? savedProperties.has(selectedProperty.id) : false}
        onSave={() => selectedProperty && toggleSave(selectedProperty.id)}
      />
    </main>
  );
}
