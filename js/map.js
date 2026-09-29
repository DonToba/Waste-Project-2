let map;
let markerLayer;

function initializeMap() {
  map = L.map("map").setView(
    CONFIG.MAP.initialCenter,
    CONFIG.MAP.initialZoom
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);
}

function validCoordinates(record) {
  return (
    Number.isFinite(record.latitude) &&
    Number.isFinite(record.longitude) &&
    record.latitude >= -90 &&
    record.latitude <= 90 &&
    record.longitude >= -180 &&
    record.longitude <= 180
  );
}

function renderMap(records) {
  markerLayer.clearLayers();

  const mapped = records.filter(validCoordinates);
  const bounds = [];

  mapped.forEach(record => {
    const marker = L.marker([record.latitude, record.longitude]);

    const image = record.picture
      ? `<div class="popup-image"><img src="${escapeAttribute(record.picture)}" alt="Survey image"></div>`
      : "";

    marker.bindPopup(`
      ${image}
      <div class="popup">
        <strong>${escapeHtml(record.name || "Unnamed respondent")}</strong>
        <div>${escapeHtml(record.category || "No category")}</div>
        <div>${escapeHtml(record.lga || "No LGA")}</div>
        <div>${record.latitude.toFixed(6)}, ${record.longitude.toFixed(6)}</div>
        ${record.submissionTime ? `<small>${escapeHtml(formatDate(record.submissionTime))}</small>` : ""}
      </div>
    `);

    marker.addTo(markerLayer);
    bounds.push([record.latitude, record.longitude]);
  });

  document.getElementById("mapCount").textContent =
    `${mapped.length.toLocaleString()} point${mapped.length === 1 ? "" : "s"}`;

  if (bounds.length) {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("javascript:", "");
}
