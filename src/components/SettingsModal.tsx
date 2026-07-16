import { useEffect, useState, type InputHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import { enable as enableAutostart, disable as disableAutostart } from "@tauri-apps/plugin-autostart";
import { SETTINGS_SCHEMA, formatSettings, parseSettings } from "../lib/settingsSchema";
import type { SettingField, SettingOption } from "../lib/settingsSchema";
import { getSettings, saveSettings, detectBestUiZoom } from "../lib/settings";
import { testSpeak, playSound } from "../lib/speaker";
import type { TtsConfig } from "../lib/speaker";
import { eqSound, updateSound, eew2Sound, eew5Sound, reportSound, alertSound, resolveAlertStrongSound } from "../lib/sounds";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SOUND_TEST_SOURCES: Record<string, (language: string, custom?: string) => string> = {
  soundEqEnabled: (_language, custom) => custom || eqSound,
  soundUpdateEnabled: (_language, custom) => custom || updateSound,
  soundEew2Enabled: (_language, custom) => custom || eew2Sound,
  soundEew5Enabled: (_language, custom) => custom || eew5Sound,
  soundReportEnabled: (_language, custom) => custom || reportSound,
  soundAlertEnabled: (_language, custom) => custom || alertSound,
  soundAlertStrongEnabled: (language, custom) => resolveAlertStrongSound(language, custom),
};

const CUSTOM_SOUND_FIELD: Record<string, string> = {
  soundEqEnabled: "customSoundEq",
  soundUpdateEnabled: "customSoundUpdate",
  soundEew2Enabled: "customSoundEew2",
  soundEew5Enabled: "customSoundEew5",
  soundReportEnabled: "customSoundReport",
  soundAlertEnabled: "customSoundAlert",
  soundAlertStrongEnabled: "customSoundAlertStrong",
};

const MIN_MAG_FIELD: Record<string, string> = {
  sourceWolfxJma: "minMagWolfxJma",
  sourceWolfxSc: "minMagWolfxSc",
  sourceWolfxCenc: "minMagWolfxCenc",
  sourceWolfxFj: "minMagWolfxFj",
  sourceWolfxCq: "minMagWolfxCq",
  sourceKmaEew: "minMagKmaEew",
  sourceShakealert: "minMagShakealert",
  sourceExptechCwa: "minMagExptechCwa",
  sourceExptechNied: "minMagExptechNied",
  sourceCwaReport: "minMagCwaReport",
  sourceKmaReport: "minMagKmaReport",
  sourceCenc: "minMagCenc",
  sourceJma: "minMagJma",
  sourceEmsc: "minMagEmsc",
  sourceUsgs: "minMagUsgs",
  sourceBcsf: "minMagBcsf",
  sourceHko: "minMagHko",
  sourceGfz: "minMagGfz",
  sourceUsp: "minMagUsp",
  sourceFssn: "minMagFssn",
  sourceNingxia: "minMagNingxia",
  sourceGuangxi: "minMagGuangxi",
  sourceShanxi: "minMagShanxi",
  sourceBeijing: "minMagBeijing",
  sourceYunnan: "minMagYunnan",
  sourceGeonet: "minMagGeonet",
  sourceBreq: "minMagBreq",
};

const MAX_CUSTOM_SOUND_BYTES = 500 * 1024;

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const SettingsModal = ({ open, onClose }: SettingsModalProps) => {
  const { t, i18n } = useTranslation();
  const [values, setValues] = useState<Record<string, string>>(() => formatSettings(getSettings()));
  const [voiceTick, setVoiceTick] = useState(0);

  useEffect(() => {
    const handler = () => setVoiceTick((v) => v + 1);
    speechSynthesis.addEventListener("voiceschanged", handler);
    return () => speechSynthesis.removeEventListener("voiceschanged", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [open, onClose]);

  const setValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const optionLabel = (option: SettingOption): string => option.label ?? t(option.labelKey ?? "");

  const optionsFor = (field: SettingField): SettingOption[] => {
    void voiceTick;
    return typeof field.options === "function" ? field.options(values) : field.options ?? [];
  };

  const handleNotificationsChange = async (value: string) => {
    setValue("notifications", value);
    if (value === "on" && !(await isPermissionGranted())) {
      await requestPermission();
    }
  };

  const handleAutostartChange = async (value: string) => {
    setValue("autostart", value);
    if (value === "on") await enableAutostart();
    else await disableAutostart();
  };

  const handleSave = () => {
    saveSettings(parseSettings(values));
    location.reload();
  };

  const handleTestTts = () => {
    const config: TtsConfig = {
      ttsEngine: (values.ttsEngine as TtsConfig["ttsEngine"]) ?? "browser",
      ttsVoice: values.ttsVoice ?? "",
      azureApiKey: values.azureApiKey ?? "",
      azureRegion: values.azureRegion ?? "",
      elevenlabsApiKey: values.elevenlabsApiKey ?? "",
      elevenlabsVoiceId: values.elevenlabsVoiceId ?? "",
      openaiApiKey: values.openaiApiKey ?? "",
      openaiVoice: values.openaiVoice ?? "",
    };
    const language = values.language || i18n.language;
    const text = t("ttsTest", { lng: language });
    testSpeak(config, language, text);
  };

  const handleTestSound = (fieldKey: string) => {
    const resolveSound = SOUND_TEST_SOURCES[fieldKey];
    if (!resolveSound) return;
    const customKey = CUSTOM_SOUND_FIELD[fieldKey];
    const volume = Number(values.soundVolume ?? "100");
    playSound(resolveSound(values.language || i18n.language, customKey ? values[customKey] : undefined), volume);
  };

  const handleCustomSoundChange = async (customKey: string, file: File | null) => {
    if (!file) return;
    if (file.size > MAX_CUSTOM_SOUND_BYTES) {
      window.alert(t("settingsSoundFileTooLarge", { size: Math.round(MAX_CUSTOM_SOUND_BYTES / 1024) }));
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setValue(customKey, dataUrl);
    } catch (err) {
      console.error("Failed to read custom sound file:", err);
    }
  };

  if (!open) return null;

  return (
    <div
      id="settings-banner"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-banner__title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="settings-modal">
        <header className="settings-modal__header">
          <h2 id="settings-banner__title">{t("settingsTitle")}</h2>
          <button
            id="settings-banner__close-btn"
            className="settings-modal__close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="settings-modal__body" id="settings-modal__body">
          {SETTINGS_SCHEMA.map((section) => (
            <section className="settings-group" key={section.titleKey}>
              <h3 className="settings-group__title">{t(section.titleKey)}</h3>
              <div className="settings-group__grid">
                {section.fields.filter((field) => !field.hidden && (field.visibleWhen?.(values) ?? true)).map((field) => {
                  const customKey = CUSTOM_SOUND_FIELD[field.key];
                  const customValue = customKey ? values[customKey] : undefined;
                  const minMagKey = MIN_MAG_FIELD[field.key];

                  return (
                  <div className="settings-field" key={field.key}>
                    <label htmlFor={`setting-${field.key}`}>{t(field.labelKey)}</label>
                    {field.type === "select" ? (
                      <select
                        id={`setting-${field.key}`}
                        value={values[field.key] ?? ""}
                        onChange={(e) => {
                          if (field.key === "notifications") handleNotificationsChange(e.target.value);
                          else if (field.key === "autostart") handleAutostartChange(e.target.value);
                          else setValue(field.key, e.target.value);
                        }}
                      >
                        {optionsFor(field).map((option) => (
                          <option key={option.value} value={option.value}>{optionLabel(option)}</option>
                        ))}
                      </select>
                    ) : field.type === "range" ? (
                      <div className="settings-range">
                        <input
                          id={`setting-${field.key}`}
                          type="range"
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          value={values[field.key] ?? field.default}
                          onChange={(e) => setValue(field.key, e.target.value)}
                        />
                        <span className="settings-range__value">{values[field.key] ?? field.default}%</span>
                      </div>
                    ) : (
                      <input
                        id={`setting-${field.key}`}
                        type="text"
                        autoComplete="off"
                        inputMode={field.inputMode as InputHTMLAttributes<HTMLInputElement>["inputMode"]}
                        value={values[field.key] ?? ""}
                        onChange={(e) => setValue(field.key, e.target.value)}
                      />
                    )}
                    {(SOUND_TEST_SOURCES[field.key] || customKey || field.key === "uiZoom") && (
                      <div className="settings-field__actions">
                        {SOUND_TEST_SOURCES[field.key] && (
                          <button type="button" className="settings-sound-test" onClick={() => handleTestSound(field.key)}>
                            {t("settingsSoundTest")}
                          </button>
                        )}
                        {field.key === "uiZoom" && (
                          <button type="button" className="settings-sound-test" onClick={() => setValue("uiZoom", String(detectBestUiZoom()))}>
                            {t("settingsUiZoomAuto")}
                          </button>
                        )}
                        {customKey && (
                          <>
                            <label className="settings-sound-replace">
                              {customValue ? t("settingsSoundReplace") : t("settingsSoundUpload")}
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => {
                                  handleCustomSoundChange(customKey, e.target.files?.[0] ?? null);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            {customValue && (
                              <button type="button" className="settings-sound-reset" onClick={() => setValue(customKey, "")}>
                                {t("settingsSoundReset")}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    {minMagKey && (
                      <div className="settings-field__minmag">
                        <label htmlFor={`setting-${minMagKey}`}>{t("settingsMinMag")}</label>
                        <input
                          id={`setting-${minMagKey}`}
                          type="text"
                          autoComplete="off"
                          inputMode="decimal"
                          value={values[minMagKey] ?? ""}
                          onChange={(e) => setValue(minMagKey, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
              {section.titleKey === "settingsVoice" && (
                <button type="button" className="settings-tts-test" onClick={handleTestTts}>
                  {t("settingsTtsTest")}
                </button>
              )}
            </section>
          ))}
        </div>

        <footer className="settings-modal__footer">
          <span className="settings-modal__note">{t("settingsReloadNote")}</span>
          <button className="save-btn" onClick={handleSave}>{t("save")}</button>
        </footer>
      </div>
    </div>
  );
};
