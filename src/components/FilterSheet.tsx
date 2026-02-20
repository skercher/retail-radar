'use client';

import { PropertyFilters, SortOption } from '@/types/property';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function FilterSheet({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
}: FilterSheetProps) {
  const updateFilter = <K extends keyof PropertyFilters>(
    key: K,
    value: PropertyFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'upsideScore', label: 'Highest Upside' },
    { value: 'price', label: 'Lowest Price' },
    { value: 'capRate', label: 'Highest Cap Rate' },
    { value: 'vacancy', label: 'Highest Vacancy' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl z-50 max-h-[85vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-zinc-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-blue-500" />
                <h2 className="text-lg font-semibold text-white">Filters & Sort</h2>
              </div>
              <div className="flex items-center gap-2">
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800"
                  >
                    <RotateCcw size={14} />
                    Clear
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-120px)] px-5 py-4 space-y-6">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Sort By
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onSortChange(option.value)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                        sortBy === option.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Upside Score */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-zinc-300">
                    Minimum Upside Score
                  </label>
                  <span className="text-sm text-blue-400 font-medium">
                    {filters.minUpsideScore || 0}+
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minUpsideScore || 0}
                  onChange={(e) =>
                    updateFilter('minUpsideScore', Number(e.target.value) || undefined)
                  }
                  className="w-full h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>

              {/* Cap Rate */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Minimum Cap Rate
                </label>
                <div className="flex gap-3">
                  {[5, 6, 7, 8, 9, 10].map((rate) => (
                    <button
                      key={rate}
                      onClick={() =>
                        updateFilter(
                          'minCapRate',
                          filters.minCapRate === rate ? undefined : rate
                        )
                      }
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                        filters.minCapRate === rate
                          ? 'bg-blue-500 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {rate}%+
                    </button>
                  ))}
                </div>
              </div>

              {/* Vacancy Range */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Vacancy Rate
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Min</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Any"
                      value={filters.minVacancy || ''}
                      onChange={(e) =>
                        updateFilter(
                          'minVacancy',
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Max</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Any"
                      value={filters.maxVacancy || ''}
                      onChange={(e) =>
                        updateFilter(
                          'maxVacancy',
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Price Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Min</label>
                    <input
                      type="number"
                      placeholder="Any"
                      value={filters.minPrice || ''}
                      onChange={(e) =>
                        updateFilter(
                          'minPrice',
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Max</label>
                    <input
                      type="number"
                      placeholder="Any"
                      value={filters.maxPrice || ''}
                      onChange={(e) =>
                        updateFilter(
                          'maxPrice',
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="p-5 pt-3 border-t border-zinc-800 pb-safe">
              <button
                onClick={onClose}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-4 rounded-xl transition-colors active:scale-[0.98]"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
