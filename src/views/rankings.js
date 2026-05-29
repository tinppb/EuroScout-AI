/**
 * EuroScout AI — Rankings View
 */
import { getPlayers, getUniqueLeagues, getUniquePositions, getUniqueTeams, getLeagueClass, formatStatName } from '../data/dataStore.js';

const SORTABLE_STATS = [
  'rating', 'goals', 'xg', 'assists', 'key_passes', 'big_chances_created',
  'total_shots', 'shots_on_target', 'goal_conversion_pct',
  'successful_dribbles', 'successful_dribbles_pct',
  'tackles', 'interceptions', 'clearances', 'blocked_shots',
  'total_passes', 'accurate_passes_pct',
  'accurate_final_third_passes', 'accurate_crosses_pct',
  'total_duels_won_pct', 'aerial_duels_won_pct',
  'minutes_played', 'appearances'
];

const ITEMS_PER_PAGE = 25;
let currentSort = { key: 'rating', dir: 'desc' };
let currentPage = 1;
let currentFilters = { league: '', position: '', team: '', search: '' };

export function renderRankings() {
  const leagues = getUniqueLeagues();
  const positions = getUniquePositions();

  return `
    <div class="view-section animate-fade-in">
      <div class="section-header">
        <div>
          <div class="section-title">🏆 Player Rankings</div>
          <div class="section-subtitle">Dynamic player rankings with sorting and filtering</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="filter-bar">
          <div class="filter-group" style="flex:1;min-width:180px;">
            <label class="filter-label">Search</label>
            <input type="text" id="rankings-search" class="search-input" placeholder="Search by name or team..." style="width:100%;padding:8px 12px;border-radius:var(--radius-md);font-size:0.85rem;" />
          </div>
          <div class="filter-group">
            <label class="filter-label">League</label>
            <select id="rankings-league" class="filter-select">
              <option value="">All Leagues</option>
              ${leagues.map(l => `<option value="${l}">${l}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Position</label>
            <select id="rankings-position" class="filter-select">
              <option value="">All</option>
              ${positions.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Team</label>
            <select id="rankings-team" class="filter-select">
              <option value="">All Teams</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card" style="padding:0;overflow:hidden;">
        <div style="overflow-x:auto;">
          <table class="data-table" id="rankings-table">
            <thead>
              <tr>
                <th style="width:40px;">#</th>
                <th>Player</th>
                <th>Team</th>
                <th>Pos</th>
                <th>League</th>
                ${SORTABLE_STATS.slice(0, 12).map(s => `
                  <th data-sort="${s}" class="${currentSort.key === s ? 'sorted-' + currentSort.dir : ''}">${formatStatName(s)}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody id="rankings-body"></tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" id="rankings-pagination"></div>
    </div>
  `;
}

export function initRankings(navigateTo) {
  updateTable(navigateTo);

  // Sort headers
  document.querySelectorAll('#rankings-table thead th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (currentSort.key === key) {
        currentSort.dir = currentSort.dir === 'desc' ? 'asc' : 'desc';
      } else {
        currentSort = { key, dir: 'desc' };
      }
      currentPage = 1;
      updateTable(navigateTo);
    });
  });

  // Filters
  document.getElementById('rankings-search').addEventListener('input', debounce(() => {
    currentFilters.search = document.getElementById('rankings-search').value.trim().toLowerCase();
    currentPage = 1;
    updateTable(navigateTo);
  }, 300));

  document.getElementById('rankings-league').addEventListener('change', (e) => {
    currentFilters.league = e.target.value;
    currentFilters.team = '';
    updateTeamFilter();
    currentPage = 1;
    updateTable(navigateTo);
  });

  document.getElementById('rankings-position').addEventListener('change', (e) => {
    currentFilters.position = e.target.value;
    currentPage = 1;
    updateTable(navigateTo);
  });

  document.getElementById('rankings-team').addEventListener('change', (e) => {
    currentFilters.team = e.target.value;
    currentPage = 1;
    updateTable(navigateTo);
  });

  updateTeamFilter();
}

function updateTeamFilter() {
  const teams = getUniqueTeams(currentFilters.league || null);
  const select = document.getElementById('rankings-team');
  select.innerHTML = `<option value="">All Teams</option>` +
    teams.map(t => `<option value="${t}" ${currentFilters.team === t ? 'selected' : ''}>${t}</option>`).join('');
}

function updateTable(navigateTo) {
  let players = getPlayers();

  // Apply filters
  if (currentFilters.league) players = players.filter(p => p.league === currentFilters.league);
  if (currentFilters.position) players = players.filter(p => p.position === currentFilters.position);
  if (currentFilters.team) players = players.filter(p => p.team === currentFilters.team);
  if (currentFilters.search) {
    players = players.filter(p =>
      p.name.toLowerCase().includes(currentFilters.search) ||
      p.team.toLowerCase().includes(currentFilters.search)
    );
  }

  // Sort
  players.sort((a, b) => {
    const aVal = a.stats[currentSort.key] || 0;
    const bVal = b.stats[currentSort.key] || 0;
    return currentSort.dir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // Pagination
  const totalPages = Math.ceil(players.length / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageData = players.slice(start, start + ITEMS_PER_PAGE);

  // Update sort indicators
  document.querySelectorAll('#rankings-table thead th[data-sort]').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (th.dataset.sort === currentSort.key) {
      th.classList.add('sorted-' + currentSort.dir);
    }
  });

  // Render rows
  const tbody = document.getElementById('rankings-body');
  tbody.innerHTML = pageData.map((p, i) => `
    <tr data-player-id="${p.id}">
      <td style="color:var(--text-tertiary);">${start + i + 1}</td>
      <td><span style="font-weight:600;">${p.name}</span></td>
      <td style="color:var(--text-secondary);">${p.team}</td>
      <td><span class="position-badge ${p.position.toLowerCase()}" style="width:24px;height:24px;font-size:0.6rem;">${p.position}</span></td>
      <td><span class="league-tag ${getLeagueClass(p.league)}" style="font-size:0.6rem;">${p.league}</span> <span class="league-tag" style="font-size:0.6rem;background:var(--bg-tertiary);">${p.season}</span></td>
      ${SORTABLE_STATS.slice(0, 12).map(s => {
        const val = p.stats[s];
        const isHighlight = s === currentSort.key;
        return `<td style="${isHighlight ? 'color:var(--accent-green);font-weight:600;' : ''}">${val !== undefined ? (Number.isInteger(val) ? val : val.toFixed(2)) : '—'}</td>`;
      }).join('')}
    </tr>
  `).join('');

  // Row click
  tbody.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('click', () => {
      const id = parseInt(tr.dataset.playerId);
      navigateTo('similar', { searchPlayerId: id });
    });
  });

  // Pagination
  renderPagination(totalPages, navigateTo);
}

function renderPagination(totalPages, navigateTo) {
  const container = document.getElementById('rankings-pagination');
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let buttons = [];
  buttons.push(`<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">‹</button>`);

  const range = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
      buttons.push(`<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`);
    } else if (buttons[buttons.length - 1] !== '...') {
      buttons.push('...');
    }
  }

  buttons.push(`<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">›</button>`);

  container.innerHTML = buttons.map(b => typeof b === 'string' && b === '...' ? '<span style="color:var(--text-tertiary);padding:0 4px;">…</span>' : b).join('');

  container.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      updateTable(navigateTo);
    });
  });
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
