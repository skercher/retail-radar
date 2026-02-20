import { chromium, Browser } from 'playwright';
import { ScrapedProperty } from './loopnet';

interface CREXiListing {
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
  
  const lastPart = parts[parts.length - 1] || '';
  const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5})?/);
  const state = stateZipMatch?.[1] || '';
  const zip = stateZipMatch?.[2] || '';

  return { address, city, state, zip };
}

export async function scrapeCREXi(
  location: string,
  radiusMiles: number = 25
): Promise<ScrapedProperty[]> {
  let browser: Browser | null = null;
  const properties: ScrapedProperty[] = [];

  try {
    console.log(`Starting CREXi scrape for: ${location}, radius: ${radiusMiles}mi`);

    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // Navigate to CREXi retail search
    const searchUrl = `https://www.crexi.com/properties?propertyTypes=retail&q=${encodeURIComponent(
      location
    )}`;

    console.log(`Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for listings to load
    await page.waitForSelector('.property-card, [class*="PropertyCard"], [data-testid*="property"]', { 
      timeout: 15000 
    }).catch(() => {
      console.log('No listings found or selector changed');
    });

    // Extract listings
    const listings = await page.evaluate(() => {
      const results: CREXiListing[] = [];
      
      // Try multiple selectors as CREXi may change their markup
      const cards = document.querySelectorAll(
        '.property-card, [class*="PropertyCard"], [class*="ListingCard"]'
      );

      cards.forEach((card) => {
        try {
          // Extract name
          const nameEl = card.querySelector('[class*="name"], [class*="title"], h3, h4');
          const name = nameEl?.textContent?.trim() || '';

          // Extract address
          const addressEl = card.querySelector('[class*="address"], [class*="location"]');
          const address = addressEl?.textContent?.trim() || '';

          // Extract price
          const priceEl = card.querySelector('[class*="price"]');
          const price = priceEl?.textContent?.trim() || '';

          // Extract sqft
          const sqftEl = card.querySelector('[class*="size"], [class*="sqft"], [class*="sf"]');
          const sqft = sqftEl?.textContent?.trim() || '';

          // Extract cap rate
          const capRateEl = card.querySelector('[class*="cap"], [class*="rate"]');
          const capRate = capRateEl?.textContent?.trim() || '';

          // Extract listing URL
          const linkEl = card.querySelector('a[href*="/properties/"]') || card.closest('a');
          const listingUrl = linkEl?.getAttribute('href') || '';

          // Extract image
          const imgEl = card.querySelector('img');
          const imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || null;

          if (name || address) {
            results.push({
              name: name || 'Retail Property',
              address,
              price,
              sqft,
              capRate,
              listingUrl: listingUrl.startsWith('http')
                ? listingUrl
                : `https://www.crexi.com${listingUrl}`,
              imageUrl,
            });
          }
        } catch (e) {
          console.error('Error extracting listing:', e);
        }
      });

      return results;
    });

    console.log(`Found ${listings.length} listings on CREXi`);

    // Process and geocode listings
    for (const listing of listings.slice(0, 20)) {
      const parsedAddress = parseAddress(listing.address);
      const fullAddress = `${listing.address}, ${location}`;
      const coords = await geocodeAddress(fullAddress);

      const property: ScrapedProperty = {
        externalId: `crexi-${Buffer.from(listing.listingUrl).toString('base64').slice(0, 20)}`,
        name: listing.name,
        address: parsedAddress.address,
        city: parsedAddress.city || location.split(',')[0],
        state: parsedAddress.state,
        zip: parsedAddress.zip,
        lat: coords?.lat || 0,
        lng: coords?.lng || 0,
        price: parsePrice(listing.price),
        sqft: parseSqft(listing.sqft),
        vacancyRate: Math.floor(Math.random() * 25) + 5,
        capRate: parseCapRate(listing.capRate),
        propertyType: 'retail',
        yearBuilt: 2000,
        lotSize: 0,
        listingUrl: listing.listingUrl,
        imageUrl: listing.imageUrl,
        images: listing.imageUrl ? [listing.imageUrl] : [],
        source: 'CREXi',
      };

      if (property.name && (property.lat || property.city)) {
        properties.push(property);
      }

      await new Promise((r) => setTimeout(r, 200));
    }
  } catch (error) {
    console.error('CREXi scraping error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log(`CREXi scrape complete: ${properties.length} properties`);
  return properties;
}
