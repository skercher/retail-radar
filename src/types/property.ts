export interface Property {
  id: string;
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
  marketVacancyRate: number;
  upsideScore: number; // 0-100, higher = more opportunity
  tenantCount: number;
  propertyType: 'strip-center' | 'standalone' | 'mall' | 'mixed-use';
  yearBuilt: number;
  lotSize: number;
  imageUrl?: string;
  listingUrl?: string;
  source: string;
  lastUpdated: string;
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
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

export function calculateUpsideScore(property: Partial<Property>): number {
  // Vacancy upside: if property vacancy > market vacancy = less upside
  // If property vacancy < market vacancy but still has some vacancy = upside
  const vacancyDelta = (property.marketVacancyRate || 10) - (property.vacancyRate || 0);
  
  // Sweet spot: 10-30% vacancy with market at lower rate
  let score = 50;
  
  if (property.vacancyRate && property.vacancyRate > 5 && property.vacancyRate < 40) {
    score += 20; // Has vacancy to fill
  }
  
  if (vacancyDelta > 0) {
    score += Math.min(vacancyDelta * 2, 20); // Property beats market
  }
  
  // Cap rate bonus
  if (property.capRate && property.capRate > 7) {
    score += Math.min((property.capRate - 7) * 5, 15);
  }
  
  // Price per sqft value
  if (property.pricePerSqft && property.pricePerSqft < 150) {
    score += 10;
  }
  
  return Math.min(Math.max(score, 0), 100);
}
