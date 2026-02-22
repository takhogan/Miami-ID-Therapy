import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { GARDEN_THOUGHTS, GARDEN_ALTERNATIVES } from '../data/gardenThoughts';
import {
  getGardenState,
  getRandomThought,
  saveTodayChoice,
  getGrowthStage,
} from '../storage/gardenStorage';
import { incrementGardenLevel } from '../storage/buildingLevels';

const KEY_LINE = "You don't control what grows — you control what you tend.";

const GROWTH_LABELS = {
  seedling: '🌱 Seedling',
  growing: '🌿 Growing',
  fuller: '🪴 Fuller',
  full: '🌳 Full',
};

function pickAlternatives(count = 3) {
  const shuffled = [...GARDEN_ALTERNATIVES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function GardenScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState([]);
  const [todayThought, setTodayThoughtState] = useState('');
  const [phase, setPhase] = useState('choose'); // 'choose' | 'picking_alternative' | 'tended'
  const [alternatives, setAlternatives] = useState([]);

  const loadGarden = useCallback(async () => {
    setLoading(true);
    const state = await getGardenState();
    setPlants(state.plants || []);
    setTodayThoughtState(getRandomThought(GARDEN_THOUGHTS));
    setPhase('choose');
    setAlternatives([]);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGarden();
    }, [loadGarden])
  );

  const handleChoice = useCallback(
    async (choice) => {
      if (choice === 'alternative') {
        setAlternatives(pickAlternatives(4));
        setPhase('picking_alternative');
        return;
      }
      await saveTodayChoice(todayThought, choice);
      setPlants((prev) => [
        ...prev,
        { thought: todayThought, choice, createdAt: new Date().toISOString() },
      ]);
      setPhase('tended');
    },
    [todayThought]
  );

  const handleAlternativePicked = useCallback(
    async (alternativeText) => {
      await saveTodayChoice(todayThought, 'alternative', alternativeText);
      setPlants((prev) => [
        ...prev,
        {
          thought: todayThought,
          choice: 'alternative',
          alternativeText,
          createdAt: new Date().toISOString(),
        },
      ]);
      setPhase('tended');
    },
    [todayThought]
  );

  const handleDone = useCallback(async () => {
    const nextLevel = await incrementGardenLevel();
    navigation.navigate('Activities', { gardenLevel: nextLevel });
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2d5a3a" />
          <Text style={styles.loadingText}>Opening the garden…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Garden</Text>
          <Text style={styles.description}>Grounding</Text>

          {phase === 'choose' && (
            <View style={styles.card}>
              <Text style={styles.plantLabel}>A thought appeared in your garden:</Text>
              <View style={styles.thoughtBubble}>
                <Text style={styles.thoughtText}>"{todayThought}"</Text>
              </View>
              <Text style={styles.prompt}>What do you do?</Text>
              <TouchableOpacity
                style={[styles.choiceButton, styles.water]}
                onPress={() => handleChoice('water')}
                activeOpacity={0.7}
              >
                <Text style={styles.choiceButtonText}>💧 Water it — attend to it</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.choiceButton, styles.letBe]}
                onPress={() => handleChoice('let_it_be')}
                activeOpacity={0.7}
              >
                <Text style={styles.choiceButtonText}>🌿 Let it be</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.choiceButton, styles.alternative]}
                onPress={() => handleChoice('alternative')}
                activeOpacity={0.7}
              >
                <Text style={styles.choiceButtonText}>🌱 Plant an alternative nearby</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'picking_alternative' && (
            <View style={styles.card}>
              <Text style={styles.plantLabel}>Choose one to plant nearby:</Text>
              {alternatives.map((alt) => (
                <TouchableOpacity
                  key={alt}
                  style={styles.altButton}
                  onPress={() => handleAlternativePicked(alt)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.altButtonText}>{alt}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.skipAlt}
                onPress={() => setPhase('choose')}
                activeOpacity={0.7}
              >
                <Text style={styles.skipAltText}>Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'tended' && (
            <View style={styles.card}>
              <Text style={styles.keyLine}>{KEY_LINE}</Text>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleDone}
                activeOpacity={0.7}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {plants.length > 0 && (
            <View style={styles.gardenSection}>
              <Text style={styles.gardenSectionTitle}>Your garden</Text>
              <Text style={styles.gardenHint}>Growth shows over time. No scoring.</Text>
              {[...plants].reverse().slice(0, 20).map((plant, i) => {
                const stage = getGrowthStage(plant.createdAt);
                return (
                  <View key={`${plant.createdAt}-${i}`} style={styles.plantRow}>
                    <Text style={styles.plantStage}>{GROWTH_LABELS[stage]}</Text>
                    <Text style={styles.plantThought} numberOfLines={2}>
                      {plant.thought}
                    </Text>
                    {plant.choice === 'alternative' && plant.alternativeText && (
                      <Text style={styles.plantAlt} numberOfLines={1}>
                        + {plant.alternativeText}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.backButton}
        onPress={phase === 'tended' ? handleDone : () => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>
          {phase === 'tended' ? 'Done' : 'Back to Activities'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f7f2',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#5a7a62',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  description: {
    fontSize: 17,
    color: '#5a7a62',
    marginTop: 8,
  },
  card: {
    marginTop: 24,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c8e6d0',
  },
  doneTodayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d5a3a',
    marginBottom: 12,
  },
  keyLine: {
    fontSize: 17,
    fontStyle: 'italic',
    color: '#2d5a3a',
    lineHeight: 24,
  },
  plantLabel: {
    fontSize: 16,
    color: '#4a6b52',
    marginBottom: 12,
  },
  thoughtBubble: {
    backgroundColor: '#e8f5ec',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#5a9a6e',
  },
  thoughtText: {
    fontSize: 16,
    color: '#1d1d1f',
    lineHeight: 22,
  },
  prompt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d5a3a',
    marginBottom: 14,
  },
  choiceButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 10,
  },
  water: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#a8d5b4',
  },
  letBe: {
    backgroundColor: '#e8f4ea',
    borderWidth: 1,
    borderColor: '#c8e6d0',
  },
  alternative: {
    backgroundColor: '#f0f7f2',
    borderWidth: 1,
    borderColor: '#b8ddc4',
  },
  choiceButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1d1d1f',
  },
  altButton: {
    backgroundColor: '#e8f5ec',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#c8e6d0',
  },
  altButtonText: {
    fontSize: 15,
    color: '#1d1d1f',
    lineHeight: 21,
  },
  skipAlt: {
    marginTop: 12,
    alignSelf: 'center',
  },
  skipAltText: {
    fontSize: 15,
    color: '#6e6e73',
  },
  doneButton: {
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: '#2d5a3a',
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  gardenSection: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#c8e6d0',
  },
  gardenSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d5a3a',
    marginBottom: 4,
  },
  gardenHint: {
    fontSize: 14,
    color: '#6e6e73',
    marginBottom: 16,
  },
  plantRow: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  plantStage: {
    fontSize: 14,
    color: '#5a9a6e',
    marginBottom: 4,
  },
  plantThought: {
    fontSize: 15,
    color: '#1d1d1f',
    lineHeight: 20,
  },
  plantAlt: {
    fontSize: 13,
    color: '#6e6e73',
    marginTop: 6,
    fontStyle: 'italic',
  },
  backButton: {
    margin: 20,
    paddingVertical: 16,
    backgroundColor: '#2d5a3a',
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
});
