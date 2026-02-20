'use client';

import { Property, formatPrice, getUpsideColor, getUpsideBgColor } from '@/types/property';
import { MapPin, TrendingUp, Building2, ExternalLink, Heart, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

function formatDistance(miles: number): string {
  if (miles < 0.1) return '<0.1 mi';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

interface PropertyCardProps {
  property: Property;
  isSelected?: boolean;
  isSaved?: boolean;
  onClick?: () => void;
  onSave?: () => void;
  compact?: boolean;
}

export function PropertyCard({
  property,
  isSelected,
  isSaved,
  onClick,
  onSave,
  compact = false,
}: PropertyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-zinc-900 border rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.98] ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
      onClick={onClick}
    >
      {/* Image with fallback */}
      <div className="relative h-32 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center overflow-hidden">
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken images
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Building2 className="w-10 h-10 text-zinc-700 mb-1" />
            <span className="text-xs text-zinc-600">No image</span>
          </div>
        )}
        
        {/* Upside Score Badge */}
        <div
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-sm font-bold text-white shadow-lg ${getUpsideBgColor(
            property.upsideScore ?? 0
          )}`}
        >
          {property.upsideScore ?? 0}
        </div>

        {/* Save Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave?.();
          }}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isSaved
              ? 'bg-red-500 text-white'
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
        >
          <Heart size={20} fill={isSaved ? 'currentColor' : 'none'} />
        </button>

        {/* Source Badge */}
        <div className={`absolute bottom-3 right-3 px-2 py-0.5 rounded text-xs ${
          property.source === 'GooglePlaces' 
            ? 'bg-blue-500/80 text-white' 
            : 'bg-black/60 text-zinc-300'
        }`}>
          {property.source === 'GooglePlaces' ? 'Retail Location' : property.source}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title & Location */}
        <h3 className="font-semibold text-white text-base line-clamp-1">
          {property.name}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
            <MapPin size={14} />
            <span className="line-clamp-1">
              {property.city}, {property.state}
            </span>
          </div>
          {property.distance !== undefined && property.distance !== null && (
            <div className="flex items-center gap-1 text-blue-400 text-xs">
              <Navigation size={12} />
              <span>{formatDistance(property.distance)}</span>
            </div>
          )}
        </div>

        {/* Key Metrics - only show if we have listing data */}
        {(property.price != null && property.price > 0) || (property.capRate != null && property.capRate > 0) ? (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">
                {formatPrice(property.price)}
              </div>
              <div className="text-xs text-zinc-500">Price</div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <div className={`text-lg font-bold ${getUpsideColor(property.upsideScore ?? 0)}`}>
                {property.capRate != null && property.capRate > 0 ? `${property.capRate.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-xs text-zinc-500">Cap Rate</div>
            </div>
          </div>
        ) : (
          <div className="mt-4 bg-zinc-800/50 rounded-xl p-3 text-center">
            <div className="text-sm text-zinc-400">
              {property.source === 'GooglePlaces' ? 'Retail location - no listing data' : 'Contact for pricing'}
            </div>
            {property.googleRating && (
              <div className="text-xs text-zinc-500 mt-1">
                ⭐ {property.googleRating.toFixed(1)} Google Rating
              </div>
            )}
          </div>
        )}

        {!compact && (
          <>
            {/* Secondary Metrics */}
            <div className="flex justify-between items-center mt-4 text-sm">
              <div className="flex items-center gap-2 text-zinc-300">
                <Building2 size={16} className="text-zinc-500" />
                <span>{property.sqft != null ? `${property.sqft.toLocaleString()} SF` : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <TrendingUp size={16} className="text-zinc-500" />
                <span>{property.vacancyRate != null ? `${property.vacancyRate}% Vacant` : 'N/A'}</span>
              </div>
            </div>

            {/* Property Type & View Listing */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
              <span className="text-xs text-zinc-500 capitalize">
                {property.propertyType.replace('-', ' ')}
              </span>
              {property.listingUrl && (
                <a
                  href={property.listingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-blue-400 text-sm hover:text-blue-300"
                >
                  View Listing
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
