/**
 * EuroScout AI — API Client
 * Communicates with the Python FastAPI backend.
 */

const API_BASE = 'http://localhost:8000/api';

async function fetchJSON(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      console.warn('Backend not available, falling back to client-side.');
      return null;
    }
    throw err;
  }
}

/**
 * Check if the Python backend is available.
 */
export async function checkBackend() {
  try {
    const result = await fetchJSON(`${API_BASE}/health`);
    return result && result.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Find similar players via the sklearn backend.
 */
export async function findSimilarAPI(playerId, options = {}) {
  const body = {
    player_id: playerId,
    top_n: options.topN || 10,
    league: options.league || null,
    position: options.position || null,
    cross_league_only: options.crossLeagueOnly || false,
    min_minutes: options.minMinutes || 270,
    method: options.method || 'cosine',
  };

  return await fetchJSON(`${API_BASE}/similar`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Get player percentiles from backend.
 */
export async function getPercentilesAPI(playerId) {
  return await fetchJSON(`${API_BASE}/percentiles/${playerId}`);
}

/**
 * Get PCA 2D data for scatter visualization.
 */
export async function getPCAData(league = '', position = '') {
  const params = new URLSearchParams();
  if (league) params.set('league', league);
  if (position) params.set('position', position);
  return await fetchJSON(`${API_BASE}/pca?${params}`);
}

/**
 * Get KMeans cluster summaries.
 */
export async function getClusters() {
  return await fetchJSON(`${API_BASE}/clusters`);
}

/**
 * Get league aggregate stats.
 */
export async function getLeagueStats() {
  return await fetchJSON(`${API_BASE}/stats/leagues`);
}

/**
 * Get dataset metadata.
 */
export async function getMetadata() {
  return await fetchJSON(`${API_BASE}/meta`);
}

/**
 * Search players via backend.
 */
export async function searchPlayersAPI(query, limit = 10) {
  const params = new URLSearchParams({ search: query, limit: String(limit) });
  return await fetchJSON(`${API_BASE}/players?${params}`);
}

/**
 * Get player details.
 */
export async function getPlayerAPI(playerId) {
  return await fetchJSON(`${API_BASE}/players/${playerId}`);
}
