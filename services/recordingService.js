import { Audio } from 'expo-av';
import speechService from './speechService';

/**
 * Default backend URL for speech-to-text. Use your machine's IP (e.g. http://192.168.1.x:3000)
 * when testing on a physical device; localhost works for simulator/emulator.
 */
const DEFAULT_UPLOAD_URL = 'http://localhost:3000/transcribe';

/**
 * Session run endpoint. Sends raw_content and optional params; by default speaks raw_content (TTS).
 */
const DEFAULT_SESSION_RUN_URL = 'http://localhost:8000/session/run';

const DEFAULT_TOLERANCE = {
  reading_complexity: 50,
  vocabulary_range: 50,
  abstraction_comfort: 50,
  working_memory_capacity: 50,
  frustration_sensitivity: 50,
};

let currentRecording = null;

const recordingService = {
  /**
   * Request recording permission and configure audio mode. Call before recording.
   * @returns {{ granted: boolean, error?: string }}
   */
  async requestPermissions() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        return { granted: false, error: 'Microphone permission denied' };
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      return { granted: true };
    } catch (err) {
      return { granted: false, error: err?.message ?? 'Permission failed' };
    }
  },

  /**
   * Start recording. Must call requestPermissions first.
   * @returns {{ success: boolean, error?: string }}
   */
  async startRecording() {
    try {
      if (currentRecording) {
        await currentRecording.stopAndUnloadAsync();
        currentRecording = null;
      }
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      currentRecording = recording;
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.message ?? 'Failed to start recording' };
    }
  },

  /**
   * Stop recording and return the local file URI.
   * @returns {{ uri: string | null, error?: string }}
   */
  async stopRecording() {
    if (!currentRecording) {
      return { uri: null, error: 'No active recording' };
    }
    try {
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      currentRecording = null;
      return { uri };
    } catch (err) {
      currentRecording = null;
      return { uri: null, error: err?.message ?? 'Failed to stop recording' };
    }
  },

  /**
   * POST the recorded audio file to the backend (e.g. for speech-to-text).
   * @param {string} uri - Local file URI from stopRecording()
   * @param {string} [uploadUrl] - Endpoint URL (default: DEFAULT_SESSION_RUN_URL)
   * @param {Record<string, string>} [extraFields] - Optional form fields (e.g. activityId, userId)
   * @returns {{ ok: boolean, data?: unknown, status?: number, error?: string }}
   */
  async uploadRecording(uri, uploadUrl = DEFAULT_SESSION_RUN_URL, extraFields = {}) {
    if (!uri) {
      return { ok: false, error: 'No recording URI' };
    }
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });
      Object.entries(extraFields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
          // Let fetch set Content-Type for FormData (multipart boundary)
        },
      });

      const contentType = response.headers.get('content-type');
      const data =
        contentType?.includes('application/json')
          ? await response.json()
          : await response.text();

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: typeof data === 'object' ? data?.message ?? JSON.stringify(data) : data,
        };
      }
      return { ok: true, data, status: response.status };
    } catch (err) {
      return {
        ok: false,
        error: err?.message ?? 'Upload failed',
      };
    }
  },

  /**
   * Record, then stop and upload in one flow. Convenience for "record → send".
   * Call startRecording() first, then after user stops, call this with the URI from stopRecording().
   * Or use stopAndUpload to stop the current recording and upload it.
   * @param {string} [uploadUrl] - Endpoint URL (default: DEFAULT_SESSION_RUN_URL)
   * @param {Record<string, string>} [extraFields]
   */
  async stopAndUpload(uploadUrl = DEFAULT_SESSION_RUN_URL, extraFields = {}) {
    const { uri, error: stopError } = await this.stopRecording();
    if (stopError || !uri) {
      return { ok: false, error: stopError ?? 'No recording' };
    }
    return this.uploadRecording(uri, uploadUrl, extraFields);
  },

  /**
   * Text-to-speech: speak the given text. Uses expo-speech via speechService.
   * @param {string} text - Text to speak
   * @param {{ language?: string, pitch?: number, rate?: number, volume?: number, onDone?: () => void, onError?: (err: string) => void }} [options] - Optional voice options
   */
  speak(text, options = {}) {
    speechService.speak(text, options);
  },

  /**
   * Stop any ongoing text-to-speech.
   */
  stopSpeech() {
    speechService.stop();
  },

  /**
   * Check if text-to-speech is currently speaking.
   * @returns {Promise<boolean>}
   */
  async isSpeaking() {
    return speechService.isSpeaking();
  },

  /**
   * Send raw_content to the session/run endpoint. By default speaks the text (TTS) then POSTs.
   * @param {string} rawContent - The main content to send and (by default) speak
   * @param {{
   *   speak?: boolean,
   *   sessionRunUrl?: string,
   *   client_id?: string,
   *   session_plan_id?: string,
   *   current_step?: string,
   *   tolerance?: Record<string, number>,
   *   speakOptions?: Parameters<typeof speechService.speak>[1]
   * }} [options] - speak: true = TTS raw_content first (default); others override payload dummies
   * @returns {{ ok: boolean, data?: unknown, status?: number, error?: string }}
   */
  async runSession(rawContent, options = {}) {
    const {
      speak = true,
      sessionRunUrl = DEFAULT_SESSION_RUN_URL,
      client_id = 'test-client',
      session_plan_id = 'test-plan',
      current_step = 'start',
      tolerance = DEFAULT_TOLERANCE,
      speakOptions = {},
    } = options;

    const payload = {
      client_id,
      session_plan_id,
      raw_content: rawContent ?? '',
      current_step,
      tolerance,
    };

    if (speak && (rawContent ?? '').trim()) {
      this.speak(rawContent, speakOptions);
    }

    try {
      const response = await fetch(sessionRunUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type');
      const data =
        contentType?.includes('application/json')
          ? await response.json()
          : await response.text();

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: typeof data === 'object' ? data?.message ?? JSON.stringify(data) : data,
        };
      }
      return { ok: true, data, status: response.status };
    } catch (err) {
      return {
        ok: false,
        error: err?.message ?? 'Session run request failed',
      };
    }
  },
};

export default recordingService;
export { DEFAULT_UPLOAD_URL, DEFAULT_SESSION_RUN_URL, DEFAULT_TOLERANCE };
