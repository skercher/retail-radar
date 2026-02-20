import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, initSchema } from '@/lib/db';

export interface PropertyRow {
  id: number;
  external_id: string | null;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  price: number | null;
  sqft: number | null;
  vacancy_rate: number | null;
  cap_rate: number | null;
  upside_score: number | null;
  property_type: string | null;
  year_built: number | null;
  lot_size: number | null;
  tenant_count: number | null;
  listing_url: string | null;
  image_url: string | null;
  source: string | null;
  scraped_at: string;
  created_at: string;
}

function transformProperty(row: PropertyRow) {
  return {
    id: String(row.id),
    externalId: row.external_id,
    name: row.name,
    address: row.address || '',
    city: row.city || '',
    state: row.state || '',
    zip: row.zip || '',
    latitude: row.lat ? Number(row.lat) : 0,
    longitude: row.lng ? Number(row.lng) : 0,
    price: row.price ? Number(row.price) : 0,
    sqft: row.sqft || 0,
    pricePerSqft: row.price && row.sqft ? Number(row.price) / row.sqft : 0,
    vacancyRate: row.vacancy_rate ? Number(row.vacancy_rate) : 0,
    capRate: row.cap_rate ? Number(row.cap_rate) : 0,
    upsideScore: row.upside_score || 50,
    propertyType: row.property_type || 'strip-center',
    yearBuilt: row.year_built || 2000,
    lotSize: row.lot_size ? Number(row.lot_size) : 0,
    tenantCount: row.tenant_count || 0,
    listingUrl: row.listing_url,
    imageUrl: row.image_url,
    source: row.source || 'manual',
    lastUpdated: row.scraped_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Ensure schema exists
    await initSchema();

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const minUpside = searchParams.get('minUpside');
    const minCapRate = searchParams.get('minCapRate');
    const minVacancy = searchParams.get('minVacancy');
    const maxVacancy = searchParams.get('maxVacancy');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'upside_score';
    const limit = searchParams.get('limit') || '100';
    const bounds = searchParams.get('bounds'); // sw_lat,sw_lng,ne_lat,ne_lng

    let sql = 'SELECT * FROM properties WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (city) {
      sql += ` AND LOWER(city) LIKE LOWER($${paramIndex})`;
      params.push(`%${city}%`);
      paramIndex++;
    }

    if (state) {
      sql += ` AND UPPER(state) = UPPER($${paramIndex})`;
      params.push(state);
      paramIndex++;
    }

    if (minUpside) {
      sql += ` AND upside_score >= $${paramIndex}`;
      params.push(Number(minUpside));
      paramIndex++;
    }

    if (minCapRate) {
      sql += ` AND cap_rate >= $${paramIndex}`;
      params.push(Number(minCapRate));
      paramIndex++;
    }

    if (minVacancy) {
      sql += ` AND vacancy_rate >= $${paramIndex}`;
      params.push(Number(minVacancy));
      paramIndex++;
    }

    if (maxVacancy) {
      sql += ` AND vacancy_rate <= $${paramIndex}`;
      params.push(Number(maxVacancy));
      paramIndex++;
    }

    if (minPrice) {
      sql += ` AND price >= $${paramIndex}`;
      params.push(Number(minPrice));
      paramIndex++;
    }

    if (maxPrice) {
      sql += ` AND price <= $${paramIndex}`;
      params.push(Number(maxPrice));
      paramIndex++;
    }

    if (bounds) {
      const [swLat, swLng, neLat, neLng] = bounds.split(',').map(Number);
      sql += ` AND lat BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      sql += ` AND lng BETWEEN $${paramIndex + 2} AND $${paramIndex + 3}`;
      params.push(swLat, neLat, swLng, neLng);
      paramIndex += 4;
    }

    // Sorting
    const sortMap: Record<string, string> = {
      upside_score: 'upside_score DESC NULLS LAST',
      price: 'price ASC NULLS LAST',
      cap_rate: 'cap_rate DESC NULLS LAST',
      vacancy: 'vacancy_rate DESC NULLS LAST',
    };
    sql += ` ORDER BY ${sortMap[sortBy] || sortMap.upside_score}`;
    sql += ` LIMIT $${paramIndex}`;
    params.push(Number(limit));

    const rows = await query<PropertyRow>(sql, params);
    const properties = rows.map(transformProperty);

    return NextResponse.json({ properties, count: properties.length });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initSchema();
    const body = await request.json();
    const {
      externalId,
      name,
      address,
      city,
      state,
      zip,
      latitude,
      longitude,
      price,
      sqft,
      vacancyRate,
      capRate,
      upsideScore,
      propertyType,
      yearBuilt,
      lotSize,
      tenantCount,
      listingUrl,
      imageUrl,
      source,
    } = body;

    const result = await queryOne<PropertyRow>(
      `INSERT INTO properties (
        external_id, name, address, city, state, zip, lat, lng,
        price, sqft, vacancy_rate, cap_rate, upside_score,
        property_type, year_built, lot_size, tenant_count,
        listing_url, image_url, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (external_id) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        vacancy_rate = EXCLUDED.vacancy_rate,
        cap_rate = EXCLUDED.cap_rate,
        upside_score = EXCLUDED.upside_score,
        updated_at = NOW(),
        scraped_at = NOW()
      RETURNING *`,
      [
        externalId,
        name,
        address,
        city,
        state,
        zip,
        latitude,
        longitude,
        price,
        sqft,
        vacancyRate,
        capRate,
        upsideScore,
        propertyType,
        yearBuilt,
        lotSize,
        tenantCount,
        listingUrl,
        imageUrl,
        source,
      ]
    );

    return NextResponse.json({ property: result ? transformProperty(result) : null });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { error: 'Failed to create property', details: String(error) },
      { status: 500 }
    );
  }
}
