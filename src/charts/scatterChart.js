/**
 * EuroScout AI — Scatter Chart Component
 */
import { Chart, ScatterController, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
Chart.register(ScatterController, LinearScale, PointElement, Tooltip, Legend);

import { getLeagueColor, formatStatName } from '../data/dataStore.js';

// Track which players have visible labels (toggled on click)
let labeledPlayerIds = new Set();

export function createScatterChart(canvasId, players, xKey, yKey, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
  labeledPlayerIds.clear();

  const { colorBy = 'league', highlightIds = [], onClick = null } = options;

  // Group by league for coloring
  const leagues = [...new Set(players.map(p => p.league))];
  const datasets = leagues.map(league => {
    const leaguePlayers = players.filter(p => p.league === league);
    return {
      label: league,
      data: leaguePlayers.map(p => ({
        x: p.stats[xKey] || 0,
        y: p.stats[yKey] || 0,
        player: p
      })),
      backgroundColor: leaguePlayers.map(p =>
        highlightIds.includes(p.id)
          ? '#f5a623'
          : getLeagueColor(league) + '99'
      ),
      borderColor: leaguePlayers.map(p =>
        highlightIds.includes(p.id)
          ? '#f5a623'
          : getLeagueColor(league)
      ),
      borderWidth: leaguePlayers.map(p =>
        highlightIds.includes(p.id) ? 3 : 1
      ),
      pointRadius: leaguePlayers.map(p =>
        highlightIds.includes(p.id) ? 8 : 5
      ),
      pointHoverRadius: 8,
    };
  });

  // Calculate averages for reference lines
  const allX = players.map(p => p.stats[xKey] || 0);
  const allY = players.map(p => p.stats[yKey] || 0);
  const avgX = allX.reduce((a, b) => a + b, 0) / allX.length;
  const avgY = allY.reduce((a, b) => a + b, 0) / allY.length;

  const chart = new Chart(canvas, {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 11 },
            padding: 12,
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
          padding: 12,
          cornerRadius: 8,
          titleFont: { family: 'Inter', weight: '600' },
          bodyFont: { family: 'Inter' },
          callbacks: {
            title: (items) => {
              const p = items[0]?.raw?.player;
              return p ? p.name : '';
            },
            beforeBody: (items) => {
              const p = items[0]?.raw?.player;
              return p ? `${p.team} | ${p.position}` : '';
            },
            label: (ctx) => {
              return `${formatStatName(xKey)}: ${ctx.raw.x} | ${formatStatName(yKey)}: ${ctx.raw.y}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: formatStatName(xKey),
            color: '#94a3b8',
            font: { family: 'Inter', size: 12 }
          },
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } }
        },
        y: {
          title: {
            display: true,
            text: formatStatName(yKey),
            color: '#94a3b8',
            font: { family: 'Inter', size: 12 }
          },
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } }
        }
      },
      animation: { duration: 600, easing: 'easeOutCubic' },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const el = elements[0];
          const player = chart.data.datasets[el.datasetIndex].data[el.index].player;
          // Toggle label visibility for this player
          if (labeledPlayerIds.has(player.id)) {
            labeledPlayerIds.delete(player.id);
          } else {
            labeledPlayerIds.add(player.id);
          }
          chart.update('none');
        }
      }
    },
    plugins: [
      {
        id: 'averageLines',
        afterDraw: (chart) => {
          const { ctx, scales } = chart;
          const xScale = scales.x;
          const yScale = scales.y;

          // Vertical average line
          const xPixel = xScale.getPixelForValue(avgX);
          ctx.save();
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(xPixel, yScale.top);
          ctx.lineTo(xPixel, yScale.bottom);
          ctx.stroke();

          // Horizontal average line
          const yPixel = yScale.getPixelForValue(avgY);
          ctx.beginPath();
          ctx.moveTo(xScale.left, yPixel);
          ctx.lineTo(xScale.right, yPixel);
          ctx.stroke();
          ctx.restore();

          // Labels
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.font = '10px Inter';
          ctx.fillText(`avg: ${avgX.toFixed(2)}`, xPixel + 4, yScale.top + 12);
          ctx.fillText(`avg: ${avgY.toFixed(2)}`, xScale.left + 4, yPixel - 6);
        }
      },
      {
        id: 'clickedLabels',
        afterDraw: (chart) => {
          if (labeledPlayerIds.size === 0) return;
          const { ctx, scales } = chart;
          const xScale = scales.x;
          const yScale = scales.y;

          ctx.save();
          ctx.font = '600 11px Inter';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';

          for (const ds of chart.data.datasets) {
            for (const point of ds.data) {
              if (!point.player || !labeledPlayerIds.has(point.player.id)) continue;
              const px = xScale.getPixelForValue(point.x);
              const py = yScale.getPixelForValue(point.y);
              const name = point.player.name;
              const textWidth = ctx.measureText(name).width;
              const padX = 6, padY = 4, radius = 5;
              const boxX = px + 8;
              const boxY = py - 10 - padY * 2 - 11;
              const boxW = textWidth + padX * 2;
              const boxH = 11 + padY * 2;

              // Draw rounded rect background
              ctx.fillStyle = 'rgba(10, 14, 23, 0.88)';
              ctx.strokeStyle = 'rgba(0, 245, 160, 0.5)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(boxX, boxY, boxW, boxH, radius);
              ctx.fill();
              ctx.stroke();

              // Draw connector line
              ctx.strokeStyle = 'rgba(0, 245, 160, 0.35)';
              ctx.lineWidth = 1;
              ctx.setLineDash([2, 2]);
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(boxX, boxY + boxH);
              ctx.stroke();
              ctx.setLineDash([]);

              // Draw text
              ctx.fillStyle = '#f0f4f8';
              ctx.fillText(name, boxX + padX, boxY + boxH - padY);
            }
          }
          ctx.restore();
        }
      }
    ]
  });

  return chart;
}
