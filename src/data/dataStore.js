/**
 * EuroScout AI — Data Store & Utilities
 */
import playersData from '../data/players.json';

// Global data store
let _players = [];
let _metadata = {};
let _currentSeason = 'All';

export function initData() {
  _metadata = playersData.metadata;
  _players = playersData.players;
  if (_metadata.available_seasons && _metadata.available_seasons.length > 0) {
    _currentSeason = _metadata.available_seasons[0]; // Default to latest
  }
  return { players: _players, metadata: _metadata, currentSeason: _currentSeason };
}

export function getPlayers() { 
  if (_currentSeason === 'All') return _players;
  return _players.filter(p => p.season === _currentSeason);
}
export function getMetadata() { return _metadata; }

export function getUniqueSeasons() {
  return _metadata.available_seasons || ['25/26'];
}

export function getCurrentSeason() { return _currentSeason; }

export function setSeason(season) {
  _currentSeason = season;
}

export function getPlayerById(id) {
  return _players.find(p => p.id === id);
}

export function searchPlayers(query, limit = 10) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  let basePlayers = _players;
  if (_currentSeason !== 'All') {
    basePlayers = basePlayers.filter(p => p.season === _currentSeason);
  }
  const results = basePlayers.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.team.toLowerCase().includes(q)
  );
  // Sort by name match quality
  results.sort((a, b) => {
    const aStart = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bStart = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    return aStart - bStart;
  });
  return results.slice(0, limit);
}

export function getUniqueLeagues() {
  return [...new Set(_players.map(p => p.league))].sort();
}

export function getUniqueTeams(league = null) {
  let filtered = _players;
  if (_currentSeason !== 'All') {
    filtered = filtered.filter(p => p.season === _currentSeason);
  }
  if (league) filtered = filtered.filter(p => p.league === league);
  return [...new Set(filtered.map(p => p.team))].sort();
}

export function getUniquePositions() {
  return ['FW', 'MF', 'DF', 'GK'];
}

export function getLeagueClass(league) {
  const map = {
    'Premier League': 'premier-league',
    'La Liga': 'la-liga',
    'Bundesliga': 'bundesliga',
    'Serie A': 'serie-a',
    'Ligue 1': 'ligue-1'
  };
  return map[league] || '';
}

export function getLeagueColor(league) {
  const map = {
    'Premier League': '#7c3aed',
    'La Liga': '#f59e0b',
    'Bundesliga': '#ef4444',
    'Serie A': '#3b82f6',
    'Ligue 1': '#6366f1'
  };
  return map[league] || '#94a3b8';
}

export function getLeagueEmoji(league) {
  const map = {
    'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'La Liga': '🇪🇸',
    'Bundesliga': '🇩🇪',
    'Serie A': '🇮🇹',
    'Ligue 1': '🇫🇷'
  };
  return map[league] || '⚽';
}

