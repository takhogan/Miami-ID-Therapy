import * as Speech from 'expo-speech';

/**
 * Text-to-speech service. Call from anywhere:
 *   import speechService from './services/speechService';
 *   speechService.speak('Hello');
 */
const speechService = {
  speak(text, options = {}) {
    if (!text || typeof text !== 'string') return;
    Speech.speak(text, {
      language: options.language ?? 'en-US',
      pitch: options.pitch ?? 1.0,
      rate: options.rate ?? 0.9,
      volume: options.volume ?? 1.0,
      onDone: options.onDone,
      onError: options.onError,
    });
  },

  stop() {
    Speech.stop();
  },

  async isSpeaking() {
    return Speech.isSpeakingAsync();
  },
};

export default speechService;
