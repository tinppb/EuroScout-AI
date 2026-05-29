import fs from 'fs';
import path from 'path';

const DATA_DIR = 'D:\\top 5 League EU(25_26)\\data\\processed';

const PER90_FILES = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('_PER90_STATS.csv'));

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  
  // Handle CSV parsing with proper comma handling
  const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/\r/g, ''));
    if (values.length !== headers.length) continue;
    
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      const val = values[j];
      // Preserve strings that contain a slash (like "23/24")
      if (val.includes('/')) {
        row[headers[j]] = val;
      } else {
        const num = parseFloat(val);
        row[headers[j]] = isNaN(num) ? val : num;
      }
    }
    rows.push(row);
  }
  return rows;
}

// Column name mapping: CSV column -> clean JSON key
const STAT_KEYS = {
  'Sofascore Rating': 'rating',
  'Goals': 'goals',
  'xG': 'xg',
  'Big chances missed': 'big_chances_missed',
  'Total shots': 'total_shots',
  'Shots on target': 'shots_on_target',
  'Shots off target': 'shots_off_target',
  'Goal conversion %': 'goal_conversion_pct',
  'Succ. dribbles': 'successful_dribbles',
  'Succ. dribbles %': 'successful_dribbles_pct',
  'Goals inside box': 'goals_inside_box',
  'Goals outside box': 'goals_outside_box',
  'Headed goals': 'headed_goals',
  'Hit woodwork': 'hit_woodwork',
  'Offsides': 'offsides',
  'Penalties won': 'penalties_won',
  'Penalty goals': 'penalty_goals',
  'Free kick goals': 'free_kick_goals',
  'Tackles': 'tackles',
  'Interceptions': 'interceptions',
  'Clearances': 'clearances',
  'Blocked shots': 'blocked_shots',
  'Dribbled past': 'dribbled_past',
  'Errors leading to goal': 'errors_leading_to_goal',
  'Errors leading to shot': 'errors_leading_to_shot',
  'Penalties committed': 'penalties_committed',
  'Own goals': 'own_goals',
  'Clean sheets': 'clean_sheets',
  'Big chances created': 'big_chances_created',
  'Assists': 'assists',
  'Passes to assist': 'passes_to_assist',
  'Key passes': 'key_passes',
  'Total passes': 'total_passes',
  'Accurate passes': 'accurate_passes',
  'Accurate passes %': 'accurate_passes_pct',
  'Passes in own half': 'passes_own_half',
  'Passes in opp. half': 'passes_opp_half',
  'Acc. final third passes': 'accurate_final_third_passes',
  'Accurate crosses': 'accurate_crosses',
  'Accurate crosses %': 'accurate_crosses_pct',
  'Accurate long balls': 'accurate_long_balls',
  'Accurate long balls %': 'accurate_long_balls_pct',
  'Appearances': 'appearances',
  'Started': 'started',
  'Minutes played': 'minutes_played',
  'Yellow cards': 'yellow_cards',
  'Red cards': 'red_cards',
  'Fouls': 'fouls',
  'Was fouled': 'was_fouled',
  'Possession lost': 'possession_lost',
  'Dispossessed': 'dispossessed',
  'Total duels won': 'total_duels_won',
  'Total duels won %': 'total_duels_won_pct',
  'Ground duels won': 'ground_duels_won',
  'Ground duels won %': 'ground_duels_won_pct',
  'Aerial duels won': 'aerial_duels_won',
  'Aerial duels won %': 'aerial_duels_won_pct'
};

// Stats to use for similarity engine (per90 performance stats, not metadata)
const SIMILARITY_STATS = [
  'goals', 'xg', 'total_shots', 'shots_on_target', 'goal_conversion_pct',
  'successful_dribbles', 'successful_dribbles_pct',
  'tackles', 'interceptions', 'clearances', 'blocked_shots',
  'big_chances_created', 'assists', 'key_passes',
  'total_passes', 'accurate_passes_pct',
  'accurate_final_third_passes', 'accurate_crosses', 'accurate_crosses_pct',
  'accurate_long_balls', 'accurate_long_balls_pct',
  'total_duels_won', 'total_duels_won_pct',
  'ground_duels_won', 'ground_duels_won_pct',
  'aerial_duels_won', 'aerial_duels_won_pct',
  'fouls', 'was_fouled', 'possession_lost', 'dispossessed'
];

function normalizePosition(pos) {
  if (!pos) return 'Unknown';
  const p = pos.toLowerCase().trim();
  if (p.includes('goalkeeper') || p === 'gk') return 'GK';
  if (p.includes('defender') || p === 'df') return 'DF';
  if (p.includes('midfielder') || p === 'mf') return 'MF';
  if (p.includes('forward') || p.includes('attacker') || p === 'fw') return 'FW';
  return pos;
}

