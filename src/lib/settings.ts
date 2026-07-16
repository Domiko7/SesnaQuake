import { create } from "zustand";
import { Store } from "@tauri-apps/plugin-store";
import { DEFAULT_SETTINGS, parseSettings, formatSettings, type AppSettings } from "./settingsSchema";
import { isTauri } from "./runtime";

interface NavigatorUAData {
  brands: Array<{ brand: string; version: string }>;
  mobile: boolean;
  platform: string;
}

declare global {
  interface Navigator {
    userAgentData?: NavigatorUAData;
  }
}

export const detectOS = (): string => {
  if (navigator.userAgentData?.platform) {
    return navigator.userAgentData.platform.toLowerCase();
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("windows phone")) return "windows phone";
  if (userAgent.includes("android")) return "android";
  if (/ipad|iphone|ipod/.test(userAgent)) return "iOS";
  if (userAgent.includes("win")) return "windows";
  if (userAgent.includes("mac")) return "macOS";
  if (userAgent.includes("linux")) return "linux";

  return "unknown";
};

interface SettingsState {
  settings: AppSettings;
  isFirstLaunch: boolean;
}

export const useSettingsStore = create<SettingsState>(() => ({
  settings: DEFAULT_SETTINGS,
  isFirstLaunch: false,
}));

export const getSettings = (): AppSettings => useSettingsStore.getState().settings;

const LOCALSTORAGE_KEY = "app_settings";
const STORE_FILE = "settings.json";
const STORE_KEY = "values";

let store: Store | null = null;

const readLegacyLocalStorage = (): Record<string, string> | null => {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const applyUiZoom = (uiZoom: number): void => {
  document.documentElement.style.zoom = uiZoom !== 100 ? `${uiZoom}%` : "";
  requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
};

const UI_ZOOM_STEPS = [40, 50, 60, 75, 90, 100, 110, 125, 150, 175];
const REFERENCE_WIDTH = 1920;
const REFERENCE_HEIGHT = 1080;

export const detectBestUiZoom = (): number => {
  const width = window.innerWidth || window.screen.availWidth || REFERENCE_WIDTH;
  const height = window.innerHeight || window.screen.availHeight || REFERENCE_HEIGHT;
  const ratio = Math.min(width / REFERENCE_WIDTH, height / REFERENCE_HEIGHT) * 100;
  const clamped = Math.min(100, Math.max(40, ratio));
  return UI_ZOOM_STEPS.reduce((closest, step) =>
    Math.abs(step - clamped) < Math.abs(closest - clamped) ? step : closest
  );
};

export const loadSettings = async (): Promise<void> => {
  let raw: Record<string, string> | null = null;

  if (isTauri()) {
    store = await Store.load(STORE_FILE);
    raw = (await store.get<Record<string, string>>(STORE_KEY)) ?? null;
    if (!raw) {
      raw = readLegacyLocalStorage();
      if (raw) {
        await store.set(STORE_KEY, raw);
        await store.save();
      }
    }
  } else {
    raw = readLegacyLocalStorage();
  }

  const settings = raw ? parseSettings(raw) : { ...DEFAULT_SETTINGS, uiZoom: detectBestUiZoom() };
  useSettingsStore.setState({ settings, isFirstLaunch: !raw });
  applyUiZoom(settings.uiZoom);
};

export const saveSettings = (settings: AppSettings): void => {
  useSettingsStore.setState({ settings });
  applyUiZoom(settings.uiZoom);

  const raw = formatSettings(settings);
  if (store) {
    store.set(STORE_KEY, raw).then(() => store!.save()).catch((err) => {
      console.error("Failed to persist settings:", err);
    });
  } else {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(raw));
    } catch (err) {
      console.error("Failed to persist settings:", err);
    }
  }
};
