'use client';

import { Property, formatPrice, getUpsideColor, getUpsideBgColor } from '@/types/property';
import { MapPin, TrendingUp, Building2, ExternalLink, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

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
      {/* Image placeholder with upside score badge */}
      <div className="relative h-32 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Building2 className="w-12 h-12 text-zinc-700" />
        )}
        
        {/* Upside Score Badge */}
        <div
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-sm font-bold text-white shadow-lg ${getUpsideBgColor(
            property.upsideScore
          )}`}
        >
          {property.upsideScore}
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
        <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 rounded text-xs text-zinc-300">
          {property.source}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title & Location */}
        <h3 className="font-semibold text-white text-base line-clamp-1">
          {property.name}
        </h3>
        <div className="flex items-center gap-1.5 text-zinc-400 text-sm mt-1">
          <MapPin size={14} />
          <span className="line-clamp-1">
            {property.city}, {property.state}
          </span>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-white">
              {formatPrice(property.price)}
            </div>
            <div className="text-xs text-zinc-500">Price</div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
            <div className={`text-lg font-bold ${getUpsideColor(property.upsideScore)}`}>
              {property.capRate.toFixed(1)}%
            </div>
            <div className="text-xs text-zinc-500">Cap Rate</div>
          </div>
        </div>

        {!compact && (
          <>
            {/* Secondary Metrics */}
            <div className="flex justify-between items-center mt-4 text-sm">
              <div className="flex items-center gap-2 text-zinc-300">
                <Building2 size={16} className="text-zinc-500" />
                <span>{property.sqft.toLocaleString()} SF</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <TrendingUp size={16} className="text-zinc-500" />
                <span>{property.vacancyRate}% Vacant</span>
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
