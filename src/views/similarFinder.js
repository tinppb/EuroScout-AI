/**
 * EuroScout AI — Similar Player Finder View
 */
import { getPlayers, getUniqueLeagues, getUniquePositions, searchPlayers, getPlayerById, getLeagueClass, getLeagueColor, formatStatName, KEY_STATS_BY_POSITION, RADAR_STATS_BY_POSITION } from '../data/dataStore.js';
import { findSimilarPlayers, calculatePercentiles, getFeaturesForPosition } from '../engine/similarity.js';
import { createPercentileRadar } from '../charts/radarChart.js';

let currentResults = [];

export function renderSimilarFinder() {
  const leagues = getUniqueLeagues();
  const positions = getUniquePositions();

  return `
    <div class="view-section animate-fade-in">
      <div class="section-header">
        <div>
          <div class="section-title">🔍 Find Similar Players</div>
          <div class="section-subtitle">Enter a player name to find statistically similar players across Europe's top leagues</div>
        </div>
      </div>

      <!-- Search + Filters -->
      <div class="card" style="margin-bottom:var(--space-lg);">
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-md);align-items:flex-end;">
          <div class="filter-group" style="flex:2;min-width:250px;">
            <label class="filter-label">Player Name</label>
            <div style="position:relative;">
              <input type="text" id="similar-search" class="search-input" placeholder="e.g. Bruno Fernandes, Haaland, Mbappé..." style="width:100%;padding:10px 14px;border-radius:var(--radius-md);font-size:0.95rem;" autocomplete="off" />
              <div id="similar-search-dropdown" class="search-results" style="display:none;"></div>
            </div>
          </div>
          <div class="filter-group">
            <label class="filter-label">Target League</label>
            <select id="similar-league" class="filter-select">
              <option value="">All Leagues</option>
              ${leagues.map(l => `<option value="${l}">${l}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Position</label>
            <select id="similar-position" class="filter-select">
              <option value="">Same Position</option>
              ${positions.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Mode</label>
            <select id="similar-mode" class="filter-select">
              <option value="cross">Cross-League Only</option>
              <option value="all">All Leagues</option>
              <option value="same">Same League Only</option>
            </select>
          </div>
          <button id="similar-search-btn" class="btn btn-primary" style="height:40px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            Find Similar
          </button>
        </div>
      </div>

      <!-- Results Area -->
      <div id="similar-results" class="animate-fade-in">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <h3>Search for a player</h3>
          <p style="max-width:400px;">Enter a player name above and we'll find the most statistically similar players across Europe's top 5 leagues.</p>
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);justify-content:center;margin-top:var(--space-md);">
            <button class="btn btn-secondary btn-sm quick-search-btn" data-name="Bruno Fernandes">Bruno Fernandes</button>
            <button class="btn btn-secondary btn-sm quick-search-btn" data-name="Lamine Yamal">Lamine Yamal</button>
            <button class="btn btn-secondary btn-sm quick-search-btn" data-name="Declan Rice">Declan Rice</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initSimilarFinder(navigateTo) {
  const searchInput = document.getElementById('similar-search');
  const dropdown = document.getElementById('similar-search-dropdown');
  const searchBtn = document.getElementById('similar-search-btn');
  let selectedPlayer = null;

  // Autocomplete
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (query.length < 2) {
      dropdown.style.display = 'none';
      return;
    }
    const results = searchPlayers(query, 8);
    if (results.length === 0) {
      dropdown.style.display = 'none';
      return;
    }
    dropdown.innerHTML = results.map(p => `
      <div class="search-result-item" data-id="${p.id}">
        <span class="position-badge ${p.position.toLowerCase()}">${p.position}</span>
        <div style="flex:1;">
          <div class="result-name">${p.name}</div>
          <div class="result-meta">${p.team} • ${p.league}</div>
        </div>
      </div>
    `).join('');
    dropdown.style.display = 'block';

    dropdown.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.dataset.id);
        selectedPlayer = getPlayerById(id);
        searchInput.value = selectedPlayer.name;
        dropdown.style.display = 'none';
        runSearch(selectedPlayer, navigateTo);
      });
    });
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#similar-search') && !e.target.closest('#similar-search-dropdown')) {
      dropdown.style.display = 'none';
    }
  });

  // Search button
  searchBtn.addEventListener('click', () => {
    if (selectedPlayer) {
      runSearch(selectedPlayer, navigateTo);
    } else {
      const query = searchInput.value.trim();
      const results = searchPlayers(query, 1);
      if (results.length > 0) {
        selectedPlayer = results[0];
        searchInput.value = selectedPlayer.name;
        runSearch(selectedPlayer, navigateTo);
      }
    }
  });

  // Enter key
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      searchBtn.click();
    }
  });

  // Quick search buttons
  document.querySelectorAll('.quick-search-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      searchInput.value = name;
      const results = searchPlayers(name, 1);
      if (results.length > 0) {
        selectedPlayer = results[0];
        runSearch(selectedPlayer, navigateTo);
      }
    });
  });
}

function runSearch(player, navigateTo) {
  const leagueFilter = document.getElementById('similar-league').value;
  const posFilter = document.getElementById('similar-position').value;
  const mode = document.getElementById('similar-mode').value;

  // Determine league filter based on mode
  let effectiveLeague = leagueFilter || null;
  if (mode === 'same') {
    effectiveLeague = player.league;
  }

  const results = findSimilarPlayers(player, getPlayers(), {
    league: effectiveLeague,
    position: posFilter || null,
    crossLeagueOnly: mode === 'cross',
    topN: 10
  });

  currentResults = results;
  renderResults(player, results, navigateTo);
}

