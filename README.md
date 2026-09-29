# Nervs Waste Survey Dashboard

A static web dashboard that reads the Nervs survey directly from the published Google Sheets CSV.

## Data architecture

KoboToolbox
→ Google Sheet
→ Published CSV
→ Dashboard

The dashboard does not contain a Kobo API token.

## Published data source

https://docs.google.com/spreadsheets/d/e/2PACX-1vQafWS5_N0LDnjEFJ1iozwYDNHfaQJHTUQOkbL4VI6SUo6SGXOb_tzuGoUWrNmdKhgWtlFaYJW5P_bU/pub?gid=0&single=true&output=csv

## Main features

- Live CSV loading using Papa Parse
- Automatic refresh every 5 minutes
- Manual refresh button
- Local Government filter
- Waste Category filter
- Search
- Total records
- Records with valid coordinates
- Number of LGAs
- Number of waste categories
- Interactive Leaflet map
- Survey point popups
- Category distribution chart
- LGA distribution chart
- Recent submissions
- Full filtered data table
- Picture links where available

## Deployment

### GitHub Pages

1. Create a GitHub repository.
2. Upload the files and folders in this project.
3. Go to Settings → Pages.
4. Select the main branch and `/root`.
5. Save.
6. GitHub will provide the dashboard URL.

### Vercel

1. Import the GitHub repository.
2. Framework preset: Other / Static.
3. Deploy.

No build command is required.

## Updating the source

The dashboard reads the published CSV in `js/config.js`.

If the Google Sheet publication URL changes, replace `CONFIG.DATA_URL`.

## Important

The published Google Sheet must remain accessible to anyone with the published link. The dashboard cannot access a private Google Sheet without an authenticated backend.
