import { getSettings } from "./settings";
import { getBrowserVoicesFor } from "./ttsVoices";
import { synthesizeAzure } from "./ttsProviders/azure";
import { synthesizeElevenLabs } from "./ttsProviders/elevenlabs";
import { synthesizeOpenAi } from "./ttsProviders/openai";
import { eqSound } from "./sounds";

export interface TtsSegment {
  language: string;
  text: string;
}

export interface TtsConfig {
  ttsEngine: "browser" | "azure" | "elevenlabs" | "openai";
  ttsVoice: string;
  azureApiKey: string;
  azureRegion: string;
  elevenlabsApiKey: string;
  elevenlabsVoiceId: string;
  openaiApiKey: string;
  openaiVoice: string;
}

const speakBrowser = (speed: number, segments: TtsSegment[], voiceName: string): void => {
  speechSynthesis.cancel();
  for (const segment of segments) {
    const utterance = new SpeechSynthesisUtterance(segment.text);
    const voices = getBrowserVoicesFor(segment.language);
    const voice = voices.find(v => v.name === voiceName) ?? voices[0];

    if (voice) utterance.voice = voice;
    utterance.lang = segment.language;
    utterance.rate = speed;
    speechSynthesis.speak(utterance);
  }
};

let currentAudio: HTMLAudioElement | null = null;
let playSession = 0;

const playAudioUrl = (url: string, speed: number, session: number): Promise<void> =>
  new Promise((resolve, reject) => {
    if (session !== playSession) {
      resolve();
      return;
    }
    const audio = new Audio(url);
    currentAudio = audio;
    audio.playbackRate = speed;
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("Audio playback failed"));
    audio.play().catch(reject);
  });

const speakCloud = async (
  speed: number,
  segments: TtsSegment[],
  synthesize: (segment: TtsSegment) => Promise<Blob>,
): Promise<void> => {
  const session = ++playSession;
  currentAudio?.pause();

  const blobs = await Promise.all(segments.map(synthesize));
  for (const blob of blobs) {
    if (session !== playSession) return;
    const url = URL.createObjectURL(blob);
    try {
      await playAudioUrl(url, speed, session);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
};

const speakWithConfig = (config: TtsConfig, speed: number, segments: TtsSegment[]): void => {
  if (segments.length === 0) return;

  if (config.ttsEngine === "azure" && config.azureApiKey && config.azureRegion) {
    speakCloud(speed, segments, segment =>
      synthesizeAzure(segment.text, segment.language, { apiKey: config.azureApiKey, region: config.azureRegion })
    ).catch(err => {
      console.error("Azure TTS failed, falling back to browser TTS:", err);
      speakBrowser(speed, segments, config.ttsVoice);
    });
  } else if (config.ttsEngine === "elevenlabs" && config.elevenlabsApiKey && config.elevenlabsVoiceId) {
    speakCloud(speed, segments, segment =>
      synthesizeElevenLabs(segment.text, { apiKey: config.elevenlabsApiKey, voiceId: config.elevenlabsVoiceId })
    ).catch(err => {
      console.error("ElevenLabs TTS failed, falling back to browser TTS:", err);
      speakBrowser(speed, segments, config.ttsVoice);
    });
  } else if (config.ttsEngine === "openai" && config.openaiApiKey && config.openaiVoice) {
    speakCloud(speed, segments, segment =>
      synthesizeOpenAi(segment.text, { apiKey: config.openaiApiKey, voice: config.openaiVoice })
    ).catch(err => {
      console.error("OpenAI TTS failed, falling back to browser TTS:", err);
      speakBrowser(speed, segments, config.ttsVoice);
    });
  } else {
    speakBrowser(speed, segments, config.ttsVoice);
  }
};

const configFromSettings = (): TtsConfig => {
  const s = getSettings();
  return {
    ttsEngine: s.ttsEngine,
    ttsVoice: s.ttsVoice,
    azureApiKey: s.azureApiKey,
    azureRegion: s.azureRegion,
    elevenlabsApiKey: s.elevenlabsApiKey,
    elevenlabsVoiceId: s.elevenlabsVoiceId,
    openaiApiKey: s.openaiApiKey,
    openaiVoice: s.openaiVoice,
  };
};

export const speakSegments = (speed: number, segments: TtsSegment[]): void => {
  if (!getSettings().ttsEnabled || segments.length === 0) return;
  speakWithConfig(configFromSettings(), speed, segments);
};

export const speak = (speed: number, language: string, text: string): void => {
  speakSegments(speed, [{ language, text }]);
};

export const testSpeak = (config: TtsConfig, language: string, text: string): void => {
  speakWithConfig(config, 1.2, [{ language, text }]);
};

let audioUnlocked = false;

const unlockAudio = () => {
  if (audioUnlocked) return;
  audioUnlocked = true;
  const unlock = new Audio(eqSound);
  unlock.volume = 0;
  unlock.play().then(() => {
    unlock.pause();
    unlock.currentTime = 0;
  }).catch(() => {});
};

if (typeof window !== "undefined") {
  const unlockEvents = ["pointerdown", "keydown", "touchstart"] as const;
  const handleFirstInteraction = () => {
    unlockAudio();
    unlockEvents.forEach((event) => window.removeEventListener(event, handleFirstInteraction));
  };
  unlockEvents.forEach((event) => window.addEventListener(event, handleFirstInteraction));
}

const activeSounds = new Set<HTMLAudioElement>();

export const playSound = (sound: string, volume?: number) => {
  const audio = new Audio(sound);
  const volumePercent = volume ?? getSettings().soundVolume;
  audio.volume = Math.min(1, Math.max(0, volumePercent / 100));
  activeSounds.add(audio);

  audio.play()
    .catch(err => console.error("Failed to play sound:", err))
    .finally(() => {
      audio.onended = () => activeSounds.delete(audio);
    });
};
