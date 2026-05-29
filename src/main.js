/**
 * EuroScout AI — Main Application Entry Point
 * SPA Router + Event Delegation + Global Search
 */
import './styles/index.css';
import { initData, searchPlayers, getPlayerById, getLeagueClass, getUniqueSeasons, getCurrentSeason, setSeason } from './data/dataStore.js';

// Views
import { renderDashboard } from './views/dashboard.js';
import { renderSimilarFinder, initSimilarFinder } from './views/similarFinder.js';
import { renderComparison, initComparison, setComparisonPlayers } from './views/comparison.js';
import { renderScatterExplorer, initScatterExplorer } from './views/scatterExplorer.js';
import { renderRankings, initRankings } from './views/rankings.js';
import { renderHeatmap, initHeatmap } from './views/heatmap.js';

// ─── Navigation Config ───
const NAV_ITEMS = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>'
  },
  {
    id: 'similar', label: 'Similar Finder',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>'
  },
  {
    id: 'comparison', label: 'Comparison',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>'
  },
  {
    id: 'scatter', label: 'Scatter Explorer',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><circle cx="17" cy="7" r="2"/><circle cx="7" cy="17" r="2"/></svg>'
  },
  {
    id: 'rankings', label: 'Rankings',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8l4-2"/><path d="M8 10 4 8l4-2"/><path d="m20 8-4 2"/><rect width="4" height="6" x="2" y="16" rx="1"/><rect width="4" height="10" x="10" y="12" rx="1"/><rect width="4" height="14" x="18" y="8" rx="1"/></svg>'
  },
  {
    id: 'heatmap', label: 'Heatmap',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>'
  }
];

let currentView = 'dashboard';
let viewParams = {};

// ─── Initialize App ───
function init() {
  try {
    const { players, metadata } = initData();
    console.log(`EuroScout AI loaded: ${players.length} players from ${metadata.leagues?.length || 5} leagues`);

    // Set total players count in sidebar
    document.getElementById('total-players').textContent = players.length.toLocaleString();

    // Build navigation
    buildNavigation();

    // Setup global search and season selector
    setupGlobalSearch();
    setupSeasonSelector();

    // Setup sidebar toggle
    setupSidebar();

    // Navigate to default view
    navigateTo('dashboard');

    // Hide loading screen
    setTimeout(() => {
      document.getElementById('loading-screen').classList.add('hidden');
    }, 500);

  } catch (err) {
    console.error('Failed to initialize EuroScout AI:', err);
    document.getElementById('loading-screen').innerHTML = `
      <div class="loader">
        <div style="color:var(--accent-red);font-size:1.2rem;font-weight:600;">Failed to load</div>
        <div style="color:var(--text-tertiary);font-size:0.85rem;">${err.message}</div>
      </div>
    `;
  }
}

// ─── Navigation ───
function buildNavigation() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = NAV_ITEMS.map(item => `
    <div class="nav-item ${item.id === currentView ? 'active' : ''}" data-view="${item.id}">
      ${item.icon}
      <span>${item.label}</span>
    </div>
  `).join('');

  nav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.view);
      // Close mobile sidebar
      document.getElementById('sidebar').classList.remove('mobile-open');
      document.getElementById('sidebar-overlay').classList.remove('active');
    });
  });
}

