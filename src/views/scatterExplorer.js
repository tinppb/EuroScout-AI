/**
 * EuroScout AI — Scatter Plot Explorer View
 */
import { getPlayers, getUniqueLeagues, getUniquePositions, formatStatName, SCATTER_PRESETS } from '../data/dataStore.js';
import { createScatterChart } from '../charts/scatterChart.js';

const ALL_SCATTER_STATS = [
  'goals', 'xg', 'total_shots', 'shots_on_target', 'goal_conversion_pct',
  'successful_dribbles', 'successful_dribbles_pct',
  'assists', 'key_passes', 'big_chances_created', 'passes_to_assist',
  'accurate_crosses', 'accurate_crosses_pct', 'accurate_final_third_passes',
  'total_passes', 'accurate_passes', 'accurate_passes_pct',
  'accurate_long_balls', 'accurate_long_balls_pct',
  'tackles', 'interceptions', 'clearances', 'blocked_shots',
  'total_duels_won', 'total_duels_won_pct',
  'ground_duels_won', 'ground_duels_won_pct',
  'aerial_duels_won', 'aerial_duels_won_pct',
  'fouls', 'was_fouled', 'possession_lost', 'dispossessed',
  'rating', 'minutes_played', 'appearances'
];

export function renderScatterExplorer() {
  const leagues = getUniqueLeagues();
  const positions = getUniquePositions();
  const defaultPreset = SCATTER_PRESETS[0];

  return `
    <div class="view-section animate-fade-in">
      <div class="section-header">
        <div>
          <div class="section-title">📈 Scatter Plot Explorer</div>
          <div class="section-subtitle">Analyze player metrics with interactive scatter plots</div>
        </div>
      </div>

      <!-- Presets -->
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);margin-bottom:var(--space-lg);">
        ${SCATTER_PRESETS.map((p, i) => `
          <button class="btn btn-sm ${i === 0 ? 'btn-primary' : 'btn-secondary'} scatter-preset" data-x="${p.x}" data-y="${p.y}">${p.label}</button>
        `).join('')}
      </div>

      <!-- Controls -->
      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="filter-bar">
          <div class="filter-group">
            <label class="filter-label">X-Axis</label>
            <select id="scatter-x" class="filter-select">
              ${ALL_SCATTER_STATS.map(s => `<option value="${s}" ${s === defaultPreset.x ? 'selected' : ''}>${formatStatName(s)}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Y-Axis</label>
            <select id="scatter-y" class="filter-select">
              ${ALL_SCATTER_STATS.map(s => `<option value="${s}" ${s === defaultPreset.y ? 'selected' : ''}>${formatStatName(s)}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">League</label>
            <select id="scatter-league" class="filter-select">
              <option value="">All Leagues</option>
              ${leagues.map(l => `<option value="${l}">${l}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Position</label>
            <select id="scatter-position" class="filter-select">
              <option value="">All Positions</option>
              ${positions.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Min Minutes</label>
            <select id="scatter-minutes" class="filter-select">
              <option value="270">270+</option>
              <option value="450">450+</option>
              <option value="900" selected>900+</option>
              <option value="1800">1800+</option>
            </select>
          </div>
          <button id="scatter-update" class="btn btn-primary" style="align-self:flex-end;">Update Chart</button>
        </div>
      </div>

      <!-- Chart -->
      <div class="chart-container" style="height:500px;">
        <canvas id="scatter-canvas"></canvas>
      </div>

      <!-- Player Count -->
      <div style="text-align:center;margin-top:var(--space-md);font-size:0.8rem;color:var(--text-tertiary);" id="scatter-count"></div>
    </div>
  `;
}

export function initScatterExplorer(navigateTo) {
  const updateChart = () => {
    const xKey = document.getElementById('scatter-x').value;
    const yKey = document.getElementById('scatter-y').value;
    const league = document.getElementById('scatter-league').value;
    const position = document.getElementById('scatter-position').value;
    const minMinutes = parseInt(document.getElementById('scatter-minutes').value);

    let players = getPlayers().filter(p => p.stats.minutes_played >= minMinutes);
    if (league) players = players.filter(p => p.league === league);
    if (position) players = players.filter(p => p.position === position);

    // Remove goalkeepers from non-GK specific charts
    if (!position && !['clean_sheets'].includes(xKey) && !['clean_sheets'].includes(yKey)) {
      players = players.filter(p => p.position !== 'GK');
    }

    document.getElementById('scatter-count').textContent = `Showing ${players.length} players`;

    createScatterChart('scatter-canvas', players, xKey, yKey, {
      onClick: (player) => {
        navigateTo('similar', { searchPlayer: player.name });
      }
    });
  };

  // Update button
  document.getElementById('scatter-update').addEventListener('click', updateChart);

  // Presets
  document.querySelectorAll('.scatter-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scatter-preset').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');

      document.getElementById('scatter-x').value = btn.dataset.x;
      document.getElementById('scatter-y').value = btn.dataset.y;
      updateChart();
    });
  });

  // Also update on select change
  ['scatter-x', 'scatter-y', 'scatter-league', 'scatter-position', 'scatter-minutes'].forEach(id => {
    document.getElementById(id).addEventListener('change', updateChart);
  });

  // Initial render
  updateChart();
}
