let categoryChart;
let lgaChart;

function countBy(records, key) {
  const counts = {};
  records.forEach(record => {
    const value = record[key] || "Unspecified";
    counts[value] = (counts[value] || 0) + 1;
  });
  return counts;
}

function destroyChart(chart) {
  if (chart) chart.destroy();
}

function renderCharts(records) {
  const categoryCounts = countBy(records, "category");
  const lgaCounts = countBy(records, "lga");

  destroyChart(categoryChart);
  destroyChart(lgaChart);

  categoryChart = new Chart(
    document.getElementById("categoryChart"),
    {
      type: "doughnut",
      data: {
        labels: Object.keys(categoryCounts),
        datasets: [{
          data: Object.values(categoryCounts)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom"
          }
        }
      }
    }
  );

  const sortedLgas = Object.entries(lgaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  lgaChart = new Chart(
    document.getElementById("lgaChart"),
    {
      type: "bar",
      data: {
        labels: sortedLgas.map(item => item[0]),
        datasets: [{
          label: "Records",
          data: sortedLgas.map(item => item[1])
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    }
  );
}