function renderResults(targetPlayer, results, navigateTo) {
  const container = document.getElementById('similar-results');
  if (results.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No similar players found</h3>
        <p>Try changing the filters or search for a different player.</p>
      </div>
    `;
    return;
  }

  const players = getPlayers();
  const radarStats = RADAR_STATS_BY_POSITION[targetPlayer.position] || RADAR_STATS_BY_POSITION['MF'];
  const radarLabels = radarStats.map(formatStatName);

  // Calculate percentiles
  const targetPercentiles = calculatePercentiles(targetPlayer, players);

  container.innerHTML = `
    <!-- Target Player Info -->
    <div class="card animate-fade-in" style="margin-bottom:var(--space-lg);border-left:3px solid ${getLeagueColor(targetPlayer.league)};">
      <div style="display:flex;align-items:center;gap:var(--space-lg);flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;">
          <div style="font-size:0.75rem;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.05em;">Target Player</div>
          <div style="font-family:var(--font-heading);font-size:1.4rem;font-weight:700;margin-top:4px;">${targetPlayer.name}</div>
          <div style="display:flex;align-items:center;gap:var(--space-sm);margin-top:var(--space-sm);">
            <span class="position-badge ${targetPlayer.position.toLowerCase()}">${targetPlayer.position}</span>
            <span style="color:var(--text-secondary);">${targetPlayer.team}</span>
            <span class="league-tag ${getLeagueClass(targetPlayer.league)}">${targetPlayer.league}</span>
          </div>
        </div>
        <div style="display:flex;gap:var(--space-xl);">
          ${KEY_STATS_BY_POSITION[targetPlayer.position]?.slice(0, 4).map(key => `
            <div style="text-align:center;">
              <div style="font-size:1.2rem;font-weight:700;color:var(--accent-green);">${targetPlayer.stats[key]?.toFixed(2) || '0'}</div>
              <div style="font-size:0.7rem;color:var(--text-tertiary);">${formatStatName(key)}</div>
            </div>
          `).join('') || ''}
        </div>
      </div>
    </div>

    <!-- Results Grid -->
    <div class="section-header">
      <div>
        <div class="section-title">Top ${results.length} Similar Players</div>
        <div class="section-subtitle">Ranked by cosine similarity score</div>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:var(--space-xl);">
      <!-- Radar Chart -->
      <div class="chart-container">
        <div class="card-header">
          <span class="card-title">Profile Comparison (Per 90)</span>
        </div>
        <canvas id="similar-radar" width="400" height="400"></canvas>
      </div>

      <!-- Results List -->
      <div>
        ${results.map((r, i) => `
          <div class="player-card animate-fade-in stagger-${Math.min(i + 1, 6)}" data-player-id="${r.player.id}" style="margin-bottom:var(--space-sm);padding:var(--space-md);">
            <div style="display:flex;align-items:center;gap:var(--space-md);">
              <div style="font-family:var(--font-heading);font-size:1.1rem;font-weight:700;color:var(--text-tertiary);width:24px;">#${i + 1}</div>
              <div class="similarity-score">
                <svg viewBox="0 0 36 36">
                  <circle class="bg-ring" cx="18" cy="18" r="15.5"/>
                  <circle class="score-ring" cx="18" cy="18" r="15.5"
                    stroke-dasharray="${r.similarityPct * 0.974} 100"
                    stroke-dashoffset="0"/>
                </svg>
                <div class="score-text">${r.similarityPct}%</div>
              </div>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:0.95rem;">${r.player.name}</div>
                <div style="display:flex;align-items:center;gap:var(--space-sm);margin-top:2px;">
                  <span class="position-badge ${r.player.position.toLowerCase()}" style="width:22px;height:22px;font-size:0.6rem;">${r.player.position}</span>
                  <span style="font-size:0.78rem;color:var(--text-secondary);">${r.player.team}</span>
                  <span class="league-tag ${getLeagueClass(r.player.league)}" style="font-size:0.6rem;">${r.player.league}</span>
                </div>
              </div>
              <button class="btn btn-sm btn-secondary compare-btn" data-player-id="${r.player.id}" data-target-id="${targetPlayer.id}">Compare</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Build radar with target + top 2 similar
  const radarPlayers = [targetPlayer, results[0].player];
  if (results.length > 1) radarPlayers.push(results[1].player);

  const percentiles = radarPlayers.map(p => calculatePercentiles(p, players));

  setTimeout(() => {
    createPercentileRadar('similar-radar', radarPlayers, percentiles, radarStats, radarLabels);
  }, 100);

  // Compare button events
  container.querySelectorAll('.compare-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = parseInt(btn.dataset.targetId);
      const playerId = parseInt(btn.dataset.playerId);
      navigateTo('comparison', { playerIds: [targetId, playerId] });
    });
  });

  // Click player card to navigate
  container.querySelectorAll('.player-card[data-player-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.compare-btn')) return;
      const id = parseInt(card.dataset.playerId);
      const player = getPlayerById(id);
      if (player) {
        document.getElementById('similar-search').value = player.name;
        runSearch(player, navigateTo);
      }
    });
  });
}

export { currentResults };