function navigateTo(viewId, params = {}) {
  currentView = viewId;
  viewParams = params;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewId);
  });

  // Update page title
  const navItem = NAV_ITEMS.find(n => n.id === viewId);
  document.getElementById('page-title').textContent = navItem?.label || 'Dashboard';

  // Render view
  const container = document.getElementById('view-container');

  // Keep loading screen if it exists
  const loadingScreen = document.getElementById('loading-screen');
  const loadingHTML = loadingScreen ? loadingScreen.outerHTML : '';

  switch (viewId) {
    case 'dashboard':
      container.innerHTML = renderDashboard() + loadingHTML;
      break;

    case 'similar':
      container.innerHTML = renderSimilarFinder() + loadingHTML;
      initSimilarFinder(navigateTo);
      // Auto-search if params provided
      if (params.searchPlayer) {
        const input = document.getElementById('similar-search');
        if (input) {
          input.value = params.searchPlayer;
          setTimeout(() => {
            const results = searchPlayers(params.searchPlayer, 1);
            if (results.length > 0) {
              input.value = results[0].name;
              document.getElementById('similar-search-btn').click();
            }
          }, 100);
        }
      }
      if (params.searchPlayerId) {
        const player = getPlayerById(params.searchPlayerId);
        if (player) {
          const input = document.getElementById('similar-search');
          if (input) {
            input.value = player.name;
            setTimeout(() => {
              document.getElementById('similar-search-btn').click();
            }, 100);
          }
        }
      }
      break;

    case 'comparison':
      if (params.playerIds) {
        setComparisonPlayers(params.playerIds);
      }
      container.innerHTML = renderComparison(params) + loadingHTML;
      initComparison(navigateTo);
      break;

    case 'scatter':
      container.innerHTML = renderScatterExplorer() + loadingHTML;
      initScatterExplorer(navigateTo);
      break;

    case 'rankings':
      container.innerHTML = renderRankings() + loadingHTML;
      initRankings(navigateTo);
      break;

    case 'heatmap':
      container.innerHTML = renderHeatmap() + loadingHTML;
      initHeatmap();
      break;
  }

  // Scroll to top
  container.scrollTop = 0;
}

// ─── Global Search ───
function setupGlobalSearch() {
  const input = document.getElementById('global-search-input');
  const resultsContainer = document.getElementById('global-search-results');
  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = input.value.trim();
      if (query.length < 2) {
        resultsContainer.classList.remove('active');
        return;
      }
      const results = searchPlayers(query, 8);
      if (results.length === 0) {
        resultsContainer.classList.remove('active');
        return;
      }
      resultsContainer.innerHTML = results.map(p => `
        <div class="search-result-item" data-id="${p.id}">
          <span class="position-badge ${p.position.toLowerCase()}" style="width:24px;height:24px;font-size:0.6rem;">${p.position}</span>
          <div style="flex:1;">
            <div class="result-name">${p.name}</div>
            <div class="result-meta">${p.team} • ${p.league} • ${p.season}</div>
          </div>
          <span class="league-tag ${getLeagueClass(p.league)}" style="font-size:0.6rem;">${p.league.slice(0, 3)}</span>
        </div>
      `).join('');
      resultsContainer.classList.add('active');

      resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = parseInt(item.dataset.id);
          const player = getPlayerById(id);
          if (player) {
            input.value = '';
            resultsContainer.classList.remove('active');
            navigateTo('similar', { searchPlayer: player.name });
          }
        });
      });
    }, 200);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#global-search')) {
      resultsContainer.classList.remove('active');
    }
  });

  // ESC key
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      resultsContainer.classList.remove('active');
      input.blur();
    }
  });
}

// ─── Season Selector ───
function setupSeasonSelector() {
  const selector = document.getElementById('global-season-selector');
  if (!selector) return;

  const seasons = getUniqueSeasons();
  const current = getCurrentSeason();

  let html = `<option value="All" ${current === 'All' ? 'selected' : ''}>All Seasons</option>`;
  seasons.forEach(season => {
    html += `<option value="${season}" ${current === season ? 'selected' : ''}>${season}</option>`;
  });
  selector.innerHTML = html;

  selector.addEventListener('change', (e) => {
    setSeason(e.target.value);
    
    // Re-render current view
    navigateTo(currentView, viewParams);
  });
}

// ─── Sidebar ───
function setupSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const overlay = document.getElementById('sidebar-overlay');

  // Desktop collapse
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // Mobile menu
  mobileToggle.addEventListener('click', () => {
    sidebar.classList.add('mobile-open');
    overlay.classList.add('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
  });
}

// ─── Dashboard player click delegation ───
document.addEventListener('click', (e) => {
  const playerItem = e.target.closest('[data-player-id]');
  if (playerItem && currentView === 'dashboard') {
    const id = parseInt(playerItem.dataset.playerId);
    const player = getPlayerById(id);
    if (player) {
      navigateTo('similar', { searchPlayer: player.name });
    }
  }
});

// ─── Start App ───
init();
