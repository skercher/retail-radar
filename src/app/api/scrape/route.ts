import { NextRequest, NextResponse } from 'next/server';
import { query, initSchema } from '@/lib/db';
import { calculateUpsideScore } from '@/types/property';
import { scrapeLoopNet, scrapeCREXi, scrapeGooglePlaces, getStreetViewUrl, ScrapedProperty } from '@/lib/scrapers';
import { v4 as uuidv4 } from 'uuid';

// Generate unique job ID
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Geocode location name to coordinates
async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!mapboxToken) return null;

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        location
      )}.json?access_token=${mapboxToken}&country=us&limit=1`
    );
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
}

// Insert scraped properties into database
async function insertProperties(properties: ScrapedProperty[]): Promise<number> {
  let added = 0;

  for (const prop of properties) {
    try {
      // Calculate upside score
      const upsideScore = Math.round(
        calculateUpsideScore({
          vacancyRate: prop.vacancyRate,
          capRate: prop.capRate,
          pricePerSqft: prop.sqft > 0 ? prop.price / prop.sqft : 0,
        })
      );

      // If no image, try to get Street View
      let imageUrl = prop.imageUrl;
      if (!imageUrl && prop.lat && prop.lng) {
        imageUrl = getStreetViewUrl(prop.lat, prop.lng);
      }

      const result = await query(
        `INSERT INTO properties (
          external_id, name, address, city, state, zip, lat, lng,
          price, sqft, vacancy_rate, cap_rate, upside_score,
          property_type, year_built, lot_size, tenant_count,
          listing_url, image_url, images, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (external_id) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          vacancy_rate = EXCLUDED.vacancy_rate,
          cap_rate = EXCLUDED.cap_rate,
          upside_score = EXCLUDED.upside_score,
          image_url = COALESCE(EXCLUDED.image_url, properties.image_url),
          images = COALESCE(EXCLUDED.images, properties.images),
          scraped_at = NOW(),
          updated_at = NOW()
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
          imageUrl,
          prop.images?.length ? prop.images : null,
          prop.source,
        ]
      );

      if (result.length > 0) added++;
    } catch (error) {
      console.error('Error inserting property:', prop.name, error);
    }
  }

  return added;
}

export async function POST(request: NextRequest) {
  try {
    await initSchema();

    const body = await request.json();
    const { 
      source = 'all', 
      location = 'denver', 
      lat,
      lng,
      radius = 25, // miles
      async: runAsync = false,
    } = body;

    const jobId = generateJobId();
    
    // Create job record
    await query(
      `INSERT INTO scraper_jobs (job_id, source, location, radius_miles, status) 
       VALUES ($1, $2, $3, $4, 'pending')`,
      [jobId, source, location, radius]
    );

    // If async mode, return immediately with job ID
    if (runAsync) {
      // Start scraping in background (in production, use a queue)
      runScrapingJob(jobId, source, location, lat, lng, radius).catch(console.error);
      
      return NextResponse.json({
        success: true,
        jobId,
        status: 'pending',
        message: 'Scraping job started. Check status with GET /api/scrape?jobId=' + jobId,
      });
    }

    // Synchronous mode - run scraping and wait
    const result = await runScrapingJob(jobId, source, location, lat, lng, radius);
    
    return NextResponse.json({
      success: true,
      jobId,
      ...result,
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      { error: 'Scraping failed', details: String(error) },
      { status: 500 }
    );
  }
}

async function runScrapingJob(
  jobId: string,
  source: string,
  location: string,
  lat?: number,
  lng?: number,
  radius: number = 25
): Promise<{ found: number; added: number; source: string; location: string }> {
  try {
    // Update job to running
    await query(
      `UPDATE scraper_jobs SET status = 'running', started_at = NOW() WHERE job_id = $1`,
      [jobId]
    );

    // Get coordinates if not provided
    let coords = lat && lng ? { lat, lng } : null;
    if (!coords) {
      coords = await geocodeLocation(location);
    }

    let allProperties: ScrapedProperty[] = [];

    // Run scrapers based on source
    if (source === 'all' || source === 'loopnet') {
      try {
        const loopnetProps = await scrapeLoopNet(location, radius);
        allProperties = [...allProperties, ...loopnetProps];
      } catch (e) {
        console.error('LoopNet scraper error:', e);
      }
    }

    if (source === 'all' || source === 'crexi') {
      try {
        const crexiProps = await scrapeCREXi(location, radius);
        allProperties = [...allProperties, ...crexiProps];
      } catch (e) {
        console.error('CREXi scraper error:', e);
      }
    }

    if ((source === 'all' || source === 'google') && coords) {
      try {
        // Convert miles to meters (1 mile = 1609.34 meters)
        const radiusMeters = Math.min(radius * 1609.34, 50000); // Max 50km for Google Places
        const googleProps = await scrapeGooglePlaces(coords.lat, coords.lng, radiusMeters);
        allProperties = [...allProperties, ...googleProps];
      } catch (e) {
        console.error('Google Places scraper error:', e);
      }
    }

    // Insert all properties
    const added = await insertProperties(allProperties);

    // Update job to completed
    await query(
      `UPDATE scraper_jobs 
       SET status = 'completed', 
           properties_found = $1, 
           completed_at = NOW() 
       WHERE job_id = $2`,
      [allProperties.length, jobId]
    );

    // Also log to scraper_runs for backwards compatibility
    await query(
      `INSERT INTO scraper_runs (source, status, properties_found, properties_added, completed_at) 
       VALUES ($1, 'completed', $2, $3, NOW())`,
      [source, allProperties.length, added]
    );

    return {
      found: allProperties.length,
      added,
      source,
      location,
    };
  } catch (error) {
    // Update job to failed
    await query(
      `UPDATE scraper_jobs 
       SET status = 'failed', 
           error_message = $1, 
           completed_at = NOW() 
       WHERE job_id = $2`,
      [String(error), jobId]
    );

    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    await initSchema();

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Get specific job status
      const jobs = await query(
        `SELECT * FROM scraper_jobs WHERE job_id = $1`,
        [jobId]
      );

      if (jobs.length === 0) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ job: jobs[0] });
    }

    // Get recent jobs and runs
    const jobs = await query(
      `SELECT * FROM scraper_jobs ORDER BY created_at DESC LIMIT 10`
    );

    const runs = await query(
      `SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 10`
    );

    return NextResponse.json({ jobs, runs });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get scraper status', details: String(error) },
      { status: 500 }
    );
  }
}
