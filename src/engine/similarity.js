/**
 * EuroScout AI — Similarity Engine
 * Cosine similarity with position-aware feature weighting and Z-score normalization.
 */

// Features used by position for similarity comparison
const POSITION_FEATURES = {
  FW: [
    'goals', 'xg', 'total_shots', 'shots_on_target', 'goal_conversion_pct',
    'successful_dribbles', 'big_chances_created', 'assists', 'key_passes',
    'aerial_duels_won_pct', 'was_fouled', 'accurate_final_third_passes'
  ],
  MF: [
    'goals', 'xg', 'assists', 'key_passes', 'accurate_passes_pct',
    'accurate_final_third_passes', 'successful_dribbles', 'tackles',
    'interceptions', 'total_duels_won_pct', 'big_chances_created',
    'accurate_long_balls', 'was_fouled', 'total_passes'
  ],
  DF: [
    'tackles', 'interceptions', 'clearances', 'blocked_shots',
    'aerial_duels_won_pct', 'total_duels_won_pct', 'ground_duels_won_pct',
    'accurate_passes_pct', 'accurate_long_balls_pct', 'fouls',
    'total_passes', 'dribbled_past'
  ],
  GK: [
    'clean_sheets', 'accurate_passes_pct', 'accurate_long_balls_pct',
    'total_passes', 'aerial_duels_won_pct'
  ]
};

// Default features when position doesn't match
const DEFAULT_FEATURES = [
  'goals', 'xg', 'assists', 'key_passes', 'total_shots',
  'tackles', 'interceptions', 'accurate_passes_pct',
  'successful_dribbles', 'total_duels_won_pct',
  'big_chances_created', 'aerial_duels_won_pct'
];

/**
 * Compute Z-score normalization for a set of players on given features.
 * Returns { means, stds, normalized } where normalized is array of feature-value arrays.
 */
function zScoreNormalize(players, features) {
  const n = players.length;
  const means = {};
  const stds = {};

  // Calculate mean
  for (const f of features) {
    let sum = 0;
    for (const p of players) {
      sum += (p.stats[f] || 0);
    }
    means[f] = sum / n;
  }

  // Calculate std
  for (const f of features) {
    let sumSq = 0;
    for (const p of players) {
      const diff = (p.stats[f] || 0) - means[f];
      sumSq += diff * diff;
    }
    stds[f] = Math.sqrt(sumSq / n) || 1; // Avoid division by zero
  }

  // Normalize
  const normalized = players.map(p => {
    const vec = {};
    for (const f of features) {
      vec[f] = ((p.stats[f] || 0) - means[f]) / stds[f];
    }
    return vec;
  });

  return { means, stds, normalized };
}

/**
 * Cosine similarity between two vectors (objects with same keys).
 */
function cosineSimilarity(vecA, vecB, features) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const f of features) {
    const a = vecA[f] || 0;
    const b = vecB[f] || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

/**
 * Find players similar to a target player.
 *
 * @param {Object} targetPlayer - The target player object
 * @param {Array} allPlayers - All players dataset
 * @param {Object} options - Filter options
 * @param {string} [options.league] - Filter by league (null = all leagues)
 * @param {string} [options.position] - Filter by position (null = same as target)
 * @param {number} [options.minMinutes] - Minimum minutes played
 * @param {boolean} [options.excludeSameTeam] - Exclude same team
 * @param {boolean} [options.crossLeagueOnly] - Only show players from other leagues
 * @param {number} [options.topN] - Number of results
 * @returns {Array} - Sorted array of { player, similarity, features }
 */
export function findSimilarPlayers(targetPlayer, allPlayers, options = {}) {
  const {
    league = null,
    position = null,
    minMinutes = 270,
    excludeSameTeam = false,
    crossLeagueOnly = false,
    topN = 10
  } = options;

  // Determine position for feature selection
  const targetPos = position || targetPlayer.position;
  const features = POSITION_FEATURES[targetPos] || DEFAULT_FEATURES;

  // Filter candidates
  let candidates = allPlayers.filter(p => {
    if (p.id === targetPlayer.id) return false;
    if (p.stats.minutes_played < minMinutes) return false;
    if (league && p.league !== league) return false;
    if (position && p.position !== position) return false;
    if (!position && targetPos !== 'GK' && p.position === 'GK') return false;
    if (excludeSameTeam && p.team === targetPlayer.team) return false;
    if (crossLeagueOnly && p.league === targetPlayer.league) return false;
    return true;
  });

  if (candidates.length === 0) return [];

  // Include target in normalization pool
  const pool = [targetPlayer, ...candidates];
  const { normalized } = zScoreNormalize(pool, features);

  const targetVec = normalized[0];

  // Calculate similarity for each candidate
  const results = candidates.map((player, i) => {
    const candidateVec = normalized[i + 1]; // +1 because target is at index 0
    const similarity = cosineSimilarity(targetVec, candidateVec, features);
    return {
      player,
      similarity: Math.max(0, similarity), // Clamp to 0-1
      similarityPct: Math.round(Math.max(0, similarity) * 100),
      features
    };
  });

  // Sort by similarity descending
  results.sort((a, b) => b.similarity - a.similarity);

  return results.slice(0, topN);
}

/**
 * Get percentile rank for a player's stat within a group.
 */
export function getPercentile(value, allValues) {
  const sorted = [...allValues].sort((a, b) => a - b);
  const rank = sorted.findIndex(v => v >= value);
  return Math.round((rank / sorted.length) * 100);
}

/**
 * Calculate percentiles for all stats of a player relative to same-position players.
 */
export function calculatePercentiles(player, allPlayers) {
  const samePos = allPlayers.filter(p =>
    p.position === player.position && p.stats.minutes_played >= 270
  );

  const percentiles = {};
  const statKeys = Object.keys(player.stats);

  for (const key of statKeys) {
    const values = samePos.map(p => p.stats[key] || 0);
    percentiles[key] = getPercentile(player.stats[key] || 0, values);
  }

  return percentiles;
}

/**
 * Get features used for a specific position
 */
export function getFeaturesForPosition(position) {
  return POSITION_FEATURES[position] || DEFAULT_FEATURES;
}

export { POSITION_FEATURES, DEFAULT_FEATURES };
