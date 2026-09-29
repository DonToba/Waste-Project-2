import Papa from 'papaparse';

const DATA_URL = import.meta.env.VITE_DATA_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQafWS5_N0LDnjEFJ1iozwYDNHfaQJHTUQOkbL4VI6SUo6SGXOb_tzuGoUWrNmdKhgWtlFaYJW5P_bU/pub?gid=0&single=true&output=csv';
const REFRESH_MS = Number(import.meta.env.VITE_REFRESH_MS || 60000);

const aliases = {
  name: ['Name','name'],
  lga: ['Local Government','LGA','local_government','lga_name'],
  category: ['Waste Category','Waste_Category','waste_category','Category'],
  lat: ['_Coordinates_latitude','Coordinates_latitude','latitude','Latitude','lat'],
  lon: ['_Coordinates_longitude','Coordinates_longitude','longitude','Longitude','lon'],
  picture: ['Picture_URL','Picture URL','picture_url','Image URL','image_url'],
  submitted: ['_submission_time','submission_time','Submission Time'],
  uuid: ['_uuid','uuid'],
  status: ['_status','status']
};

function find(row, names){
  const key = Object.keys(row).find(k => names.some(n => k.trim().toLowerCase() === n.toLowerCase()));
  return key ? row[key] : '';
}

// Simplified Lagos State AOI polygon. Used as an operational screening boundary.
// Points outside this polygon are flagged for review; they are not discarded.
const LAGOS_AOI = [
  [6.708, 3.000], [6.875, 3.270], [6.885, 3.560], [6.835, 3.720],
  [6.760, 3.900], [6.650, 4.015], [6.500, 4.080], [6.405, 4.000],
  [6.335, 3.820], [6.290, 3.560], [6.285, 3.250], [6.305, 2.980],
  [6.360, 2.790], [6.430, 2.690], [6.535, 2.690], [6.625, 2.800]
];

function pointInPolygon(lat, lon, polygon=LAGOS_AOI){
  let inside = false;
  for(let i=0, j=polygon.length-1; i<polygon.length; j=i++){
    const yi=polygon[i][0], xi=polygon[i][1];
    const yj=polygon[j][0], xj=polygon[j][1];
    const intersects = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj-xi) * (lat-yi) / ((yj-yi) || Number.EPSILON) + xi);
    if(intersects) inside=!inside;
  }
  return inside;
}

function coordinateKey(lat, lon){
  if(!Number.isFinite(lat) || !Number.isFinite(lon)) return '';
  return `${lat.toFixed(6)},${lon.toFixed(6)}`;
}

export function normalizeRows(rows){
  const normalized = rows.map((row, i) => {
    const lat = Number(find(row, aliases.lat));
    const lon = Number(find(row, aliases.lon));
    const name = String(find(row, aliases.name) || '').trim();
    const lga = String(find(row, aliases.lga) || '').trim();
    const category = String(find(row, aliases.category) || '').trim();

    return {
      id: String(find(row, aliases.uuid) || i + 1),
      name: name || 'Unknown Submitter',
      lga: lga || 'Unknown',
      category: category || 'Unclassified',
      lat,
      lon,
      coordinateKey: coordinateKey(lat, lon),
      inLagosAOI: Number.isFinite(lat) && Number.isFinite(lon) ? pointInPolygon(lat, lon) : false,
      picture: String(find(row, aliases.picture) || '').trim(),
      submitted: String(find(row, aliases.submitted) || '').trim(),
      status: String(find(row, aliases.status) || '').trim()
    };
  });

  const coordinateCounts = {};
  normalized.forEach(row => {
    if(row.coordinateKey) coordinateCounts[row.coordinateKey] = (coordinateCounts[row.coordinateKey] || 0) + 1;
  });

  return normalized.map(row => ({
    ...row,
    duplicate: Boolean(row.coordinateKey && coordinateCounts[row.coordinateKey] > 1),
    coordinateCount: row.coordinateKey ? coordinateCounts[row.coordinateKey] : 0,
    errors: [
      !Number.isFinite(row.lat) || !Number.isFinite(row.lon) ? 'Invalid or missing coordinates' : '',
      Number.isFinite(row.lat) && Number.isFinite(row.lon) && !row.inLagosAOI ? 'Outside Lagos AOI' : '',
      row.duplicate ? 'Duplicate coordinates' : '',
      row.name === 'Unknown Submitter' ? 'Missing Name' : '',
      row.lga === 'Unknown' ? 'Missing Local Government' : '',
      row.category === 'Unclassified' ? 'Missing Waste Category' : ''
    ].filter(Boolean)
  }));
}

export async function loadData(){
  const res = await fetch(`${DATA_URL}${DATA_URL.includes('?') ? '&' : '?'}_=${Date.now()}`, {cache:'no-store'});
  if(!res.ok) throw new Error(`Data source returned ${res.status}`);
  return parse(await res.text());
}

function parse(csv){
  const result = Papa.parse(csv, {header:true, skipEmptyLines:true, transformHeader: h => h.trim()});
  return normalizeRows(result.data);
}

export { REFRESH_MS, LAGOS_AOI };
