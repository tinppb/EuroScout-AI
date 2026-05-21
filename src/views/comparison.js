/**
 * EuroScout AI — Head-to-Head Comparison View
 */
import { getPlayers, searchPlayers, getPlayerById, getLeagueClass, getLeagueColor, formatStatName, STAT_CATEGORIES, KEY_STATS_BY_POSITION, RADAR_STATS_BY_POSITION } from '../data/dataStore.js';
import { calculatePercentiles, getFeaturesForPosition } from '../engine/similarity.js';
import { createPercentileRadar } from '../charts/radarChart.js';

let selectedPlayers = [null, null, null, null, null];

export function renderComparison(params = {}) {
  // Pre-fill from params
  if (params.playerIds) {
    params.playerIds.forEach((id, i) => {
      if (i < 5) selectedPlayers[i] = getPlayerById(id);
    });
  }

  return `
    <div class="view-section animate-fade-in">
      <div class="section-header">
        <div>
          <div class="section-title">⚔️ Head-to-Head Comparison</div>
          <div class="section-subtitle">Select 2-5 players to compare their stats side by side</div>
        </div>
      </div>

      <!-- Player Selectors -->
      <div class="grid-5" id="player-selectors" style="margin-bottom:var(--space-xl);">
        ${[0, 1, 2, 3, 4].map(i => renderPlayerSelector(i)).join('')}
      </div>

      <!-- Comparison Content -->
      <div id="comparison-content"></div>
    </div>
  `;
}

function renderPlayerSelector(index) {
  const player = selectedPlayers[index];
  const colors = ['#00f5a0', '#00d9f5', '#f5a623', '#e879f9', '#34d399'];

  if (player) {
    return `
      <div class="player-select-wrapper filled" style="border-color:${colors[index]}33;position:relative;" data-slot="${index}">
        <button class="btn-icon" style="position:absolute;top:8px;right:8px;width:24px;height:24px;" data-remove="${index}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <div style="text-align:center;">
          <div style="width:48px;height:48px;border-radius:50%;background:${colors[index]}15;border:2px solid ${colors[index]};display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
            <span style="font-size:1.1rem;font-weight:700;color:${colors[index]};">${index + 1}</span>
          </div>
          <div style="font-weight:700;font-size:1rem;">${player.name}</div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:2px;">${player.team}</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:var(--space-xs);margin-top:var(--space-sm);">
            <span class="position-badge ${player.position.toLowerCase()}" style="width:22px;height:22px;font-size:0.6rem;">${player.position}</span>
            <span class="league-tag ${getLeagueClass(player.league)}" style="font-size:0.6rem;">${player.league}</span>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="player-select-wrapper" data-slot="${index}">
      <div style="text-align:center;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
        <div class="select-label" style="margin-top:var(--space-sm);">Select Player ${index + 1}</div>
      </div>
      <div style="position:relative;width:100%;">
        <input type="text" class="search-input comparison-search" data-slot="${index}" placeholder="Search player..." style="width:100%;padding:8px 12px;border-radius:var(--radius-md);font-size:0.85rem;" autocomplete="off" />
        <div class="search-results comparison-dropdown" data-slot="${index}" style="display:none;"></div>
      </div>
    </div>
  `;
}

export function initComparison(navigateTo) {
  setupSelectors(navigateTo);
  if (selectedPlayers.filter(Boolean).length >= 2) {
    renderComparisonContent();
  }
}

function setupSelectors(navigateTo) {
  // Search inputs
  document.querySelectorAll('.comparison-search').forEach(input => {
    const slot = parseInt(input.dataset.slot);
    const dropdown = document.querySelector(`.comparison-dropdown[data-slot="${slot}"]`);

    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (q.length < 2) { dropdown.style.display = 'none'; return; }
      const results = searchPlayers(q, 6);
      dropdown.innerHTML = results.map(p => `
        <div class="search-result-item" data-id="${p.id}">
          <span class="position-badge ${p.position.toLowerCase()}" style="width:22px;height:22px;font-size:0.6rem;">${p.position}</span>
          <div style="flex:1;"><div class="result-name" style="font-size:0.85rem;">${p.name}</div><div class="result-meta">${p.team}</div></div>
        </div>
      `).join('');
      dropdown.style.display = 'block';

      dropdown.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = parseInt(item.dataset.id);
          selectedPlayers[slot] = getPlayerById(id);
          dropdown.style.display = 'none';
          refreshView(navigateTo);
        });
      });
    });
  });

  // Remove buttons
  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const slot = parseInt(btn.dataset.remove);
      selectedPlayers[slot] = null;
      refreshView(navigateTo);
    });
  });
}

