import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_COMMUNITY_CENTER_LEVEL = 'building_level_communityCenter';
const KEY_HOME_LEVEL = 'building_level_home';
const KEY_GARDEN_LEVEL = 'building_level_garden';

export async function getCommunityCenterLevel() {
  try {
    const value = await AsyncStorage.getItem(KEY_COMMUNITY_CENTER_LEVEL);
    return value != null ? Math.max(1, parseInt(value, 10)) : 1;
  } catch {
    return 1;
  }
}

export async function setCommunityCenterLevel(level) {
  const n = Math.max(1, Math.min(10, parseInt(level, 10) || 1));
  await AsyncStorage.setItem(KEY_COMMUNITY_CENTER_LEVEL, String(n));
  return n;
}

export async function incrementCommunityCenterLevel() {
  const current = await getCommunityCenterLevel();
  const next = Math.min(10, current + 1);
  await AsyncStorage.setItem(KEY_COMMUNITY_CENTER_LEVEL, String(next));
  return next;
}

export async function getHomeLevel() {
  try {
    const value = await AsyncStorage.getItem(KEY_HOME_LEVEL);
    return value != null ? Math.max(1, parseInt(value, 10)) : 1;
  } catch {
    return 1;
  }
}

export async function setHomeLevel(level) {
  const n = Math.max(1, Math.min(10, parseInt(level, 10) || 1));
  await AsyncStorage.setItem(KEY_HOME_LEVEL, String(n));
  return n;
}

export async function incrementHomeLevel() {
  const current = await getHomeLevel();
  const next = Math.min(10, current + 1);
  await AsyncStorage.setItem(KEY_HOME_LEVEL, String(next));
  return next;
}

export async function getGardenLevel() {
  try {
    const value = await AsyncStorage.getItem(KEY_GARDEN_LEVEL);
    return value != null ? Math.max(1, parseInt(value, 10)) : 1;
  } catch {
    return 1;
  }
}

export async function setGardenLevel(level) {
  const n = Math.max(1, Math.min(10, parseInt(level, 10) || 1));
  await AsyncStorage.setItem(KEY_GARDEN_LEVEL, String(n));
  return n;
}

export async function incrementGardenLevel() {
  const current = await getGardenLevel();
  const next = Math.min(10, current + 1);
  await AsyncStorage.setItem(KEY_GARDEN_LEVEL, String(next));
  return next;
}
