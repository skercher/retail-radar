'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Property, PropertyFilters } from '@/types/property';
import { sampleProperties } from '@/data/sample-properties';
import { PropertyCard } from '@/components/PropertyCard';
import { Filters } from '@/components/Filters';
import { Search, TrendingUp, Building2, Zap } from 'lucide-react';

// Dynamic import for map to avoid SSR issues
const PropertyMap = dynamic(
  () => import('@/components/PropertyMap').then((mod) => mod.PropertyMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-zinc-900 animate-pulse" /> }
);

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [sortBy, setSortBy] = useState<'upsideScore' | 'price' | 'capRate' | 'vacancy'>('upsideScore');

  const filteredProperties = useMemo(() => {
    let result = [...sampleProperties];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.city.toLowerCase().includes(query) ||
          p.state.toLowerCase().includes(query) ||
          p.address.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.minUpsideScore) {
      result = result.filter((p) => p.upsideScore >= filters.minUpsideScore!);
    }
    if (filters.minCapRate) {
      result = result.filter((p) => p.capRate >= filters.minCapRate!);
    }
    if (filters.maxCapRate) {
      result = result.filter((p) => p.capRate <= filters.maxCapRate!);
    }
    if (filters.minVacancy) {
      result = result.filter((p) => p.vacancyRate >= filters.minVacancy!);
    }
    if (filters.maxVacancy) {
      result = result.filter((p) => p.vacancyRate <= filters.maxVacancy!);
    }
    if (filters.minPrice) {
      result = result.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice) {
      result = result.filter((p) => p.price <= filters.maxPrice!);
    }

    // Sort
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

    return result;
  }, [searchQuery, filters, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const highUpside = filteredProperties.filter((p) => p.upsideScore >= 75).length;
    const avgCapRate = filteredProperties.reduce((sum, p) => sum + p.capRate, 0) / filteredProperties.length || 0;
    const totalValue = filteredProperties.reduce((sum, p) => sum + p.price, 0);
    
    return { highUpside, avgCapRate, totalValue, count: filteredProperties.length };
  }, [filteredProperties]);

  return (
    <main className="h-screen flex flex-col bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <h1 className="text-xl font-bold">RetailRadar</h1>
            </div>
            <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full">
              Beta
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <Filters filters={filters} onFiltersChange={setFilters} />

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="upsideScore">Highest Upside</option>
              <option value="price">Lowest Price</option>
              <option value="capRate">Highest Cap Rate</option>
              <option value="vacancy">Highest Vacancy</option>
            </select>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-6 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-zinc-500" />
            <span className="text-zinc-400">{stats.count} Properties</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-green-500" />
            <span className="text-zinc-400">{stats.highUpside} High Upside</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Avg Cap Rate: {stats.avgCapRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">
              Total Value: ${(stats.totalValue / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Property List */}
        <aside className="w-96 flex-shrink-0 border-r border-zinc-800 overflow-y-auto p-4 space-y-3">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isSelected={selectedProperty?.id === property.id}
              onClick={() => setSelectedProperty(property)}
            />
          ))}

          {filteredProperties.length === 0 && (
            <div className="text-center text-zinc-500 py-8">
              No properties match your filters
            </div>
          )}
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          <PropertyMap
            properties={filteredProperties}
            selectedProperty={selectedProperty}
            onPropertySelect={setSelectedProperty}
          />

          {/* Selected Property Detail */}
          {selectedProperty && (
            <div className="absolute bottom-4 left-4 right-4 bg-zinc-900/95 backdrop-blur border border-zinc-700 rounded-lg p-4 max-w-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="font-bold text-lg">{selectedProperty.name}</h2>
                  <p className="text-zinc-400 text-sm">{selectedProperty.address}</p>
                  <p className="text-zinc-500 text-sm">
                    {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {selectedProperty.upsideScore}
                  </div>
                  <div className="text-xs text-zinc-500">Upside Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    ${(selectedProperty.price / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-zinc-500">Price</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{selectedProperty.capRate}%</div>
                  <div className="text-xs text-zinc-500">Cap Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{selectedProperty.vacancyRate}%</div>
                  <div className="text-xs text-zinc-500">Vacancy</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Size:</span>{' '}
                  <span>{selectedProperty.sqft.toLocaleString()} SF</span>
                </div>
                <div>
                  <span className="text-zinc-500">$/SF:</span>{' '}
                  <span>${selectedProperty.pricePerSqft.toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Built:</span>{' '}
                  <span>{selectedProperty.yearBuilt}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
