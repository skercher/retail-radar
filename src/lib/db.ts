import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function query<T = Record<string, unknown>>(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

// Initialize schema
export async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255) UNIQUE,
        name VARCHAR(500) NOT NULL,
        address VARCHAR(500),
        city VARCHAR(100),
        state VARCHAR(50),
        zip VARCHAR(20),
        lat DECIMAL(10, 7),
        lng DECIMAL(10, 7),
        price DECIMAL(15, 2),
        sqft INTEGER,
        vacancy_rate DECIMAL(5, 2),
        cap_rate DECIMAL(5, 2),
        upside_score INTEGER,
        property_type VARCHAR(50),
        year_built INTEGER,
        lot_size DECIMAL(10, 2),
        tenant_count INTEGER,
        listing_url TEXT,
        image_url TEXT,
        images TEXT[],
        google_place_id VARCHAR(255),
        google_rating DECIMAL(2, 1),
        source VARCHAR(50),
        scraped_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(lat, lng);
      CREATE INDEX IF NOT EXISTS idx_properties_upside ON properties(upside_score DESC);
      CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(source);
      CREATE INDEX IF NOT EXISTS idx_properties_city_state ON properties(city, state);
      
      -- Geospatial index for distance queries
      CREATE INDEX IF NOT EXISTS idx_properties_geo ON properties USING gist (
        point(lng, lat)
      );

      CREATE TABLE IF NOT EXISTS saved_properties (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id),
        user_id VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS scraper_runs (
        id SERIAL PRIMARY KEY,
        source VARCHAR(50),
        status VARCHAR(20),
        properties_found INTEGER DEFAULT 0,
        properties_added INTEGER DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS scraper_jobs (
        id SERIAL PRIMARY KEY,
        job_id VARCHAR(255) UNIQUE,
        source VARCHAR(50),
        location VARCHAR(255),
        radius_miles INTEGER,
        status VARCHAR(20) DEFAULT 'pending',
        properties_found INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        started_at TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);
    
    // Add columns if they don't exist (for migrations)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='images') THEN
          ALTER TABLE properties ADD COLUMN images TEXT[];
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='google_place_id') THEN
          ALTER TABLE properties ADD COLUMN google_place_id VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='google_rating') THEN
          ALTER TABLE properties ADD COLUMN google_rating DECIMAL(2, 1);
        END IF;
      END $$;
    `);
  } finally {
    client.release();
  }
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default pool;
