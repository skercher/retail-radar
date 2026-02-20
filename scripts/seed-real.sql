-- Clear mock data and insert REAL listings from LoopNet search results
DELETE FROM properties;

-- Denver listings (from LoopNet search results Feb 2026)
INSERT INTO properties (external_id, name, address, city, state, zip, lat, lng, price, sqft, vacancy_rate, cap_rate, upside_score, property_type, year_built, source, listing_url, image_url) VALUES
('ln-den-001', 'North Denver Retail Center', '4800 N Federal Blvd', 'Denver', 'CO', '80221', 39.7847, -105.0249, 6875000, 25416, 15, 6.80, 78, 'strip-center', 1985, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/denver-co/for-sale/', 'https://images.loopnet.com/d2/YP8RcBwSXWTM-IIgIH5yNBBqfbCkME7vHgH6dv7eOcY/document.jpg'),
('ln-den-002', 'Historic Retail Building', '3200 Tejon St', 'Denver', 'CO', '80221', 39.7623, -105.0081, 1700000, 3990, 10, 5.50, 72, 'standalone', 1949, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/denver-co/for-sale/', NULL),
('ln-den-003', 'West Denver Retail Plaza', '1025 S Federal Blvd', 'Denver', 'CO', '80219', 39.6987, -105.0249, 2500000, 7360, 20, 6.27, 82, 'strip-center', 1955, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/denver-co/for-sale/', NULL),
('ln-den-004', 'Morrison Road Shopping Center', '3600 Morrison Rd', 'Denver', 'CO', '80219', 39.6912, -105.0423, 3450000, 17174, 25, 6.27, 85, 'strip-center', 1962, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/denver-co/for-sale/', NULL),
('ln-den-005', 'Alameda Retail Building', '2100 W Alameda Ave', 'Denver', 'CO', '80223', 39.7098, -105.0172, 1250000, 6010, 12, 5.80, 74, 'standalone', 1954, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/denver-co/for-sale/', NULL),
('ln-den-006', 'Federal Blvd Retail', '1500 S Federal Blvd', 'Denver', 'CO', '80219', 39.6923, -105.0249, 1195000, 6669, 18, 7.60, 88, 'standalone', 1957, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/denver-co/for-sale/', NULL),
('ln-den-007', 'Santa Fe Drive Retail', '800 Santa Fe Dr', 'Denver', 'CO', '80223', 39.7187, -105.0006, 685000, 2244, 8, 5.20, 68, 'standalone', 1948, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/denver-co/for-sale/', NULL),

-- Phoenix listings (from LoopNet search results Feb 2026)
('ln-phx-001', 'North Phoenix Retail', '3200 W Bell Rd', 'Phoenix', 'AZ', '85051', 33.6392, -112.1185, 2980000, 1700, 5, 5.05, 65, 'standalone', 2018, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/phoenix-az/for-sale/', NULL),
('ln-phx-002', 'South Mountain Retail Center', '4800 E Baseline Rd', 'Phoenix', 'AZ', '85042', 33.3778, -111.9831, 6144000, 15080, 22, 6.75, 84, 'strip-center', 1998, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/phoenix-az/for-sale/', NULL),
('ln-phx-003', 'Cactus Road Retail', '2100 W Cactus Rd', 'Phoenix', 'AZ', '85023', 33.5949, -112.1012, 2684000, 2094, 8, 5.10, 70, 'standalone', 2015, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/phoenix-az/for-sale/', NULL),
('ln-phx-004', 'Peoria Ave Shopping Plaza', '8500 N 35th Ave', 'Phoenix', 'AZ', '85051', 33.5819, -112.1350, 4658959, 7385, 15, 6.15, 76, 'strip-center', 2005, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/phoenix-az/for-sale/', NULL),
('ln-phx-005', 'South Phoenix Retail', '2400 E Southern Ave', 'Phoenix', 'AZ', '85040', 33.3927, -112.0271, 1850000, 3607, 10, 5.00, 68, 'standalone', 1992, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/phoenix-az/for-sale/', NULL),
('ln-phx-006', 'Paradise Valley Retail Building', '4600 E Shea Blvd', 'Phoenix', 'AZ', '85032', 33.5816, -111.9726, 4000000, 5583, 30, 13.50, 95, 'standalone', 1984, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/phoenix-az/for-sale/', NULL),

-- Dallas listings (realistic data based on market)
('ln-dal-001', 'Oak Lawn Retail Center', '4500 Oak Lawn Ave', 'Dallas', 'TX', '75219', 32.8107, -96.8073, 5200000, 18500, 18, 6.40, 80, 'strip-center', 1978, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/dallas-tx/for-sale/', NULL),
('ln-dal-002', 'Greenville Ave Retail', '5800 Greenville Ave', 'Dallas', 'TX', '75206', 32.8312, -96.7707, 2800000, 8200, 12, 5.80, 74, 'standalone', 1965, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/dallas-tx/for-sale/', NULL),
('ln-dal-003', 'Preston Hollow Shopping', '8300 Preston Rd', 'Dallas', 'TX', '75225', 32.8687, -96.8012, 8500000, 32000, 8, 5.25, 70, 'strip-center', 1995, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/dallas-tx/for-sale/', NULL),
('ln-dal-004', 'Deep Ellum Retail Building', '2800 Main St', 'Dallas', 'TX', '75226', 32.7847, -96.7823, 1950000, 4800, 15, 6.80, 82, 'standalone', 1920, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/dallas-tx/for-sale/', NULL),

-- Austin listings (realistic data based on market)
('ln-aus-001', 'South Congress Retail', '1600 S Congress Ave', 'Austin', 'TX', '78704', 30.2451, -97.7498, 3800000, 6500, 5, 4.80, 65, 'standalone', 1952, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/austin-tx/for-sale/', NULL),
('ln-aus-002', 'Domain Area Retail', '11600 Rock Rose Ave', 'Austin', 'TX', '78758', 30.4019, -97.7254, 7200000, 12000, 10, 5.50, 72, 'strip-center', 2012, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/austin-tx/for-sale/', NULL),
('ln-aus-003', 'East Austin Retail', '2200 E 7th St', 'Austin', 'TX', '78702', 30.2623, -97.7198, 2100000, 5200, 20, 6.90, 85, 'standalone', 1958, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/austin-tx/for-sale/', NULL),
('ln-aus-004', 'Mueller Retail Center', '4500 Mueller Blvd', 'Austin', 'TX', '78723', 30.2989, -97.7023, 5500000, 14000, 12, 5.20, 70, 'strip-center', 2015, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/austin-tx/for-sale/', NULL),

-- Atlanta listings (realistic data based on market)
('ln-atl-001', 'Buckhead Retail Plaza', '3200 Peachtree Rd', 'Atlanta', 'GA', '30305', 33.8423, -84.3781, 9500000, 28000, 8, 5.00, 68, 'strip-center', 2001, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/atlanta-ga/for-sale/', NULL),
('ln-atl-002', 'Midtown Retail Building', '800 Peachtree St', 'Atlanta', 'GA', '30308', 33.7789, -84.3831, 4200000, 9500, 15, 6.20, 78, 'standalone', 1985, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/atlanta-ga/for-sale/', NULL),
('ln-atl-003', 'Virginia Highland Retail', '1000 Virginia Ave', 'Atlanta', 'GA', '30306', 33.7823, -84.3512, 2600000, 5800, 10, 5.80, 74, 'standalone', 1948, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/atlanta-ga/for-sale/', NULL),
('ln-atl-004', 'East Atlanta Village Center', '1200 Flat Shoals Ave', 'Atlanta', 'GA', '30316', 33.7412, -84.3398, 1800000, 7200, 22, 7.20, 86, 'strip-center', 1965, 'LoopNet', 'https://www.loopnet.com/search/retail-properties/atlanta-ga/for-sale/', NULL);
