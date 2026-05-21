/**
 * EuroScout AI — Radar Chart Component
 */
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const COLORS = [
  { bg: 'rgba(0, 245, 160, 0.15)', border: '#00f5a0' },
  { bg: 'rgba(0, 217, 245, 0.15)', border: '#00d9f5' },
  { bg: 'rgba(245, 166, 35, 0.15)', border: '#f5a623' },
  { bg: 'rgba(232, 121, 249, 0.15)', border: '#e879f9' },
  { bg: 'rgba(52, 211, 153, 0.15)', border: '#34d399' },
];

export function createRadarChart(canvasId, players, statKeys, statLabels) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  // Destroy existing chart
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const datasets = players.map((player, i) => ({
    label: player.name,
    data: statKeys.map(k => player.stats[k] || 0),
    backgroundColor: COLORS[i % COLORS.length].bg,
    borderColor: COLORS[i % COLORS.length].border,
    borderWidth: 2,
    pointBackgroundColor: COLORS[i % COLORS.length].border,
    pointBorderColor: '#0a0e17',
    pointBorderWidth: 2,
    pointRadius: 4,
    pointHoverRadius: 6,
    fill: true,
  }));

  return new Chart(canvas, {
    type: 'radar',
    data: {
      labels: statLabels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 12 },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: '#1a1f2e',
          titleColor: '#f0f4f8',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          padding: 10,
          titleFont: { family: 'Inter', weight: '600' },
          bodyFont: { family: 'Inter' },
          cornerRadius: 8,
        }
      },
      scales: {
        r: {
          angleLines: { color: 'rgba(255,255,255,0.06)' },
          grid: { color: 'rgba(255,255,255,0.06)' },
          pointLabels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 11 }
          },
          ticks: {
            display: false,
            stepSize: 0.2
          },
          suggestedMin: 0
        }
      },
      animation: {
        duration: 800,
        easing: 'easeOutCubic'
      }
    }
  });
}

/**
 * Create a radar chart using percentile data.
 */
export function createPercentileRadar(canvasId, players, percentileData, statKeys, statLabels) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const datasets = players.map((player, i) => ({
    label: player.name,
    data: statKeys.map(k => percentileData[i][k] || 0),
    backgroundColor: COLORS[i % COLORS.length].bg,
    borderColor: COLORS[i % COLORS.length].border,
    borderWidth: 2,
    pointBackgroundColor: COLORS[i % COLORS.length].border,
    pointBorderColor: '#0a0e17',
    pointBorderWidth: 2,
    pointRadius: 4,
    pointHoverRadius: 6,
    fill: true,
  }));

  return new Chart(canvas, {
    type: 'radar',
    data: { labels: statLabels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 12 },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: '#1a1f2e',
          titleColor: '#f0f4f8',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}th percentile`
          }
        }
      },
      scales: {
        r: {
          angleLines: { color: 'rgba(255,255,255,0.06)' },
          grid: { color: 'rgba(255,255,255,0.06)' },
          pointLabels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } },
          ticks: { display: false },
          suggestedMin: 0,
          suggestedMax: 100
        }
      },
      animation: { duration: 800, easing: 'easeOutCubic' }
    }
  });
}
