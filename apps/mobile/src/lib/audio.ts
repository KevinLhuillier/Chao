import { setAudioModeAsync } from 'expo-audio';

// Recordings must play even with the iPhone's silent switch on.
let audioModeSet = false;
export function ensureAudioMode() {
  if (audioModeSet) return;
  audioModeSet = true;
  setAudioModeAsync({ playsInSilentMode: true }).catch((e) => console.warn('setAudioMode', e));
}
