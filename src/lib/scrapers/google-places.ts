import { ScrapedProperty } from './loopnet';

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  business_status?: string;
  opening_hours?: {
    open_now: boolean;
  };
}

interface PlacesNearbyResponse {
  results: PlaceResult[];
  status: string;
  next_page_token?: string;
}

// Get Google Places API key
function getGoogleApiKey(): string | null {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY || null;
}

// Build photo URL from photo reference
function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  const apiKey = getGoogleApiKey();
  if (!apiKey) return '';
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
}

// Parse address to extract components
function parseAddress(fullAddress: string): { address: string; city: string; state: string; zip: string } {
  const parts = fullAddress.split(',').map((s) => s.trim());
  const address = parts[0] || '';
  const city = parts[1] || '';
  
  const lastPart = parts[parts.length - 1] || '';
  const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5})?/);
  const state = stateZipMatch?.[1] || '';
  const zip = stateZipMatch?.[2] || '';

  return { address, city, state, zip };
}

// Map Google place types to property types
function mapPropertyType(types: string[]): string {
  if (types.includes('shopping_mall')) return 'mall';
  if (types.includes('department_store')) return 'standalone';
  if (types.includes('supermarket') || types.includes('grocery_or_supermarket')) return 'standalone';
  return 'strip-center';
}

export async function scrapeGooglePlaces(
  lat: number,
  lng: number,
  radiusMeters: number = 40000 // ~25 miles
): Promise<ScrapedProperty[]> {
  const apiKey = getGoogleApiKey();
  const properties: ScrapedProperty[] = [];

  if (!apiKey) {
    console.warn('Google Places API key not configured');
    return properties;
  }

  try {
    console.log(`Starting Google Places scrape at: ${lat}, ${lng}, radius: ${radiusMeters}m`);

    // Search for retail/shopping places
    const searchTypes = [
      'shopping_mall',
      'department_store',
      'store',
      'supermarket',
    ];

    for (const type of searchTypes) {
      const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
      url.searchParams.set('location', `${lat},${lng}`);
      url.searchParams.set('radius', String(radiusMeters));
      url.searchParams.set('type', type);
      url.searchParams.set('key', apiKey);

      const response = await fetch(url.toString());
      const data: PlacesNearbyResponse = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error(`Google Places API error for type ${type}:`, data.status);
        continue;
      }

      console.log(`Found ${data.results.length} ${type} places`);

      for (const place of data.results) {
        // Skip if we already have this place
        if (properties.some((p) => p.externalId === `google-${place.place_id}`)) {
          continue;
        }

        const parsedAddress = parseAddress(place.formatted_address);

        // Get photos
        const images: string[] = [];
        if (place.photos && place.photos.length > 0) {
          for (const photo of place.photos.slice(0, 5)) {
            images.push(getPhotoUrl(photo.photo_reference));
          }
        }

        const property: ScrapedProperty = {
          externalId: `google-${place.place_id}`,
          name: place.name,
          address: parsedAddress.address,
          city: parsedAddress.city,
          state: parsedAddress.state,
          zip: parsedAddress.zip,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          price: 0, // Google Places doesn't provide pricing
          sqft: 0,
          vacancyRate: 0,
          capRate: 0,
          propertyType: mapPropertyType(place.types),
          yearBuilt: 0,
          lotSize: 0,
          listingUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          imageUrl: images[0] || null,
          images,
          source: 'Google Places',
        };

        properties.push(property);
      }

      // Small delay between requests
      await new Promise((r) => setTimeout(r, 200));
    }
  } catch (error) {
    console.error('Google Places scraping error:', error);
  }

  console.log(`Google Places scrape complete: ${properties.length} properties`);
  return properties;
}

// Get Street View image URL for a property
export function getStreetViewUrl(
  lat: number,
  lng: number,
  width: number = 600,
  height: number = 400
): string {
  const apiKey = getGoogleApiKey();
  if (!apiKey) return '';
  
  return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${lat},${lng}&key=${apiKey}`;
}

// Check if Street View is available for a location
export async function hasStreetView(lat: number, lng: number): Promise<boolean> {
  const apiKey = getGoogleApiKey();
  if (!apiKey) return false;

  try {
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.status === 'OK';
  } catch {
    return false;
  }
}
