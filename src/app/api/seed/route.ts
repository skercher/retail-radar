import { NextResponse } from 'next/server';
import { query, initSchema } from '@/lib/db';
import { sampleProperties } from '@/data/sample-properties';

export async function POST() {
  try {
    // Initialize schema
    await initSchema();

    // Insert sample properties
    for (const prop of sampleProperties) {
      await query(
        `INSERT INTO properties (
          external_id, name, address, city, state, zip, lat, lng,
          price, sqft, vacancy_rate, cap_rate, upside_score,
          property_type, year_built, lot_size, tenant_count,
          listing_url, image_url, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (external_id) DO NOTHING`,
        [
          `sample-${prop.id}`,
          prop.name,
          prop.address,
          prop.city,
          prop.state,
          prop.zip,
          prop.latitude,
          prop.longitude,
          prop.price,
          prop.sqft,
          prop.vacancyRate,
          prop.capRate,
          prop.upsideScore,
          prop.propertyType,
          prop.yearBuilt,
          prop.lotSize,
          prop.tenantCount,
          prop.listingUrl || null,
          prop.imageUrl || null,
          prop.source,
        ]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Seeded ${sampleProperties.length} properties` 
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}
