/**
 * EuroScout AI — Dashboard View
 */
import { getPlayers, getUniqueLeagues, getLeagueColor, getLeagueEmoji, getLeagueClass } from '../data/dataStore.js';

export function renderDashboard() {
  const players = getPlayers();
  const leagues = getUniqueLeagues();
  const teams = [...new Set(players.map(p => p.team))];

  const fwCount = players.filter(p => p.position === 'FW').length;
  const mfCount = players.filter(p => p.position === 'MF').length;
  const dfCount = players.filter(p => p.position === 'DF').length;
  const gkCount = players.filter(p => p.position === 'GK').length;

  // Top players by rating
  const topRated = [...players].sort((a, b) => (b.stats.rating || 0) - (a.stats.rating || 0)).slice(0, 5);
  const topScorers = [...players].sort((a, b) => (b.stats.goals || 0) - (a.stats.goals || 0)).slice(0, 5);
  const topAssists = [...players].sort((a, b) => (b.stats.assists || 0) - (a.stats.assists || 0)).slice(0, 5);

  return `
    <div class="view-section animate-fade-in">
      <div class="stats-grid">
        <div class="stat-card animate-fade-in stagger-1">
          <div class="stat-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-card-value">${players.length.toLocaleString()}</div>
          <div class="stat-card-label">Total Players</div>
        </div>
        <div class="stat-card animate-fade-in stagger-2">
          <div class="stat-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <div class="stat-card-value">${leagues.length}</div>
          <div class="stat-card-label">Leagues</div>
        </div>
        <div class="stat-card animate-fade-in stagger-3">
          <div class="stat-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect width="10" height="10" x="7" y="7" rx="1"/></svg>
          </div>
          <div class="stat-card-value">${teams.length}</div>
          <div class="stat-card-label">Teams</div>
        </div>
        <div class="stat-card animate-fade-in stagger-4">
          <div class="stat-card-icon" style="background: linear-gradient(135deg, #f5a623, #f59e0b);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div class="stat-card-value">${topRated[0]?.stats.rating?.toFixed(1) || '—'}</div>
          <div class="stat-card-label">Highest Rating</div>
        </div>
      </div>
    </div>

    <!-- League Distribution -->
    <div class="view-section animate-fade-in stagger-2">
      <div class="section-header">
        <div>
          <div class="section-title">League Distribution</div>
          <div class="section-subtitle">Players across Big 5 European leagues</div>
        </div>
      </div>
      <div class="stats-grid">
        ${leagues.map(league => {
          const count = players.filter(p => p.league === league).length;
          const pct = ((count / players.length) * 100).toFixed(1);
          return `
            <div class="card" style="border-left: 3px solid ${getLeagueColor(league)};">
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <div>
                  <div style="font-size:1.4rem;margin-bottom:2px;">${getLeagueEmoji(league)}</div>
                  <div style="font-weight:600;font-size:0.95rem;">${league}</div>
                  <div style="font-size:0.78rem;color:var(--text-tertiary);">${count} players (${pct}%)</div>
                </div>
                <div style="font-family:var(--font-heading);font-size:1.6rem;font-weight:700;color:${getLeagueColor(league)};">${count}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Position Distribution -->
    <div class="view-section animate-fade-in stagger-3">
      <div class="section-header">
        <div>
          <div class="section-title">Position Breakdown</div>
          <div class="section-subtitle">Players by position across all leagues</div>
        </div>
      </div>
      <div class="grid-4">
        ${[
          { pos: 'FW', label: 'Forwards', count: fwCount, color: '#ef4444' },
          { pos: 'MF', label: 'Midfielders', count: mfCount, color: '#00f5a0' },
          { pos: 'DF', label: 'Defenders', count: dfCount, color: '#3b82f6' },
          { pos: 'GK', label: 'Goalkeepers', count: gkCount, color: '#f5a623' }
        ].map(({ pos, label, count, color }) => `
          <div class="card" style="text-align:center;">
            <div class="position-badge ${pos.toLowerCase()}" style="margin:0 auto 8px;width:36px;height:36px;font-size:0.8rem;">${pos}</div>
            <div style="font-family:var(--font-heading);font-size:1.6rem;font-weight:700;color:${color};">${count}</div>
            <div style="font-size:0.8rem;color:var(--text-tertiary);">${label}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Top Players -->
    <div class="view-section animate-fade-in stagger-4">
      <div class="section-header">
        <div class="section-title">Top Players</div>
      </div>
      <div class="grid-3">
        <!-- Top Rated -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">⭐ Highest Rated</span>
          </div>
          ${topRated.map((p, i) => `
            <div class="search-result-item" data-player-id="${p.id}" style="border-radius:var(--radius-sm);">
              <span style="font-weight:700;color:var(--accent-gold);width:20px;">${i + 1}</span>
              <div style="flex:1;">
                <div class="result-name">${p.name}</div>
                <div class="result-meta">${p.team}</div>
              </div>
              <span class="league-tag ${getLeagueClass(p.league)}" style="font-size:0.65rem;">${p.league.slice(0, 3)}</span>
              <span class="league-tag" style="font-size:0.65rem;background:var(--bg-tertiary);">${p.season}</span>
              <span style="font-weight:700;color:var(--accent-green);">${p.stats.rating?.toFixed(1)}</span>
            </div>
          `).join('')}
        </div>

        <!-- Top Scorers -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">⚽ Top Scorers (per 90)</span>
          </div>
          ${topScorers.map((p, i) => `
            <div class="search-result-item" data-player-id="${p.id}" style="border-radius:var(--radius-sm);">
              <span style="font-weight:700;color:var(--accent-gold);width:20px;">${i + 1}</span>
              <div style="flex:1;">
                <div class="result-name">${p.name}</div>
                <div class="result-meta">${p.team}</div>
              </div>
              <span class="league-tag ${getLeagueClass(p.league)}" style="font-size:0.65rem;">${p.league.slice(0, 3)}</span>
              <span class="league-tag" style="font-size:0.65rem;background:var(--bg-tertiary);">${p.season}</span>
              <span style="font-weight:700;color:var(--accent-green);">${p.stats.goals?.toFixed(2)}</span>
            </div>
          `).join('')}
        </div>

        <!-- Top Assists -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">🎯 Top Assists (per 90)</span>
          </div>
          ${topAssists.map((p, i) => `
            <div class="search-result-item" data-player-id="${p.id}" style="border-radius:var(--radius-sm);">
              <span style="font-weight:700;color:var(--accent-gold);width:20px;">${i + 1}</span>
              <div style="flex:1;">
                <div class="result-name">${p.name}</div>
                <div class="result-meta">${p.team}</div>
              </div>
              <span class="league-tag ${getLeagueClass(p.league)}" style="font-size:0.65rem;">${p.league.slice(0, 3)}</span>
              <span class="league-tag" style="font-size:0.65rem;background:var(--bg-tertiary);">${p.season}</span>
              <span style="font-weight:700;color:var(--accent-green);">${p.stats.assists?.toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
