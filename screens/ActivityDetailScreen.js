import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import recordingService, { DEFAULT_UPLOAD_URL } from '../services/recordingService';

const BREATHING_ACTIVITY_ID = 'home';

export default function ActivityDetailScreen({ route, navigation }) {
  const { activity } = route.params;
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState(null); // 'recording' | 'uploading' | 'done' | 'error'
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (activity?.id !== BREATHING_ACTIVITY_ID) return;

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
  }, [activity?.id]);

  const handleRecordPress = useCallback(async () => {
    if (isRecording) {
      setStatus('uploading');
      setStatusMessage('Uploading...');
      const result = await recordingService.stopAndUpload(DEFAULT_UPLOAD_URL, {
        activityId: activity?.id ?? '',
        activityName: activity?.name ?? '',
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
  }, [isRecording, activity?.id, activity?.name]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>{activity.name}</Text>
        <Text style={styles.description}>{activity.description}</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Activity content goes here</Text>
        </View>

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
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>Back to Activities</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  description: {
    fontSize: 17,
    color: '#6e6e73',
    marginTop: 8,
  },
  placeholder: {
    marginTop: 32,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  placeholderText: {
    fontSize: 15,
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
});
