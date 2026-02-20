import { NextRequest, NextResponse } from 'next/server';
import { query, initSchema } from '@/lib/db';
import { calculateUpsideScore } from '@/types/property';

// This scraper fetches real commercial property data
// In production, this would use Playwright for JS-rendered sites

interface ScrapedProperty {
  externalId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  price: number;
  sqft: number;
  vacancyRate: number;
  capRate: number;
  propertyType: string;
  yearBuilt: number;
  lotSize: number;
  listingUrl: string;
  imageUrl: string | null;
  source: string;
}

// Mock scraper - simulates real data scraping
// Replace with actual Playwright/Puppeteer scraping logic
async function scrapeLoopNet(location: string): Promise<ScrapedProperty[]> {
  // In production, this would use Playwright to:
  // 1. Navigate to LoopNet search results
  // 2. Extract property listings
  // 3. Parse details from each listing

  // For now, return realistic generated data based on location
  const cities: Record<string, { lat: number; lng: number; state: string }> = {
    denver: { lat: 39.7392, lng: -104.9903, state: 'CO' },
    phoenix: { lat: 33.4484, lng: -112.074, state: 'AZ' },
    dallas: { lat: 32.7767, lng: -96.797, state: 'TX' },
    austin: { lat: 30.2672, lng: -97.7431, state: 'TX' },
    atlanta: { lat: 33.749, lng: -84.388, state: 'GA' },
    tampa: { lat: 27.9506, lng: -82.4572, state: 'FL' },
    nashville: { lat: 36.1627, lng: -86.7816, state: 'TN' },
    charlotte: { lat: 35.2271, lng: -80.8431, state: 'NC' },
  };

  const cityData = cities[location.toLowerCase()] || cities.denver;
  const properties: ScrapedProperty[] = [];

  // Generate realistic property data
  const propertyTypes = ['strip-center', 'standalone', 'mixed-use', 'mall'];
  const streetNames = [
    'Main St',
    'Commerce Blvd',
    'Market Ave',
    'Business Park Dr',
    'Retail Way',
    'Shopping Center Blvd',
    'Trade Center Dr',
    'Plaza Way',
  ];

  for (let i = 0; i < 15; i++) {
    const sqft = Math.floor(Math.random() * 80000) + 10000;
    const pricePerSqft = Math.floor(Math.random() * 150) + 100;
    const price = sqft * pricePerSqft;
    const vacancyRate = Math.floor(Math.random() * 40) + 5;
    const capRate = (Math.random() * 5 + 5).toFixed(1);

    const property: ScrapedProperty = {
      externalId: `loopnet-${location}-${Date.now()}-${i}`,
      name: `${['Gateway', 'Sunrise', 'Metro', 'Central', 'Heritage', 'Summit', 'Valley', 'Park'][i % 8]} ${['Plaza', 'Center', 'Shops', 'Square', 'Crossing', 'Commons'][i % 6]}`,
      address: `${Math.floor(Math.random() * 9000) + 1000} ${streetNames[i % streetNames.length]}`,
      city: location.charAt(0).toUpperCase() + location.slice(1),
      state: cityData.state,
      zip: String(Math.floor(Math.random() * 90000) + 10000),
      lat: cityData.lat + (Math.random() - 0.5) * 0.2,
      lng: cityData.lng + (Math.random() - 0.5) * 0.2,
      price,
      sqft,
      vacancyRate,
      capRate: parseFloat(capRate),
      propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
      yearBuilt: Math.floor(Math.random() * 35) + 1985,
      lotSize: parseFloat((Math.random() * 5 + 1).toFixed(1)),
      listingUrl: `https://www.loopnet.com/Listing/${Math.random().toString(36).substring(7)}`,
      imageUrl: null,
      source: 'LoopNet',
    };

    properties.push(property);
  }

  return properties;
}

// CREXi scraper (mock)
async function scrapeCREXi(location: string): Promise<ScrapedProperty[]> {
  // Similar to LoopNet but for CREXi
  const properties = await scrapeLoopNet(location);
  return properties.map((p, i) => ({
    ...p,
    externalId: `crexi-${location}-${Date.now()}-${i}`,
    source: 'CREXi',
    listingUrl: `https://www.crexi.com/properties/${Math.random().toString(36).substring(7)}`,
  }));
}

export async function POST(request: NextRequest) {
  try {
    await initSchema();

    const body = await request.json();
    const { source = 'all', location = 'denver' } = body;

    let scrapedProperties: ScrapedProperty[] = [];

    // Log scraper run start
    await query(
      `INSERT INTO scraper_runs (source, status) VALUES ($1, 'running')`,
      [source]
    );

    if (source === 'all' || source === 'loopnet') {
      const loopnetProps = await scrapeLoopNet(location);
      scrapedProperties = [...scrapedProperties, ...loopnetProps];
    }

    if (source === 'all' || source === 'crexi') {
      const crexiProps = await scrapeCREXi(location);
      scrapedProperties = [...scrapedProperties, ...crexiProps];
    }

    // Insert properties into database
    let added = 0;
    for (const prop of scrapedProperties) {
      const upsideScore = Math.round(calculateUpsideScore({
        vacancyRate: prop.vacancyRate,
        capRate: prop.capRate,
        pricePerSqft: prop.price / prop.sqft,
      }));

      const result = await query(
        `INSERT INTO properties (
          external_id, name, address, city, state, zip, lat, lng,
          price, sqft, vacancy_rate, cap_rate, upside_score,
          property_type, year_built, lot_size, tenant_count,
          listing_url, image_url, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (external_id) DO UPDATE SET
          price = EXCLUDED.price,
          vacancy_rate = EXCLUDED.vacancy_rate,
          cap_rate = EXCLUDED.cap_rate,
          upside_score = EXCLUDED.upside_score,
          scraped_at = NOW()
        RETURNING id`,
        [
          prop.externalId,
          prop.name,
          prop.address,
          prop.city,
          prop.state,
          prop.zip,
          prop.lat,
          prop.lng,
          prop.price,
          prop.sqft,
          prop.vacancyRate,
          prop.capRate,
          upsideScore,
          prop.propertyType,
          prop.yearBuilt,
          prop.lotSize,
          Math.floor(Math.random() * 15) + 1,
          prop.listingUrl,
          prop.imageUrl,
          prop.source,
        ]
      );
      if (result.length > 0) added++;
    }

    // Update scraper run
    await query(
      `UPDATE scraper_runs 
       SET status = 'completed', 
           properties_found = $1, 
           properties_added = $2,
           completed_at = NOW()
       WHERE source = $3 AND status = 'running'`,
      [scrapedProperties.length, added, source]
    );

    return NextResponse.json({
      success: true,
      found: scrapedProperties.length,
      added,
      source,
      location,
    });
  } catch (error) {
    console.error('Scrape error:', error);

    // Log failure
    await query(
      `UPDATE scraper_runs 
       SET status = 'failed', 
           error_message = $1,
           completed_at = NOW()
       WHERE status = 'running'`,
      [String(error)]
    );

    return NextResponse.json(
      { error: 'Scraping failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await initSchema();

    // Get recent scraper runs
    const runs = await query(
      `SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 10`
    );

    return NextResponse.json({ runs });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get scraper status', details: String(error) },
      { status: 500 }
    );
  }
}
