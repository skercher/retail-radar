import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: (string | number | boolean | null | undefined)[]
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
  params?: (string | number | boolean | null | undefined)[]
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
        source VARCHAR(50),
        scraped_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(lat, lng);
      CREATE INDEX IF NOT EXISTS idx_properties_upside ON properties(upside_score DESC);
      CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(source);
      CREATE INDEX IF NOT EXISTS idx_properties_city_state ON properties(city, state);

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
    `);
  } finally {
    client.release();
  }
}

export default pool;