export function formatStatName(key) {
  const map = {
    'rating': 'Rating',
    'goals': 'Goals',
    'xg': 'xG',
    'big_chances_missed': 'Big Chances Missed',
    'total_shots': 'Total Shots',
    'shots_on_target': 'Shots on Target',
    'shots_off_target': 'Shots off Target',
    'goal_conversion_pct': 'Goal Conv. %',
    'successful_dribbles': 'Dribbles',
    'successful_dribbles_pct': 'Dribble %',
    'goals_inside_box': 'Goals (Box)',
    'goals_outside_box': 'Goals (Outside)',
    'headed_goals': 'Headed Goals',
    'hit_woodwork': 'Hit Woodwork',
    'offsides': 'Offsides',
    'penalties_won': 'Penalties Won',
    'penalty_goals': 'Penalty Goals',
    'free_kick_goals': 'FK Goals',
    'tackles': 'Tackles',
    'interceptions': 'Interceptions',
    'clearances': 'Clearances',
    'blocked_shots': 'Blocked Shots',
    'dribbled_past': 'Dribbled Past',
    'errors_leading_to_goal': 'Errors → Goal',
    'errors_leading_to_shot': 'Errors → Shot',
    'penalties_committed': 'Penalties Committed',
    'own_goals': 'Own Goals',
    'clean_sheets': 'Clean Sheets',
    'big_chances_created': 'Big Chances Created',
    'assists': 'Assists',
    'passes_to_assist': 'Pre-Assists',
    'key_passes': 'Key Passes',
    'total_passes': 'Total Passes',
    'accurate_passes': 'Acc. Passes',
    'accurate_passes_pct': 'Pass Acc. %',
    'passes_own_half': 'Passes (Own Half)',
    'passes_opp_half': 'Passes (Opp Half)',
    'accurate_final_third_passes': 'Final Third Passes',
    'accurate_crosses': 'Crosses',
    'accurate_crosses_pct': 'Cross Acc. %',
    'accurate_long_balls': 'Long Balls',
    'accurate_long_balls_pct': 'Long Ball %',
    'appearances': 'Apps',
    'started': 'Started',
    'minutes_played': 'Minutes',
    'yellow_cards': 'Yellows',
    'red_cards': 'Reds',
    'fouls': 'Fouls',
    'was_fouled': 'Fouled',
    'possession_lost': 'Poss. Lost',
    'dispossessed': 'Dispossessed',
    'total_duels_won': 'Duels Won',
    'total_duels_won_pct': 'Duels Won %',
    'ground_duels_won': 'Ground Duels',
    'ground_duels_won_pct': 'Ground Duels %',
    'aerial_duels_won': 'Aerial Duels',
    'aerial_duels_won_pct': 'Aerial %'
  };
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Stat categories for organizing display
export const STAT_CATEGORIES = {
  'Attacking': ['goals', 'xg', 'total_shots', 'shots_on_target', 'goal_conversion_pct', 'big_chances_missed', 'goals_inside_box', 'goals_outside_box', 'headed_goals'],
  'Creativity': ['assists', 'key_passes', 'big_chances_created', 'passes_to_assist', 'accurate_crosses', 'accurate_crosses_pct', 'accurate_final_third_passes'],
  'Passing': ['total_passes', 'accurate_passes', 'accurate_passes_pct', 'passes_own_half', 'passes_opp_half', 'accurate_long_balls', 'accurate_long_balls_pct'],
  'Defending': ['tackles', 'interceptions', 'clearances', 'blocked_shots', 'dribbled_past', 'fouls'],
  'Dribbling': ['successful_dribbles', 'successful_dribbles_pct', 'was_fouled', 'dispossessed', 'possession_lost'],
  'Duels': ['total_duels_won', 'total_duels_won_pct', 'ground_duels_won', 'ground_duels_won_pct', 'aerial_duels_won', 'aerial_duels_won_pct'],
  'Discipline': ['yellow_cards', 'red_cards', 'fouls', 'penalties_committed', 'own_goals', 'errors_leading_to_goal']
};

// Key stats for quick display by position
export const KEY_STATS_BY_POSITION = {
  FW: ['goals', 'xg', 'assists', 'total_shots', 'successful_dribbles', 'key_passes'],
  MF: ['goals', 'assists', 'key_passes', 'accurate_passes_pct', 'tackles', 'interceptions'],
  DF: ['tackles', 'interceptions', 'clearances', 'aerial_duels_won_pct', 'accurate_passes_pct', 'blocked_shots'],
  GK: ['clean_sheets', 'accurate_passes_pct', 'accurate_long_balls_pct', 'aerial_duels_won_pct', 'total_passes', 'appearances']
};

// Radar chart stats by position — optimized for visual comparison relevance
export const RADAR_STATS_BY_POSITION = {
  FW: [
    'goals', 'xg', 'total_shots', 'shots_on_target', 'goal_conversion_pct',
    'assists', 'key_passes', 'big_chances_created', 'successful_dribbles', 'was_fouled'
  ],
  MF: [
    'tackles', 'interceptions', 'key_passes', 'assists',
    'accurate_passes_pct', 'accurate_final_third_passes',
    'total_duels_won_pct', 'big_chances_created', 'accurate_long_balls', 'total_passes'
  ],
  DF: [
    'tackles', 'interceptions', 'clearances', 'blocked_shots',
    'aerial_duels_won_pct', 'total_duels_won_pct', 'ground_duels_won_pct',
    'accurate_passes_pct', 'accurate_long_balls_pct', 'total_passes'
  ],
  GK: [
    'clean_sheets', 'accurate_passes_pct', 'accurate_long_balls_pct',
    'total_passes', 'aerial_duels_won_pct'
  ]
};

// Scatter plot presets
export const SCATTER_PRESETS = [
  { label: 'xG vs Goals', x: 'xg', y: 'goals' },
  { label: 'Key Passes vs Assists', x: 'key_passes', y: 'assists' },
  { label: 'Tackles vs Interceptions', x: 'tackles', y: 'interceptions' },
  { label: 'Shots vs Goal Conv. %', x: 'total_shots', y: 'goal_conversion_pct' },
  { label: 'Dribbles vs Was Fouled', x: 'successful_dribbles', y: 'was_fouled' },
  { label: 'Passes vs Pass Acc. %', x: 'total_passes', y: 'accurate_passes_pct' },
  { label: 'Aerial % vs Clearances', x: 'aerial_duels_won_pct', y: 'clearances' },
  { label: 'xG vs Big Chances Missed', x: 'xg', y: 'big_chances_missed' }
];
