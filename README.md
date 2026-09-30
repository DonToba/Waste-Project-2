# Nervs Waste Incident Dashboard

Vercel-ready React + Vite dashboard for the Nervs waste data collection exercise.

## Live data source
The dashboard reads directly from the published KoboToolbox CSV:

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


## Important: browser access to Kobo
The dashboard requests the published CSV directly from the browser. If the deployed Vercel site shows a CORS/network error, use a Vercel serverless proxy to fetch the Kobo CSV server-side. Do not expose Kobo API credentials in frontend code.


## Lagos AOI validation

Every submission with valid latitude/longitude is screened against the embedded Lagos AOI polygon. Records outside the AOI are retained but flagged as **Outside Lagos AOI** and counted as data-integrity errors. They are highlighted in amber on the map.

The AOI is currently an embedded screening polygon in `src/data.js`. For production enforcement, replace `LAGOS_AOI` with the official Lagos State/AOI GeoJSON boundary supplied by the project.

## Leaderboard name matching

