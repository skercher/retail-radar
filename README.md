# RetailRadar 🎯

AI-powered retail commercial real estate dashboard with vacancy upside detection.

## Features

- **Interactive Map**: Visualize retail properties across the United States
- **Upside Scoring**: Proprietary algorithm to identify properties with vacancy improvement potential
- **Smart Filters**: Filter by cap rate, vacancy, price, and upside score
- **Data Aggregation**: Scrapes multiple sources (LoopNet, CREXi, public records)

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Map**: Mapbox GL JS
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Railway

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

## Deployment

This app is configured for Railway deployment:

1. Push to GitHub
2. Connect repo to Railway
3. Set environment variables in Railway dashboard
4. Deploy!

## Upside Score Calculation

The upside score (0-100) considers:
- **Vacancy vs Market**: Properties with vacancy higher than market average have room to improve NOI
- **Cap Rate Premium**: Higher cap rates indicate potential value
- **Price per SF**: Below-market pricing suggests opportunity
- **Sweet Spot**: 10-30% vacancy with strong fundamentals = highest scores

## Roadmap

- [ ] Live data scraping (LoopNet, CREXi)
- [ ] AI property analysis with GPT-4
- [ ] Saved searches & alerts
- [ ] Market comparables
- [ ] Investment calculator
- [ ] PDF export

## License

MIT
