let allRecords = [];
let filters = {
  lga: "",
  category: "",
  search: ""
};

function setStatus(text, type = "loading") {
  const element = document.getElementById("connectionStatus");
  element.textContent = text;
  element.className = `status ${type}`;
}

function populateSelect(selectId, values, defaultText) {
  const select = document.getElementById(selectId);
  select.innerHTML = `<option value="">${defaultText}</option>`;

  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function updateFiltersOptions() {
  populateSelect(
    "lgaFilter",
    getUniqueValues(allRecords, "lga"),
    "All Local Governments"
  );

  populateSelect(
    "categoryFilter",
    getUniqueValues(allRecords, "category"),
    "All Waste Categories"
  );
}

function updateCards(records) {
  const mapped = records.filter(validCoordinates);

  document.getElementById("totalRecords").textContent =
    records.length.toLocaleString();

  document.getElementById("mappedRecords").textContent =
    mapped.length.toLocaleString();

  document.getElementById("totalLGAs").textContent =
    getUniqueValues(records, "lga").length.toLocaleString();

  document.getElementById("totalCategories").textContent =
    getUniqueValues(records, "category").length.toLocaleString();
}

function renderRecentTable(records) {
  const body = document.getElementById("recentTable");

  const sorted = [...records].sort((a, b) => {
    return new Date(b.submissionTime || 0) -
           new Date(a.submissionTime || 0);
  }).slice(0, 10);

  body.innerHTML = sorted.map(record => `
    <tr>
      <td>${escapeHtml(record.name || "—")}</td>
      <td>${escapeHtml(record.category || "—")}</td>
      <td>${escapeHtml(record.lga || "—")}</td>
      <td>${escapeHtml(formatDate(record.submissionTime))}</td>
    </tr>
  `).join("");
}

function renderDataTable(records) {
  const body = document.getElementById("dataTableBody");

  const sorted = [...records].sort((a, b) => {
    return new Date(b.submissionTime || 0) -
           new Date(a.submissionTime || 0);
  });

  body.innerHTML = sorted.map(record => `
    <tr>
      <td>${escapeHtml(record.name || "—")}</td>
      <td>${escapeHtml(record.category || "—")}</td>
      <td>${escapeHtml(record.lga || "—")}</td>
      <td>${Number.isFinite(record.latitude) ? record.latitude.toFixed(6) : "—"}</td>
      <td>${Number.isFinite(record.longitude) ? record.longitude.toFixed(6) : "—"}</td>
      <td>${escapeHtml(formatDate(record.submissionTime))}</td>
      <td>
        ${record.picture
          ? `<a href="${escapeAttribute(record.picture)}" target="_blank" rel="noopener">View</a>`
          : "—"}
      </td>
    </tr>
  `).join("");

  document.getElementById("tableSummary").textContent =
    `${records.length.toLocaleString()} record${records.length === 1 ? "" : "s"} shown`;
}

function renderDashboard() {
  const filtered = getFilteredRecords(allRecords, filters);

  updateCards(filtered);
  renderMap(filtered);
  renderCharts(filtered);
  renderRecentTable(filtered);
  renderDataTable(filtered);
}

async function fetchData() {
  setStatus("Updating…", "loading");

  try {
    allRecords = await loadPublishedCSV();

    updateFiltersOptions();
    renderDashboard();

    document.getElementById("lastUpdated").textContent =
      `Loaded ${new Date().toLocaleTimeString("en-NG")}`;

    setStatus("Connected", "success");
  } catch (error) {
    console.error(error);
    setStatus("Data error", "error");
    document.getElementById("lastUpdated").textContent =
      "Could not load published CSV";
  }
}

function resetFilters() {
  filters = {
    lga: "",
    category: "",
    search: ""
  };

  document.getElementById("lgaFilter").value = "";
  document.getElementById("categoryFilter").value = "";
  document.getElementById("searchInput").value = "";

  renderDashboard();
}

document.addEventListener("DOMContentLoaded", async () => {
  initializeMap();

  document.getElementById("lgaFilter").addEventListener("change", event => {
    filters.lga = event.target.value;
    renderDashboard();
  });

  document.getElementById("categoryFilter").addEventListener("change", event => {
    filters.category = event.target.value;
    renderDashboard();
  });

  document.getElementById("searchInput").addEventListener("input", event => {
    filters.search = event.target.value;
    renderDashboard();
  });

  document.getElementById("resetFilters").addEventListener(
    "click",
    resetFilters
  );

  document.getElementById("refreshData").addEventListener(
    "click",
    fetchData
  );

  await fetchData();

  setInterval(fetchData, CONFIG.REFRESH_INTERVAL_MS);
});
