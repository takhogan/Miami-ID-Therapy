import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getCommunityCenterLevel, setCommunityCenterLevel, getHomeLevel, setHomeLevel, getGardenLevel, setGardenLevel } from '../storage/buildingLevels';

const BACKGROUND_IMAGE = require('../assets/images/background.png');

const BUILDING_IMAGES = {
  cityHall: require('../assets/buildings/building-city-hall.jpeg'),
};

// Level 1 = building-garden.jpeg; add building-garden-2.png, -3.png for per-level art
const GARDEN_LEVEL_IMAGES = [
  require('../assets/buildings/building-garden.jpeg'),
  require('../assets/buildings/building-garden-2.png'),
  require('../assets/buildings/building-garden-3.png'),
];

// Level 1 = building-home.jpeg; reuse so app works without -2/-3. Add building-home-2.png and building-home-3.png in assets/buildings/ for per-level art, then require them here.
const HOME_LEVEL_IMAGES = [
  require('../assets/buildings/building-home.jpeg'),
  require('../assets/buildings/building-home-2.png'),
  require('../assets/buildings/building-home-3.png'),
];

// Level 1 = building-community-center.jpeg, level 2 = -2.png, level 3 = -3.png
const COMMUNITY_CENTER_LEVEL_IMAGES = [
  require('../assets/buildings/building-community-center.jpeg'),
  require('../assets/buildings/building-community-center-2.png'),
  require('../assets/buildings/building-community-center-3.png'),
];

const ACTIVITIES = [
  { id: 'home', name: 'Home', description: 'Guided breathing', screenName: 'Home' },
  { id: 'cityHall', name: 'City Hall', description: 'Mindfulness', screenName: 'CityHall' },
  { id: 'communityCenter', name: 'Community Center', description: 'Reflection', screenName: 'CommunityCenter' },
  { id: 'garden', name: 'Garden', description: 'Grounding', screenName: 'Garden' },
];

function Building({ activity, onPress, communityCenterLevel, homeLevel, gardenLevel }) {
  const source =
    activity.id === 'communityCenter'
      ? COMMUNITY_CENTER_LEVEL_IMAGES[
          Math.min(
            (communityCenterLevel || 1) - 1,
            COMMUNITY_CENTER_LEVEL_IMAGES.length - 1
          )
        ]
      : activity.id === 'home'
        ? HOME_LEVEL_IMAGES[
            Math.min((homeLevel || 1) - 1, HOME_LEVEL_IMAGES.length - 1)
          ]
        : activity.id === 'garden'
          ? GARDEN_LEVEL_IMAGES[
              Math.min((gardenLevel || 1) - 1, GARDEN_LEVEL_IMAGES.length - 1)
            ]
          : BUILDING_IMAGES[activity.id];
  return (
    <TouchableOpacity
      style={styles.buildingWrap}
      onPress={() => onPress(activity.screenName)}
      activeOpacity={0.85}
    >
      {source ? (
        <Image source={source} style={styles.buildingImage} resizeMode="contain" />
      ) : (
        <View style={styles.buildingPlaceholder} />
      )}
      <Text style={styles.buildingLabel} numberOfLines={1}>{activity.name}</Text>
    </TouchableOpacity>
  );
}

export default function ActivitiesScreen({ navigation, route }) {
  const [communityCenterLevel, setCommunityCenterLevelState] = useState(1);
  const [homeLevel, setHomeLevelState] = useState(1);
  const [gardenLevel, setGardenLevelState] = useState(1);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const paramHomeLevel = route.params?.homeLevel;
      const paramGardenLevel = route.params?.gardenLevel;
      if (paramHomeLevel != null) {
        setHomeLevelState(paramHomeLevel);
        navigation.setParams({ homeLevel: undefined });
      }
      if (paramGardenLevel != null) {
        setGardenLevelState(paramGardenLevel);
        navigation.setParams({ gardenLevel: undefined });
      }
      getCommunityCenterLevel().then((level) => {
        if (!cancelled) setCommunityCenterLevelState(level);
      });
      getHomeLevel().then((level) => {
        if (!cancelled) setHomeLevelState((prev) => (paramHomeLevel != null ? paramHomeLevel : level));
      });
      getGardenLevel().then((level) => {
        if (!cancelled) setGardenLevelState((prev) => (paramGardenLevel != null ? paramGardenLevel : level));
      });
      return () => { cancelled = true; };
    }, [navigation, route.params?.homeLevel, route.params?.gardenLevel])
  );

  const handleResetLevels = useCallback(async () => {
    await setCommunityCenterLevel(1);
    setCommunityCenterLevelState(1);
    await setHomeLevel(1);
    setHomeLevelState(1);
    await setGardenLevel(1);
    setGardenLevelState(1);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.backgroundWrap}>
        <Image source={BACKGROUND_IMAGE} style={styles.backgroundImage} resizeMode="cover" />
      </View>
      <View style={styles.contentArea}>
        <Text style={styles.headerTitle}>Activities</Text>
        <Text style={styles.headerSubtitle}>Tap a building</Text>
        <View style={styles.buildingsGrid}>
          {ACTIVITIES.map((activity) => (
            <Building
              key={activity.id}
              activity={activity}
              onPress={navigation.navigate}
              communityCenterLevel={communityCenterLevel}
              homeLevel={homeLevel}
              gardenLevel={gardenLevel}
            />
          ))}
        </View>
      </View>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleResetLevels}
        activeOpacity={0.5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundWrap: {
    ...StyleSheet.absoluteFillObject,
    width: '400%',
    height: '400%',
    left: '-150%',
    top: '-150%',
    transform: [{ scale: 0.25 }],
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  contentArea: {
    flex: 1,
    margin: 16,
    marginTop: 48,
    padding: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2d2d2d',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4a4a4a',
    textAlign: 'center',
    marginTop: 2,
  },
  buildingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginTop: 20,
    gap: 20,
  },
  buildingWrap: {
    alignItems: 'center',
    width: '45%',
    maxWidth: 140,
  },
  buildingImage: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 88,
  },
  buildingPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 88,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
  },
  buildingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d2d2d',
    marginTop: 6,
    textAlign: 'center',
  },
  resetButton: {
    position: 'absolute',
    right: 12,
    bottom: 24,
    width: 44,
    height: 44,
    backgroundColor: 'transparent',
  },
});
