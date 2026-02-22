import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_GARDEN_STATE = 'garden_state';

/** @returns {string} YYYY-MM-DD for the given date */
export function getDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Growth stage from days since planted. No scoring — purely time-based.
 * 0–2: seedling, 3–6: growing, 7–13: fuller, 14+: full
 */
export function getGrowthStage(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const days = Math.floor((now - created) / (24 * 60 * 60 * 1000));
  if (days <= 2) return 'seedling';
  if (days <= 6) return 'growing';
  if (days <= 13) return 'fuller';
  return 'full';
}

/**
 * @typedef {Object} Plant
 * @property {string} thought
 * @property {'water'|'let_it_be'|'alternative'} choice
 * @property {string} [alternativeText] - when choice is 'alternative'
 * @property {string} createdAt - ISO string
 */

/**
 * @typedef {Object} GardenState
 * @property {string} lastVisitDateKey - YYYY-MM-DD when user last completed today's plant
 * @property {Plant[]} plants
 */

/** @returns {Promise<GardenState>} */
export async function getGardenState() {
  try {
    const raw = await AsyncStorage.getItem(KEY_GARDEN_STATE);
    if (!raw) return { lastVisitDateKey: '', plants: [] };
    const parsed = JSON.parse(raw);
    return {
      lastVisitDateKey: parsed.lastVisitDateKey ?? '',
      plants: Array.isArray(parsed.plants) ? parsed.plants : [],
    };
  } catch {
    return { lastVisitDateKey: '', plants: [] };
  }
}

/** @returns {Promise<boolean>} true if user already tended today's thought */
export async function isDoneForToday() {
  const today = getDateKey();
  const state = await getGardenState();
  return state.lastVisitDateKey === today;
}

/**
 * Save today's choice and add the plant to the garden. No scoring.
 * @param {string} thought - the thought that was shown today
 * @param {'water'|'let_it_be'|'alternative'} choice
 * @param {string} [alternativeText] - when choice is 'alternative'
 */
export async function saveTodayChoice(thought, choice, alternativeText) {
  const today = getDateKey();
  const state = await getGardenState();
  const plant = {
    thought,
    choice,
    ...(alternativeText && { alternativeText }),
    createdAt: new Date().toISOString(),
  };
  const plants = [...state.plants, plant];
  await AsyncStorage.setItem(
    KEY_GARDEN_STATE,
    JSON.stringify({
      lastVisitDateKey: today,
      plants,
    })
  );
}

/**
 * Pick a random thought from the pool (no once-per-day limit).
 * @param {string[]} thoughtPool
 * @returns {string}
 */
export function getRandomThought(thoughtPool) {
  const index = Math.floor(Math.random() * thoughtPool.length);
  return thoughtPool[index];
}
