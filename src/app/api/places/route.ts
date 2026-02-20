import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

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
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  business_status?: string;
  photos?: Array<{ photo_reference: string }>;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '50000'; // 50km default
  const type = searchParams.get('type') || 'shopping_mall';

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
  }

  try {
    // Search for retail properties nearby
    const searchTypes = ['shopping_mall', 'store', 'department_store', 'supermarket'];
    const allResults: PlaceResult[] = [];

    for (const searchType of searchTypes) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${searchType}&key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        allResults.push(...data.results);
      }
    }

    // Deduplicate by place_id
    const uniquePlaces = new Map<string, PlaceResult>();
    for (const place of allResults) {
      if (!uniquePlaces.has(place.place_id)) {
        uniquePlaces.set(place.place_id, place);
      }
    }

    // Transform to property format
    const properties = Array.from(uniquePlaces.values()).map((place, index) => ({
      id: place.place_id,
      externalId: place.place_id,
      name: place.name,
      address: place.formatted_address?.split(',')[0] || '',
      city: place.formatted_address?.split(',')[1]?.trim() || '',
      state: place.formatted_address?.split(',')[2]?.trim()?.split(' ')[0] || '',
      zip: place.formatted_address?.split(',')[2]?.trim()?.split(' ')[1] || '',
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      price: null, // Real data would need additional sources
      sqft: null,
      pricePerSqft: null,
      vacancyRate: null,
      capRate: null,
      upsideScore: place.rating ? Math.round((place.rating / 5) * 100) : 50,
      propertyType: place.types?.includes('shopping_mall') ? 'mall' : 
                    place.types?.includes('department_store') ? 'standalone' : 'strip-center',
      yearBuilt: null,
      lotSize: null,
      tenantCount: null,
      listingUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      imageUrl: place.photos?.[0]?.photo_reference 
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
        : null,
      googlePlaceId: place.place_id,
      googleRating: place.rating || null,
      source: 'GooglePlaces',
      lastUpdated: new Date().toISOString(),
      distance: null,
    }));

    return NextResponse.json({
      properties,
      count: properties.length,
      source: 'Google Places API',
      searchLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
    });
  } catch (error) {
    console.error('Google Places API error:', error);
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 });
  }
}
