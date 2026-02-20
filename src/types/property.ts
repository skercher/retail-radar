export interface Property {
  id: string;
  externalId?: string | null;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  price: number;
  sqft: number;
  pricePerSqft: number;
  capRate: number;
  vacancyRate: number;
  marketVacancyRate?: number;
  upsideScore: number;
  tenantCount: number;
  propertyType: 'strip-center' | 'standalone' | 'mall' | 'mixed-use' | string;
  yearBuilt: number;
  lotSize: number;
  imageUrl?: string | null;
  images?: string[] | null;
  listingUrl?: string | null;
  googlePlaceId?: string | null;
  googleRating?: number | null;
  source: string;
  lastUpdated: string;
  distance?: number | null; // Distance from search point in miles
}

export interface PropertyFilters {
  minPrice?: number;
  maxPrice?: number;
  minCapRate?: number;
  maxCapRate?: number;
  minVacancy?: number;
  maxVacancy?: number;
  minUpsideScore?: number;
  propertyTypes?: Property['propertyType'][];
  states?: string[];
  search?: string;
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface MapBounds {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

export type ViewMode = 'list' | 'map' | 'split' | 'saved';
export type SortOption = 'upsideScore' | 'price' | 'capRate' | 'vacancy';

export function calculateUpsideScore(property: Partial<Property>): number {
  const marketVacancy = property.marketVacancyRate || 10;
  const propVacancy = property.vacancyRate || 0;
  const vacancyDelta = marketVacancy - propVacancy;
  
  let score = 50;
  
  // Has vacancy to fill (sweet spot: 10-30%)
  if (propVacancy && propVacancy > 5 && propVacancy < 40) {
    score += 20;
  }
  
  // Property beats market
  if (vacancyDelta > 0) {
    score += Math.min(vacancyDelta * 2, 20);
  }
  
  // Cap rate bonus
  if (property.capRate && property.capRate > 7) {
    score += Math.min((property.capRate - 7) * 5, 15);
  }
  
  // Value play on price per sqft
  if (property.pricePerSqft && property.pricePerSqft < 150) {
    score += 10;
  }
  
  return Math.min(Math.max(score, 0), 100);
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null || price === 0 || isNaN(price)) {
    return 'N/A';
  }
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(1)}M`;
  }
  if (price >= 1_000) {
    return `$${(price / 1_000).toFixed(0)}K`;
  }
  return `$${price.toLocaleString()}`;
}

export function getUpsideColor(score: number): string {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-zinc-400';
}

export function getUpsideBgColor(score: number): string {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-zinc-500';
}
