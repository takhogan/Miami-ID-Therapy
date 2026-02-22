import { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import recordingService, { DEFAULT_UPLOAD_URL } from '../services/recordingService';
import { incrementHomeLevel } from '../storage/buildingLevels';
import {
  AT_HOME_EVENTS,
  HOME_ACTIONS,
  ENGAGE_OPTIONS,
  AVOID_OPTIONS,
  FOLLOW_UPS,
  EVENTS_PER_SESSION,
  GAME_TITLE,
  GAME_SUBTITLE,
} from '../data/atHomeGame';

const HOME_BACKGROUND = require('../assets/home/background.png');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickOptions() {
  return [
    pickOne(HOME_ACTIONS),
    pickOne(ENGAGE_OPTIONS),
    pickOne(AVOID_OPTIONS),
  ];
}

export default function HomeScreen({ navigation }) {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const [gamePhase, setGamePhase] = useState('intro');
  const [eventOrder, setEventOrder] = useState([]);
  const [eventIndex, setEventIndex] = useState(0);
  const [currentEvent, setCurrentEvent] = useState('');
  const [currentOptions, setCurrentOptions] = useState([]);
  const [chosenOption, setChosenOption] = useState(null);
  const [followUp, setFollowUp] = useState('');
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const perm = await recordingService.requestPermissions();
      if (cancelled) return;
      if (!perm.granted) {
        Alert.alert('Permission needed', perm.error ?? 'Microphone access is required to record.');
        return;
      }
      const start = await recordingService.startRecording();
      if (cancelled) return;
      if (!start.success) {
        Alert.alert('Recording error', start.error ?? 'Could not start recording.');
        return;
      }
      setIsRecording(true);
      setStatus('recording');
      setStatusMessage('Recording... Tap Stop to send.');
    })();
    return () => { cancelled = true; };
  }, []);

  const animateBubbleIn = useCallback(() => {
    bubbleOpacity.setValue(0);
    bubbleScale.setValue(0.92);
    Animated.parallel([
      Animated.timing(bubbleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleScale, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bubbleOpacity, bubbleScale]);

  const startGame = useCallback(() => {
    const indices = shuffle(AT_HOME_EVENTS.map((_, i) => i)).slice(0, EVENTS_PER_SESSION);
    setEventOrder(indices);
    setEventIndex(0);
    setCurrentEvent(AT_HOME_EVENTS[indices[0]]);
    setCurrentOptions(shuffle(pickOptions()));
    setChosenOption(null);
    setFollowUp('');
    setGamePhase('playing');
    requestAnimationFrame(() => animateBubbleIn());
  }, [animateBubbleIn]);

  const handleChoice = useCallback(
    (option) => {
      setChosenOption(option);
      setFollowUp(pickOne(FOLLOW_UPS));
      setGamePhase('chosen');
    },
    []
  );

  const goToNextEvent = useCallback(() => {
    const next = eventIndex + 1;
    if (next >= EVENTS_PER_SESSION) {
      setGamePhase('done');
      return;
    }
    setEventIndex(next);
    setCurrentEvent(AT_HOME_EVENTS[eventOrder[next]]);
    setCurrentOptions(shuffle(pickOptions()));
    setChosenOption(null);
    setFollowUp('');
    setGamePhase('playing');
    requestAnimationFrame(() => animateBubbleIn());
  }, [eventIndex, eventOrder, animateBubbleIn]);

  const handleRecordPress = useCallback(async () => {
    if (isRecording) {
      setStatus('uploading');
      setStatusMessage('Uploading...');
      const result = await recordingService.stopAndUpload(DEFAULT_UPLOAD_URL, {
        activityId: 'home',
        activityName: 'Home',
      });
      setIsRecording(false);
      if (result.ok) {
        setStatus('done');
        setStatusMessage('Sent to backend.');
      } else {
        setStatus('error');
        setStatusMessage(result.error ?? 'Upload failed');
      }
      return;
    }

    const perm = await recordingService.requestPermissions();
    if (!perm.granted) {
      Alert.alert('Permission needed', perm.error ?? 'Microphone access is required to record.');
      return;
    }
    const start = await recordingService.startRecording();
    if (!start.success) {
      Alert.alert('Recording error', start.error ?? 'Could not start recording.');
      return;
    }
    setIsRecording(true);
    setStatus('recording');
    setStatusMessage('Recording... Tap Stop to send.');
  }, [isRecording]);

  const renderGame = () => {
    if (gamePhase === 'intro') {
      return (
        <View style={styles.gameCard}>
          <Text style={styles.gameTitle}>{GAME_TITLE}</Text>
          <Text style={styles.gameSubtitle}>{GAME_SUBTITLE}</Text>
          <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.7}>
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (gamePhase === 'done') {
      return (
        <View style={styles.gameCard}>
          <Text style={styles.doneTitle}>You kept the house running.</Text>
          <Text style={styles.doneSubtitle}>However you responded, you stayed home.</Text>
          <View style={styles.doneButtons}>
            <TouchableOpacity style={styles.againButton} onPress={startGame} activeOpacity={0.7}>
              <Text style={styles.againButtonText}>Again</Text>
            </TouchableOpacity>
            <View style={styles.doneButtonSpacer} />
            <TouchableOpacity
              style={styles.doneButton}
              onPress={async () => {
                const nextLevel = await incrementHomeLevel();
                navigation.navigate('Activities', { homeLevel: nextLevel });
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (gamePhase === 'chosen') {
      return (
        <View style={styles.gameCard}>
          <Animated.View
            style={[
              styles.bubble,
              {
                opacity: bubbleOpacity,
                transform: [{ scale: bubbleScale }],
              },
            ]}
          >
            <Text style={styles.bubbleText}>{currentEvent}</Text>
          </Animated.View>
          <View style={styles.chosenRow}>
            <Text style={styles.chosenLabel}>You chose: {chosenOption}</Text>
          </View>
          <Text style={styles.followUpText}>{followUp}</Text>
          <TouchableOpacity style={styles.nextButton} onPress={goToNextEvent} activeOpacity={0.7}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.gameCard}>
        <Animated.View
          style={[
            styles.bubble,
            {
              opacity: bubbleOpacity,
              transform: [{ scale: bubbleScale }],
            },
          ]}
        >
          <Text style={styles.bubbleText}>{currentEvent}</Text>
        </Animated.View>
        <Text style={styles.choosePrompt}>What do you do?</Text>
        <View style={styles.options}>
          {currentOptions.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.optionButton}
              onPress={() => handleChoice(opt)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionButtonText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.eventCounter}>
          {eventIndex + 1} of {EVENTS_PER_SESSION}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ImageBackground source={HOME_BACKGROUND} style={styles.backgroundImage} resizeMode="cover">
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {renderGame()}

            <View style={styles.recordingSection}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordButtonStop]}
              onPress={handleRecordPress}
              activeOpacity={0.7}
              disabled={status === 'uploading'}
            >
              {status === 'uploading' ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.recordButtonText}>
                  {isRecording ? 'Stop & send' : 'Record'}
                </Text>
              )}
            </TouchableOpacity>
            {(statusMessage || status === 'error') && (
              <Text style={[styles.statusText, status === 'error' && styles.statusError]}>
                {statusMessage}
              </Text>
            )}
            <Text style={styles.hint}>Audio is POSTed to {DEFAULT_UPLOAD_URL}</Text>
          </View>
        </View>
      </ScrollView>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Back to Activities</Text>
        </TouchableOpacity>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  backgroundImage: {
    flex: 1,
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
  gameCard: {
    marginTop: 8,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d1d1f',
    textAlign: 'center',
  },
  gameSubtitle: {
    fontSize: 15,
    color: '#6e6e73',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  startButton: {
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#1d1d1f',
    borderRadius: 12,
    alignSelf: 'center',
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  bubble: {
    padding: 20,
    backgroundColor: '#f0f4f8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  bubbleText: {
    fontSize: 17,
    color: '#1d1d1f',
    textAlign: 'center',
    lineHeight: 24,
  },
  choosePrompt: {
    fontSize: 15,
    color: '#6e6e73',
    marginTop: 20,
    marginBottom: 12,
  },
  options: {},
  optionButton: {
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  optionButtonText: {
    fontSize: 16,
    color: '#1d1d1f',
  },
  eventCounter: {
    marginTop: 16,
    fontSize: 13,
    color: '#8e8e93',
    textAlign: 'center',
  },
  chosenRow: {
    marginTop: 16,
  },
  chosenLabel: {
    fontSize: 15,
    color: '#6e6e73',
    fontStyle: 'italic',
  },
  followUpText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1d1d1f',
    lineHeight: 24,
  },
  nextButton: {
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: '#1d1d1f',
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d1f',
    textAlign: 'center',
  },
  doneSubtitle: {
    fontSize: 16,
    color: '#6e6e73',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 24,
  },
  doneButtons: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'center',
  },
  doneButtonSpacer: { width: 12 },
  againButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#e5e5ea',
    borderRadius: 12,
  },
  againButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  doneButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#1d1d1f',
    borderRadius: 12,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  recordingSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    alignItems: 'center',
  },
  recordButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: '#1d1d1f',
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  recordButtonStop: {
    backgroundColor: '#c0392b',
  },
  recordButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6e6e73',
  },
  statusError: {
    color: '#c0392b',
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: '#8e8e93',
  },
  backButton: {
    margin: 20,
    paddingVertical: 16,
    backgroundColor: '#1d1d1f',
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
});
