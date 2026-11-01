// Chart.js is loaded globally from the CDN (window.Chart). Charts are redrawn from scratch
// whenever filters change, so any existing chart on a canvas is destroyed first.

const RED = '#dc2626';
const PALETTE = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#d946ef', '#ec4899', '#14b8a6', '#a3e635'];

Chart.defaults.color = '#a1a1aa'; // zinc-400
Chart.defaults.borderColor = '#27272a'; // zinc-800

function draw(canvas, config) {
  Chart.getChart(canvas)?.destroy();
  new Chart(canvas, config);
}

// series: [{ label, points: [[date, score], ...] }]. One line per series; days without a score are skipped.
export function drawTrend(canvas, series) {
  const labels = [...new Set(series.flatMap((s) => s.points.map(([date]) => date)))].sort();
  const single = series.length === 1;

  draw(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: series.map((s, i) => {
        const byDate = new Map(s.points);
        const color = single ? RED : PALETTE[i % PALETTE.length];
        return {
          label: s.label,
          data: labels.map((date) => byDate.get(date) ?? null),
          borderColor: color,
          backgroundColor: color,
          spanGaps: true,
          tension: 0.2,
        };
      }),
    },
    options: {
      scales: { y: { min: 0, max: 100 } },
      plugins: { legend: { display: !single } },
    },
  });
}

// items: [{ label, mean }]. Horizontal bars so long habit names stay readable.
export function drawMeanBar(canvas, items) {
  draw(canvas, {
    type: 'bar',
    data: {
      labels: items.map((i) => i.label),
      datasets: [{ label: 'Mean score', data: items.map((i) => i.mean), backgroundColor: RED }],
    },
    options: {
      indexAxis: 'y',
      scales: { x: { min: 0, max: 100 } },
      plugins: { legend: { display: false } },
    },
  });
}

// Number of scores in each 20-point bucket.
export function drawDistribution(canvas, values) {
  const counts = [0, 0, 0, 0, 0];
  for (const v of values) counts[Math.min(4, Math.floor(v / 20))]++;

  draw(canvas, {
    type: 'bar',
    data: {
      labels: ['0-19', '20-39', '40-59', '60-79', '80-100'],
      datasets: [{ label: 'Records', data: counts, backgroundColor: RED }],
    },
    options: {
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      plugins: { legend: { display: false } },
    },
  });
}