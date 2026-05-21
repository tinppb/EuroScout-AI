/**
 * EuroScout AI — Heatmap Chart Component (Canvas-based)
 */
import { getLeagueColor, formatStatName } from '../data/dataStore.js';

function interpolateColor(value, min, max) {
  const t = max === min ? 0.5 : (value - min) / (max - min);
  // Dark red → yellow → green gradient
  const r = t < 0.5 ? 220 : Math.round(220 - (t - 0.5) * 2 * 180);
  const g = t < 0.5 ? Math.round(60 + t * 2 * 160) : 220;
  const b = t < 0.5 ? 60 : Math.round(60 + (t - 0.5) * 2 * 40);
  return `rgb(${r}, ${g}, ${b})`;
}

function getTextColor(value, min, max) {
  const t = max === min ? 0.5 : (value - min) / (max - min);
  return t > 0.3 && t < 0.7 ? '#111' : '#f0f4f8';
}

export function createHeatmap(containerId, data, statKeys, leagues, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const { mode = 'average' } = options;

  // Calculate values: for each stat x league, compute avg/median/max
  const grid = [];
  for (const stat of statKeys) {
    const row = { stat, values: {} };
    for (const league of leagues) {
      const players = data.filter(p => p.league === league);
      const vals = players.map(p => p.stats[stat] || 0).filter(v => v > 0);
      if (vals.length === 0) {
        row.values[league] = 0;
        continue;
      }
      if (mode === 'average') {
        row.values[league] = vals.reduce((a, b) => a + b, 0) / vals.length;
      } else if (mode === 'median') {
        const sorted = vals.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        row.values[league] = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      } else {
        row.values[league] = Math.max(...vals);
      }
    }
    grid.push(row);
  }

  // Build HTML table
  const table = document.createElement('div');
  table.className = 'heatmap-grid';
  table.style.gridTemplateColumns = `180px repeat(${leagues.length}, 1fr)`;

  // Header row
  const corner = document.createElement('div');
  corner.className = 'heatmap-header heatmap-row-label';
  corner.textContent = 'Stat / League';
  table.appendChild(corner);

  for (const league of leagues) {
    const header = document.createElement('div');
    header.className = 'heatmap-header';
    header.textContent = league;
    header.style.color = getLeagueColor(league);
    table.appendChild(header);
  }

  // Data rows
  for (const row of grid) {
    // Find min/max for this stat across leagues
    const allVals = Object.values(row.values);
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);

    // Row label
    const label = document.createElement('div');
    label.className = 'heatmap-row-label';
    label.textContent = formatStatName(row.stat);
    table.appendChild(label);

    for (const league of leagues) {
      const val = row.values[league];
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      cell.style.backgroundColor = interpolateColor(val, min, max);
      cell.style.color = getTextColor(val, min, max);
      cell.textContent = val.toFixed(2);
      cell.title = `${formatStatName(row.stat)} | ${league}: ${val.toFixed(2)}`;

      // Find top 3 players for tooltip
      cell.addEventListener('mouseenter', (e) => {
        const players = data
          .filter(p => p.league === league)
          .sort((a, b) => (b.stats[row.stat] || 0) - (a.stats[row.stat] || 0))
          .slice(0, 3);
        const tooltipContent = players.map((p, i) =>
          `${i + 1}. ${p.name} (${p.stats[row.stat]?.toFixed(2) || 0})`
        ).join('\n');
        cell.title = `${formatStatName(row.stat)} | ${league}\n${mode}: ${val.toFixed(2)}\n\nTop 3:\n${tooltipContent}`;
      });

      table.appendChild(cell);
    }
  }

  container.appendChild(table);
}
