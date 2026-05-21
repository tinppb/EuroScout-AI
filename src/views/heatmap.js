/**
 * EuroScout AI — Heatmap View
 */
import { getPlayers, getUniqueLeagues } from '../data/dataStore.js';
import { createHeatmap } from '../charts/heatmapChart.js';

const HEATMAP_STAT_GROUPS = {
  'Attacking': ['goals', 'xg', 'total_shots', 'shots_on_target', 'goal_conversion_pct'],
  'Creativity': ['assists', 'key_passes', 'big_chances_created', 'accurate_crosses', 'accurate_final_third_passes'],
  'Passing': ['total_passes', 'accurate_passes_pct', 'accurate_long_balls', 'accurate_long_balls_pct'],
  'Defending': ['tackles', 'interceptions', 'clearances', 'blocked_shots'],
  'Dribbling & Duels': ['successful_dribbles', 'total_duels_won_pct', 'ground_duels_won_pct', 'aerial_duels_won_pct'],
  'Discipline': ['fouls', 'yellow_cards', 'possession_lost']
};

export function renderHeatmap() {
  return `
    <div class="view-section animate-fade-in">
      <div class="section-header">
        <div>
          <div class="section-title">🔥 League Performance Heatmap</div>
          <div class="section-subtitle">Compare statistical averages across the Big 5 European leagues</div>
        </div>
      </div>

      <!-- Controls -->
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-md);margin-bottom:var(--space-lg);align-items:center;">
        <div class="filter-group">
          <label class="filter-label">Stat Category</label>
          <select id="heatmap-category" class="filter-select">
            ${Object.keys(HEATMAP_STAT_GROUPS).map((cat, i) => `
              <option value="${cat}" ${i === 0 ? 'selected' : ''}>${cat}</option>
            `).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Aggregation</label>
          <div class="tabs">
            <button class="tab-btn active" data-mode="average">Average</button>
            <button class="tab-btn" data-mode="median">Median</button>
            <button class="tab-btn" data-mode="max">Max</button>
          </div>
        </div>
        <div class="filter-group">
          <label class="filter-label">Position Filter</label>
          <select id="heatmap-position" class="filter-select">
            <option value="">All Outfield</option>
            <option value="FW">Forwards</option>
            <option value="MF">Midfielders</option>
            <option value="DF">Defenders</option>
          </select>
        </div>
      </div>

      <!-- Heatmap Container -->
      <div class="card">
        <div id="heatmap-container"></div>
      </div>

      <!-- Legend -->
      <div style="display:flex;align-items:center;gap:var(--space-md);margin-top:var(--space-md);justify-content:center;">
        <span style="font-size:0.75rem;color:var(--text-tertiary);">Low</span>
        <div style="width:200px;height:12px;border-radius:6px;background:linear-gradient(to right, rgb(220,60,60), rgb(220,220,60), rgb(40,220,100));"></div>
        <span style="font-size:0.75rem;color:var(--text-tertiary);">High</span>
      </div>
    </div>
  `;
}

export function initHeatmap() {
  let currentMode = 'average';

  const update = () => {
    const category = document.getElementById('heatmap-category').value;
    const posFilter = document.getElementById('heatmap-position').value;
    const stats = HEATMAP_STAT_GROUPS[category];
    const leagues = getUniqueLeagues();

    let players = getPlayers().filter(p => p.stats.minutes_played >= 450);
    if (posFilter) players = players.filter(p => p.position === posFilter);
    else players = players.filter(p => p.position !== 'GK'); // Exclude GK for outfield

    createHeatmap('heatmap-container', players, stats, leagues, { mode: currentMode });
  };

  document.getElementById('heatmap-category').addEventListener('change', update);
  document.getElementById('heatmap-position').addEventListener('change', update);

  document.querySelectorAll('.tab-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn[data-mode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      update();
    });
  });

  update();
}