function fixEncoding(name) {
  if (name === null || name === undefined) return 'Unknown';
  name = String(name);
  // Fix common mojibake patterns from UTF-8 → Latin-1 misread
  return name
    .replace(/A�/g, 'ã')
    .replace(/A©/g, 'é')
    .replace(/A¡/g, 'á')
    .replace(/Aº/g, 'ú')
    .replace(/A³/g, 'ó')
    .replace(/A±/g, 'ñ')
    .replace(/A­/g, 'í')
    .replace(/Ã©/g, 'é')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã³/g, 'ó')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã¶/g, 'ö')
    .replace(/Ã¤/g, 'ä')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã­/g, 'í')
    .replace(/Ãº/g, 'ú');
}

// Process all files
let allPlayers = [];
let globalId = 1;

for (const file of PER90_FILES) {
  const filePath = path.join(DATA_DIR, file);
  const text = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(text);
  
  // Extract league and season from filename (e.g., Bundesliga_23_24_PER90_STATS.csv)
  let leagueStr = file.replace('_PER90_STATS.csv', '').replace(/_/g, ' ');
  let seasonStr = '25/26'; // Default fallback
  const match = file.match(/^(.*?)_(\d{2}_\d{2})_PER90_STATS\.csv$/);
  if (match) {
    leagueStr = match[1].replace(/_/g, ' ');
    seasonStr = match[2].replace('_', '/'); // "23_24" -> "23/24"
  }
  
  console.log(`Processing ${file} (Season: ${seasonStr}): ${rows.length} players`);
  
  for (const row of rows) {
    // Skip players with very few minutes (less than 270 = 3 full matches)
    const minutes = row['Minutes played'] || 0;
    if (minutes < 270) continue;
    
    const stats = {};
    for (const [csvCol, jsonKey] of Object.entries(STAT_KEYS)) {
      stats[jsonKey] = row[csvCol] !== undefined ? row[csvCol] : 0;
    }
    
    const player = {
      id: globalId++,
      player_id: row['Player ID'] || 0,
      name: fixEncoding(row['Name'] || 'Unknown'),
      team: fixEncoding(row['Team'] || 'Unknown'),
      league: row['League'] || leagueStr,
      season: row['Season'] || seasonStr,
      position: normalizePosition(row['Position']),
      stats: stats
    };
    
    allPlayers.push(player);
  }
}

console.log(`\nTotal players after filtering (>= 270 min): ${allPlayers.length}`);
console.log(`\nBreakdown by league:`);
const leagueCounts = {};
allPlayers.forEach(p => {
  leagueCounts[p.league] = (leagueCounts[p.league] || 0) + 1;
});
for (const [league, count] of Object.entries(leagueCounts)) {
  console.log(`  ${league}: ${count}`);
}

console.log(`\nBreakdown by position:`);
const posCounts = {};
allPlayers.forEach(p => {
  posCounts[p.position] = (posCounts[p.position] || 0) + 1;
});
for (const [pos, count] of Object.entries(posCounts)) {
  console.log(`  ${pos}: ${count}`);
}

console.log(`\nBreakdown by season:`);
const seasonCounts = {};
allPlayers.forEach(p => {
  seasonCounts[p.season] = (seasonCounts[p.season] || 0) + 1;
});
for (const [season, count] of Object.entries(seasonCounts)) {
  console.log(`  ${season}: ${count}`);
}

// Output
const outputDir = path.join('d:\\EuroScout AI', 'src', 'data');
fs.mkdirSync(outputDir, { recursive: true });

const output = {
  metadata: {
    source: 'Sofascore via crawl',
    season: 'Multiple',
    available_seasons: Object.keys(seasonCounts).sort().reverse(), // e.g. ["25/26", "24/25", "23/24"]
    last_updated: new Date().toISOString(),
    total_players: allPlayers.length,
    leagues: Object.keys(leagueCounts),
    stat_keys: Object.keys(STAT_KEYS).map((csv, i) => ({
      csv_column: csv,
      json_key: Object.values(STAT_KEYS)[i]
    })),
    similarity_features: SIMILARITY_STATS
  },
  players: allPlayers
};

fs.writeFileSync(
  path.join(outputDir, 'players.json'),
  JSON.stringify(output, null, 2),
  'utf-8'
);

console.log(`\n✅ Saved to src/data/players.json (${(JSON.stringify(output).length / 1024 / 1024).toFixed(2)} MB)`);
