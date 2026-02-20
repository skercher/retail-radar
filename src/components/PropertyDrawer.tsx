'use client';

import { Property, formatPrice, getUpsideColor, getUpsideBgColor } from '@/types/property';
import {
  X,
  MapPin,
  Building2,
  TrendingUp,
  Calendar,
  Ruler,
  Users,
  ExternalLink,
  Heart,
  Share2,
  Navigation,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PropertyDrawerProps {
  property: Property | null;
  onClose: () => void;
  isSaved?: boolean;
  onSave?: () => void;
}

export function PropertyDrawer({
  property,
  onClose,
  isSaved,
  onSave,
}: PropertyDrawerProps) {
  if (!property) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.name,
          text: `Check out this retail property: ${property.name}`,
          url: property.listingUrl || window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  const handleDirections = () => {
    const address = encodeURIComponent(
      `${property.address}, ${property.city}, ${property.state} ${property.zip}`
    );
    window.open(`https://maps.google.com/maps?daddr=${address}`, '_blank');
  };

  return (
    <AnimatePresence>
      {property && (
        <>
          {/* Backdrop - only on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
          />

          {/* Drawer - bottom sheet on mobile, side panel on desktop */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 md:left-auto md:top-0 md:w-96 bg-zinc-900 rounded-t-3xl md:rounded-none z-50 max-h-[80vh] md:max-h-full md:h-full overflow-hidden border-t border-zinc-800 md:border-l md:border-t-0"
          >
            {/* Handle - mobile only */}
            <div className="flex justify-center pt-3 pb-2 md:hidden">
              <div className="w-10 h-1 bg-zinc-700 rounded-full" />
            </div>

            {/* Header Image */}
            <div className="relative h-48 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
              {property.imageUrl ? (
                <img
                  src={property.imageUrl}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-16 h-16 text-zinc-700" />
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/70"
              >
                <X size={20} />
              </button>

              {/* Upside Score */}
              <div
                className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-lg font-bold text-white shadow-lg ${getUpsideBgColor(
                  property.upsideScore
                )}`}
              >
                {property.upsideScore}
              </div>

              {/* Source */}
              <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/60 rounded text-xs text-zinc-300">
                {property.source}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-12rem)] md:max-h-[calc(100vh-12rem)] p-5">
              {/* Title */}
              <h2 className="text-xl font-bold text-white mb-1">{property.name}</h2>
              <div className="flex items-center gap-1.5 text-zinc-400 text-sm mb-4">
                <MapPin size={14} />
                <span>
                  {property.address}, {property.city}, {property.state} {property.zip}
                </span>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-zinc-800/50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {formatPrice(property.price)}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Asking Price</div>
                </div>
                <div className="bg-zinc-800/50 rounded-2xl p-4 text-center">
                  <div className={`text-2xl font-bold ${getUpsideColor(property.upsideScore)}`}>
                    {property.capRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Cap Rate</div>
                </div>
                <div className="bg-zinc-800/50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {property.vacancyRate}%
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Vacancy</div>
                </div>
                <div className="bg-zinc-800/50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    ${property.pricePerSqft.toFixed(0)}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Per SF</div>
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                  Property Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                      <Building2 size={18} className="text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {property.sqft.toLocaleString()} SF
                      </div>
                      <div className="text-xs text-zinc-500">Building Size</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                      <Ruler size={18} className="text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {property.lotSize} Acres
                      </div>
                      <div className="text-xs text-zinc-500">Lot Size</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                      <Calendar size={18} className="text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{property.yearBuilt}</div>
                      <div className="text-xs text-zinc-500">Year Built</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                      <Users size={18} className="text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{property.tenantCount}</div>
                      <div className="text-xs text-zinc-500">Tenants</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                      <TrendingUp size={18} className="text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium capitalize">
                        {property.propertyType.replace('-', ' ')}
                      </div>
                      <div className="text-xs text-zinc-500">Property Type</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={onSave}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                    isSaved
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-zinc-800 text-white hover:bg-zinc-700'
                  }`}
                >
                  <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
                  {isSaved ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 text-white py-3 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                >
                  <Share2 size={18} />
                  Share
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDirections}
                  className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 text-white py-3 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                >
                  <Navigation size={18} />
                  Directions
                </button>
                {property.listingUrl && (
                  <a
                    href={property.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
                  >
                    <ExternalLink size={18} />
                    View Listing
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