function refreshView(navigateTo) {
  const selectorsDiv = document.getElementById('player-selectors');
  selectorsDiv.innerHTML = [0, 1, 2, 3, 4].map(i => renderPlayerSelector(i)).join('');
  setupSelectors(navigateTo);

  if (selectedPlayers.filter(Boolean).length >= 2) {
    renderComparisonContent();
  } else {
    document.getElementById('comparison-content').innerHTML = '';
  }
}

function renderComparisonContent() {
  const container = document.getElementById('comparison-content');
  const activePlayers = selectedPlayers.filter(Boolean);
  const allPlayers = getPlayers();

  // Get radar stats and percentiles based on primary player's position
  const position = activePlayers[0].position;
  const radarStats = RADAR_STATS_BY_POSITION[position] || RADAR_STATS_BY_POSITION['MF'];
  const radarLabels = radarStats.map(formatStatName);
  const percentiles = activePlayers.map(p => calculatePercentiles(p, allPlayers));

  // Build stat comparison categories
  const colors = ['#00f5a0', '#00d9f5', '#f5a623', '#e879f9', '#34d399'];

  let categoriesHTML = '';
  for (const [category, stats] of Object.entries(STAT_CATEGORIES)) {
    categoriesHTML += `
      <div class="card" style="margin-bottom:var(--space-md);">
        <div class="card-header"><span class="card-title">${category}</span></div>
        ${stats.map(stat => {
          const values = activePlayers.map(p => p.stats[stat] || 0);
          const maxVal = Math.max(...values, 0.01);
          return `
            <div class="comparison-stat-row">
              ${activePlayers.length === 2 ? `
                <div class="comparison-bar-left">
                  <span class="stat-bar-value" style="color:${colors[0]};">${values[0].toFixed(2)}</span>
                  <div class="stat-bar"><div class="stat-bar-fill" style="width:${(values[0] / maxVal * 100)}%;background:${colors[0]};float:right;"></div></div>
                </div>
                <div class="comparison-stat-label">${formatStatName(stat)}</div>
                <div class="comparison-bar-right">
                  <div class="stat-bar"><div class="stat-bar-fill" style="width:${(values[1] / maxVal * 100)}%;background:${colors[1]};"></div></div>
                  <span class="stat-bar-value" style="color:${colors[1]};">${values[1].toFixed(2)}</span>
                </div>
              ` : `
                <div class="comparison-stat-label" style="flex:0 0 140px;text-align:left;">${formatStatName(stat)}</div>
                ${values.map((v, j) => `
                  <div style="flex:1;display:flex;align-items:center;gap:var(--space-sm);">
                    <div class="stat-bar"><div class="stat-bar-fill" style="width:${(v / maxVal * 100)}%;background:${colors[j]};"></div></div>
                    <span class="stat-bar-value" style="color:${colors[j]};">${v.toFixed(2)}</span>
                  </div>
                `).join('')}
              `}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  container.innerHTML = `
    <!-- Radar Chart -->
    <div class="view-section animate-fade-in">
      <div class="section-header"><div class="section-title">📊 Percentile Radar</div></div>
      <div class="chart-container" style="max-width:600px;margin:0 auto;">
        <canvas id="comparison-radar" width="500" height="500"></canvas>
      </div>
    </div>

    <!-- Stat Comparison -->
    <div class="view-section animate-fade-in" style="margin-top:var(--space-xl);">
      <div class="section-header">
        <div class="section-title">📈 Detailed Stat Comparison (Per 90)</div>
      </div>
      <!-- Player legend -->
      <div style="display:flex;gap:var(--space-lg);margin-bottom:var(--space-md);">
        ${activePlayers.map((p, i) => `
          <div style="display:flex;align-items:center;gap:var(--space-sm);">
            <div style="width:12px;height:12px;border-radius:50%;background:${colors[i]};"></div>
            <span style="font-weight:600;font-size:0.85rem;">${p.name}</span>
          </div>
        `).join('')}
      </div>
      ${categoriesHTML}
    </div>
  `;

  // Animate stat bars
  setTimeout(() => {
    createPercentileRadar('comparison-radar', activePlayers, percentiles, radarStats, radarLabels);
    document.querySelectorAll('.stat-bar-fill').forEach(el => {
      const width = el.style.width;
      el.style.width = '0';
      requestAnimationFrame(() => { el.style.width = width; });
    });
  }, 100);
}

export function setComparisonPlayers(playerIds) {
  selectedPlayers = [null, null, null, null, null];
  playerIds.forEach((id, i) => {
    if (i < 5) selectedPlayers[i] = getPlayerById(id);
  });
}
