import { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import recordingService, { DEFAULT_UPLOAD_URL } from '../services/recordingService';
import speechService from '../services/speechService';
import { incrementCommunityCenterLevel } from '../storage/buildingLevels';

const COMMUNITY_BACKGROUND = require('../assets/community-center/conversation.png');

const BRAVE_CHALLENGES_LEVEL_1 = [
  'Say good morning to someone today.',
  'Ask for help with one thing.',
  'Give someone a compliment.',
];

const FEEL_OPTIONS = [
  { id: 'good', label: 'Good' },
  { id: 'okay', label: 'Okay' },
  { id: 'nervous', label: 'Nervous' },
  { id: 'proud', label: 'Proud' },
];

const DIALOG_OPTIONS_LEVEL_1 = [
  'Hi!',
  'I need help.',
  'Thank you.',
];

const getTodaysChallenge = () => {
  const dayIndex = new Date().toDateString().split('').reduce((a, c) => (a + c.charCodeAt(0)) % BRAVE_CHALLENGES_LEVEL_1.length, 0);
  return BRAVE_CHALLENGES_LEVEL_1[dayIndex];
};

export default function CommunityCenterScreen({ navigation }) {
  const [braveDoneToday, setBraveDoneToday] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showHowDidItFeel, setShowHowDidItFeel] = useState(false);
  const [bricksCount, setBricksCount] = useState(0);
  const [selectedFeel, setSelectedFeel] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordStatus, setRecordStatus] = useState(null);
  const [recordMessage, setRecordMessage] = useState('');

  const todaysChallenge = getTodaysChallenge();

  const handleIDidIt = useCallback(() => {
    setShowCelebration(true);
    setShowHowDidItFeel(true);
    setBraveDoneToday(true);
  }, []);

  const handleFeelTap = useCallback(
    (id) => {
      setSelectedFeel(id);
      setBricksCount((c) => c + 1);
      setShowHowDidItFeel(false);
      setShowCelebration(false);
    },
    []
  );

  const handleRecordPress = useCallback(async () => {
    if (isRecording) {
      setRecordStatus('uploading');
      setRecordMessage('Uploading...');
      const result = await recordingService.stopAndUpload(DEFAULT_UPLOAD_URL, {
        activityId: 'communityCenter',
        activityName: 'Community Center',
      });
      setIsRecording(false);
      if (result.ok) {
        setRecordStatus('done');
        setRecordMessage('Sent!');
      } else {
        setRecordStatus('error');
        setRecordMessage(result.error ?? 'Upload failed');
      }
      return;
    }
    const perm = await recordingService.requestPermissions();
    if (!perm.granted) {
      Alert.alert('Permission needed', perm.error ?? 'Microphone access is required.');
      return;
    }
    const start = await recordingService.startRecording();
    if (!start.success) {
      Alert.alert('Recording error', start.error ?? 'Could not start recording.');
      return;
    }
    setIsRecording(true);
    setRecordStatus('recording');
    setRecordMessage('Recording... Tap "Stop & send" when done.');
  }, [isRecording]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={COMMUNITY_BACKGROUND}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Community Center</Text>

            {/* Brave Moment — once a day */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Today's brave moment</Text>
              <Text style={styles.challengeText}>{todaysChallenge}</Text>
              {!braveDoneToday ? (
                <TouchableOpacity
                  style={styles.braveButton}
                  onPress={handleIDidIt}
                  activeOpacity={0.8}
                >
                  <Text style={styles.braveButtonText}>I did it!</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.doneWrap}>
                  <Text style={styles.doneText}>✓ You did it!</Text>
                  {showCelebration && showHowDidItFeel && (
                    <View style={styles.feelSection}>
                      <Text style={styles.feelPrompt}>How did it feel?</Text>
                      <View style={styles.feelOptions}>
                        {FEEL_OPTIONS.map((opt) => (
                          <TouchableOpacity
                            key={opt.id}
                            style={styles.feelChip}
                            onPress={() => handleFeelTap(opt.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.feelChipText}>{opt.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Wall: bricks from brave moments */}
            {bricksCount > 0 && (
              <View style={styles.wallSection}>
                <Text style={styles.wallTitle}>Our wall — built with your courage</Text>
                <View style={styles.brickRow}>
                  {Array.from({ length: Math.min(bricksCount, 12) }).map((_, i) => (
                    <View key={i} style={styles.brick} />
                  ))}
                </View>
                {bricksCount > 12 && (
                  <Text style={styles.brickCount}>+{bricksCount - 12} more bricks</Text>
                )}
              </View>
            )}

            {/* Conversation: level-1 dialog options + speak */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Practice talking</Text>
              <View style={styles.buddyPromptRow}>
                <Ionicons name="mic-outline" size={18} color="#666" style={styles.buddyPromptIcon} />
                <Text style={styles.buddyPrompt}>Choose something to say, or say it in your own words:</Text>
              </View>
              <View style={styles.dialogOptions}>
                {DIALOG_OPTIONS_LEVEL_1.map((line) => (
                  <TouchableOpacity
                    key={line}
                    style={styles.dialogChip}
                    onPress={() => speechService.speak(line)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dialogChipText}>{line}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.speakButton, isRecording && styles.speakButtonStop]}
                onPress={handleRecordPress}
                activeOpacity={0.7}
                disabled={recordStatus === 'uploading'}
              >
                {recordStatus === 'uploading' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="mic-outline" size={18} color="#fff" style={styles.speakButtonIcon} />
                    <Text style={styles.speakButtonText}>
                      {isRecording ? 'Stop & send' : 'Or speak in your own words'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {(recordMessage || recordStatus === 'error') && (
                <Text style={[styles.recordStatus, recordStatus === 'error' && styles.recordError]}>
                  {recordMessage}
                </Text>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Back to Activities</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={async () => {
              await incrementCommunityCenterLevel();
              navigation.navigate('Activities');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(229,229,234,0.9)',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  challengeText: {
    fontSize: 16,
    color: '#3a3a3c',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  braveButton: {
    backgroundColor: '#1d1d1f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  braveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  doneWrap: {
    marginTop: 4,
  },
  doneText: {
    fontSize: 16,
    color: '#34c759',
    fontWeight: '600',
  },
  feelSection: {
    marginTop: 12,
  },
  feelPrompt: {
    fontSize: 15,
    color: '#6e6e73',
    marginBottom: 8,
  },
  feelOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feelChip: {
    backgroundColor: '#e5e5ea',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  feelChipText: {
    fontSize: 15,
    color: '#1d1d1f',
    fontWeight: '500',
  },
  wallSection: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(229,229,234,0.9)',
  },
  wallTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6e6e73',
    marginBottom: 10,
  },
  brickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  brick: {
    width: 44,
    height: 22,
    backgroundColor: '#8b7355',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6b5344',
  },
  brickCount: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 8,
  },
  buddyPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  buddyPromptIcon: {
    marginRight: 8,
  },
  buddyPrompt: {
    fontSize: 15,
    color: '#6e6e73',
    flex: 1,
  },
  dialogOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dialogChip: {
    backgroundColor: '#e5e5ea',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  dialogChipText: {
    fontSize: 16,
    color: '#1d1d1f',
    fontWeight: '500',
  },
  speakButton: {
    backgroundColor: '#1d1d1f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  speakButtonStop: {
    backgroundColor: '#c0392b',
  },
  speakButtonIcon: {
    marginRight: 8,
  },
  speakButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  recordStatus: {
    marginTop: 8,
    fontSize: 14,
    color: '#6e6e73',
  },
  recordError: {
    color: '#c0392b',
  },
  backButton: {
    margin: 16,
    marginTop: 8,
    paddingVertical: 16,
    backgroundColor: 'rgba(29,29,31,0.9)',
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  doneButton: {
    marginHorizontal: 16,
    marginBottom: 24,
    marginTop: 0,
    paddingVertical: 16,
    backgroundColor: 'rgba(29,29,31,0.9)',
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
});
