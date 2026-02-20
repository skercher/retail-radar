'use client';

import { PropertyFilters } from '@/types/property';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';

interface FiltersProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
}

export function Filters({ filters, onFiltersChange }: FiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof PropertyFilters>(
    key: K,
    value: PropertyFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          hasFilters
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
        }`}
      >
        <Filter size={16} />
        Filters
        {hasFilters && (
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
            {Object.keys(filters).length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-lg p-4 z-50 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white">Filters</h3>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <X size={12} />
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Min Upside Score */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Min Upside Score
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.minUpsideScore || 0}
                onChange={(e) => updateFilter('minUpsideScore', Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="text-right text-xs text-zinc-500">
                {filters.minUpsideScore || 0}+
              </div>
            </div>

            {/* Cap Rate Range */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Min Cap Rate
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="15"
                value={filters.minCapRate || ''}
                onChange={(e) => updateFilter('minCapRate', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Any"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
              />
            </div>

            {/* Vacancy Range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Min Vacancy %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minVacancy || ''}
                  onChange={(e) => updateFilter('minVacancy', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Any"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Max Vacancy %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.maxVacancy || ''}
                  onChange={(e) => updateFilter('maxVacancy', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Any"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Min Price
                </label>
                <input
                  type="number"
                  value={filters.minPrice || ''}
                  onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Any"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Max Price
                </label>
                <input
                  type="number"
                  value={filters.maxPrice || ''}
                  onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Any"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm transition-colors"
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );
}
