function cleanValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function findField(record, candidates) {
  const keys = Object.keys(record || {});
  for (const candidate of candidates) {
    const exact = keys.find(k => k.trim() === candidate);
    if (exact) return cleanValue(record[exact]);

    const loose = keys.find(
      k => k.trim().toLowerCase() === candidate.toLowerCase()
    );
    if (loose) return cleanValue(record[loose]);
  }
  return "";
}

function normaliseRecord(record) {
  const lat = findField(record, [
    "_Coordinates_latitude",
    "Coordinates_latitude",
    "latitude",
    "Latitude"
  ]);

  const lon = findField(record, [
    "_Coordinates_longitude",
    "Coordinates_longitude",
    "longitude",
    "Longitude"
  ]);

  const picture = findField(record, ["Picture_URL", "Picture URL", "Picture"]);

  return {
    raw: record,
    name: findField(record, ["Name", "name"]),
    category: findField(record, ["Waste Category", "Waste_Category"]),
    lga: findField(record, ["Local Government", "Local_Government"]),
    coordinates: findField(record, ["Coordinates", "coordinates"]),
    latitude: Number.parseFloat(lat),
    longitude: Number.parseFloat(lon),
    picture,
    submissionTime: findField(record, [
      "_submission_time",
      "submission_time",
      "Submission Time"
    ]),
    uuid: findField(record, ["_uuid", "uuid"]),
    status: findField(record, ["_status", "status"])
  };
}

async function loadPublishedCSV() {
  return new Promise((resolve, reject) => {
    Papa.parse(CONFIG.DATA_URL + "&cacheBust=" + Date.now(), {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: header => header.trim(),
      complete: results => {
        if (results.errors && results.errors.length) {
          console.warn("CSV parsing warnings:", results.errors);
        }

        const rows = (results.data || [])
          .filter(row => Object.values(row).some(v => cleanValue(v) !== ""))
          .map(normaliseRecord);

        resolve(rows);
      },
      error: error => reject(error)
    });
  });
}

function getUniqueValues(records, key) {
  return [...new Set(
    records.map(r => cleanValue(r[key])).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));
}

function getFilteredRecords(records, filters) {
  const query = filters.search.toLowerCase();

  return records.filter(record => {
    const lgaMatch = !filters.lga || record.lga === filters.lga;
    const categoryMatch =
      !filters.category || record.category === filters.category;

    const searchMatch =
      !query ||
      [
        record.name,
        record.category,
        record.lga,
        record.coordinates,
        record.uuid
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

    return lgaMatch && categoryMatch && searchMatch;
  });
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
