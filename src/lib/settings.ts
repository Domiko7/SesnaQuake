import { create } from "zustand";
import { Store } from "@tauri-apps/plugin-store";
import { DEFAULT_SETTINGS, parseSettings, formatSettings, type AppSettings } from "./settingsSchema";

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

const inTauri = (): boolean => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

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

export const loadSettings = async (): Promise<void> => {
  let raw: Record<string, string> | null = null;

  if (inTauri()) {
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

  const settings = raw ? parseSettings(raw) : DEFAULT_SETTINGS;
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
