# Nervs Waste Incident Dashboard

Vercel-ready React + Vite dashboard for the Nervs waste data collection exercise.

## Live data source
The dashboard reads directly from the published KoboToolbox CSV:

https://eu.kobotoolbox.org/api/v2/assets/aaYJotxgaw6j3TzANYkCnN/export-settings/esDwByc2Q5Xc2iiSnctpFBF/data.csv

No sample Excel records are bundled or used as a fallback.

## Data fields displayed
- Local Government
- Waste Category
- Latitude / Longitude
- Picture_URL

Kobo internal fields are ignored by the dashboard.

## Local development
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
```

## Vercel
Import the GitHub repository into Vercel. Vercel will detect Vite automatically.

Optional environment variables:
```text
VITE_DATA_URL=https://eu.kobotoolbox.org/api/v2/assets/aaYJotxgaw6j3TzANYkCnN/export-settings/esDwByc2Q5Xc2iiSnctpFBF/data.csv
VITE_REFRESH_MS=60000
```

## Important: browser access to Kobo
The dashboard requests the published CSV directly from the browser. If the deployed Vercel site shows a CORS/network error, use a Vercel serverless proxy to fetch the Kobo CSV server-side. Do not expose Kobo API credentials in frontend code.
