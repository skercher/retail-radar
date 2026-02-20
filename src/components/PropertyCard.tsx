'use client';

import { Property } from '@/types/property';
import { Building2, MapPin, TrendingUp, Percent, DollarSign } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  isSelected?: boolean;
  onClick?: () => void;
}

export function PropertyCard({ property, isSelected, onClick }: PropertyCardProps) {
  const getUpsideColor = (score: number) => {
    if (score >= 75) return 'text-green-500 bg-green-500/10';
    if (score >= 50) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-gray-400 bg-gray-400/10';
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  return (
    <div
      className={`bg-zinc-900 border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500 ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-zinc-700'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-white text-sm">{property.name}</h3>
          <div className="flex items-center gap-1 text-zinc-400 text-xs mt-1">
            <MapPin size={12} />
            {property.city}, {property.state}
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-bold ${getUpsideColor(property.upsideScore)}`}>
          {property.upsideScore}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 text-zinc-300">
          <DollarSign size={14} className="text-zinc-500" />
          <span>{formatPrice(property.price)}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-300">
          <TrendingUp size={14} className="text-zinc-500" />
          <span>{property.capRate.toFixed(1)}% Cap</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-300">
          <Building2 size={14} className="text-zinc-500" />
          <span>{property.sqft.toLocaleString()} SF</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-300">
          <Percent size={14} className="text-zinc-500" />
          <span>{property.vacancyRate}% Vacant</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between items-center text-xs">
        <span className="text-zinc-500 capitalize">{property.propertyType.replace('-', ' ')}</span>
        <span className="text-zinc-600">{property.source}</span>
      </div>
    </div>
  );
}
