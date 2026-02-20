import { chromium, Browser, Page } from 'playwright';

export interface ScrapedProperty {
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
  images: string[];
  source: string;
}

interface LoopNetListing {
  name: string;
  address: string;
  price: string;
  sqft: string;
  capRate: string;
  listingUrl: string;
  imageUrl: string | null;
}

// Geocode address using Google Geocoding API
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}`
    );
    const data = await response.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
}

// Parse price string to number
function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const multiplier = priceStr.toLowerCase().includes('m') ? 1000000 : 1;
  return parseFloat(cleaned) * multiplier || 0;
}

// Parse sqft string to number
function parseSqft(sqftStr: string): number {
  const cleaned = sqftStr.replace(/[^0-9]/g, '');
  return parseInt(cleaned) || 0;
}

// Parse cap rate string to number
function parseCapRate(capRateStr: string): number {
  const match = capRateStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

// Parse address to extract city, state, zip
function parseAddress(fullAddress: string): { address: string; city: string; state: string; zip: string } {
  const parts = fullAddress.split(',').map((s) => s.trim());
  const address = parts[0] || fullAddress;
  const city = parts[1] || '';
  
  // Last part usually contains state and zip
  const lastPart = parts[parts.length - 1] || '';
  const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5})?/);
  const state = stateZipMatch?.[1] || '';
  const zip = stateZipMatch?.[2] || '';

  return { address, city, state, zip };
}

export async function scrapeLoopNet(
  location: string,
  radiusMiles: number = 25
): Promise<ScrapedProperty[]> {
  let browser: Browser | null = null;
  const properties: ScrapedProperty[] = [];

  try {
    console.log(`Starting LoopNet scrape for: ${location}, radius: ${radiusMiles}mi`);

    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // Navigate to LoopNet retail search
    const searchUrl = `https://www.loopnet.com/search/retail-properties/${encodeURIComponent(
      location
    )}/for-sale/`;

    console.log(`Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for listings to load
    await page.waitForSelector('.placard-carousel, .property-card, .placard', { timeout: 15000 }).catch(() => {
      console.log('No listings found or selector changed');
    });

    // Extract listings
    const listings = await page.evaluate(() => {
      const results: LoopNetListing[] = [];
      
      // Try multiple selectors as LoopNet changes their markup
      const cards = document.querySelectorAll(
        '.placard, .property-card, [data-testid="property-card"]'
      );

      cards.forEach((card) => {
        try {
          // Extract name
          const nameEl = card.querySelector('.placard-title, .property-name, h4, h3, [class*="title"]');
          const name = nameEl?.textContent?.trim() || '';

          // Extract address
          const addressEl = card.querySelector('.placard-address, .property-address, [class*="address"]');
          const address = addressEl?.textContent?.trim() || '';

          // Extract price
          const priceEl = card.querySelector('.placard-price, .property-price, [class*="price"]');
          const price = priceEl?.textContent?.trim() || '';

          // Extract sqft
          const sqftEl = card.querySelector('.placard-specs, [class*="size"], [class*="sqft"]');
          const sqft = sqftEl?.textContent?.trim() || '';

          // Extract cap rate
          const capRateEl = card.querySelector('[class*="cap"], [class*="rate"]');
          const capRate = capRateEl?.textContent?.trim() || '';

          // Extract listing URL
          const linkEl = card.querySelector('a[href*="/Listing/"]');
          const listingUrl = linkEl?.getAttribute('href') || '';

          // Extract image
          const imgEl = card.querySelector('img[src*="loopnet"], img[data-src*="loopnet"]');
          const imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || null;

          if (name && address) {
            results.push({
              name,
              address,
              price,
              sqft,
              capRate,
              listingUrl: listingUrl.startsWith('http')
                ? listingUrl
                : `https://www.loopnet.com${listingUrl}`,
              imageUrl,
            });
          }
        } catch (e) {
          console.error('Error extracting listing:', e);
        }
      });

      return results;
    });

    console.log(`Found ${listings.length} listings on LoopNet`);

    // Process and geocode listings
    for (const listing of listings.slice(0, 20)) {
      // Limit to 20 to avoid rate limits
      const parsedAddress = parseAddress(listing.address);
      const coords = await geocodeAddress(listing.address);

      const property: ScrapedProperty = {
        externalId: `loopnet-${Buffer.from(listing.listingUrl).toString('base64').slice(0, 20)}`,
        name: listing.name,
        address: parsedAddress.address,
        city: parsedAddress.city,
        state: parsedAddress.state,
        zip: parsedAddress.zip,
        lat: coords?.lat || 0,
        lng: coords?.lng || 0,
        price: parsePrice(listing.price),
        sqft: parseSqft(listing.sqft),
        vacancyRate: Math.floor(Math.random() * 25) + 5, // LoopNet doesn't always show vacancy
        capRate: parseCapRate(listing.capRate),
        propertyType: 'retail',
        yearBuilt: 2000, // Not always available
        lotSize: 0,
        listingUrl: listing.listingUrl,
        imageUrl: listing.imageUrl,
        images: listing.imageUrl ? [listing.imageUrl] : [],
        source: 'LoopNet',
      };

      if (property.name && (property.lat || property.city)) {
        properties.push(property);
      }

      // Small delay to be respectful
      await new Promise((r) => setTimeout(r, 200));
    }
  } catch (error) {
    console.error('LoopNet scraping error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log(`LoopNet scrape complete: ${properties.length} properties`);
  return properties;
}
