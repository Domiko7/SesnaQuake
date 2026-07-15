import { getBrowserVoicesFor } from "./ttsVoices";

export interface SettingOption {
  value: string;
  labelKey?: string;
  label?: string;
}

export type SettingValueType = "string" | "number" | "boolean";

export interface SettingField {
  key: string;
  labelKey: string;
  type: "select" | "text";
  valueType?: SettingValueType;
  default: string;
  options?: SettingOption[] | ((values: Record<string, string>) => SettingOption[]);
  refreshOn?: string[];
  inputMode?: string;
  visibleWhen?: (values: Record<string, string>) => boolean;
}

export interface SettingSection {
  titleKey: string;
  fields: SettingField[];
}

export const SETTINGS_SCHEMA: SettingSection[] = [
  {
    titleKey: "settingsGeneral",
    fields: [
      {
        key: "language",
        labelKey: "settingsLanguage",
        type: "select",
        default: "en-US",
        options: [
          { value: "en-US", label: "English" },
          { value: "ja-JP", label: "日本語" },
          { value: "zh-CN", label: "中文" },
          { value: "zh-TW", label: "繁體中文" },
          { value: "pl-PL", label: "Polski" },
          { value: "es-ES", label: "Español" },
          { value: "it-IT", label: "Italiano" },
          { value: "ko-KR", label: "한국어" },
          { value: "pt-BR", label: "Português (Brasil)" }
        ]
      },
      {
        key: "timezone",
        labelKey: "settingsTimezone",
        type: "select",
        default: "system",
        options: [
          { value: "system", labelKey: "settingsTimezoneSystem" },
          { value: "UTC", label: "UTC" },
          { value: "Asia/Tokyo", label: "Tokyo (JST)" },
          { value: "Asia/Seoul", label: "Seoul (KST)" },
          { value: "Asia/Shanghai", label: "Shanghai (CST)" },
          { value: "Asia/Taipei", label: "Taipei" },
          { value: "Pacific/Auckland", label: "Auckland (NZ)" },
          { value: "Europe/London", label: "London" },
          { value: "Europe/Warsaw", label: "Warsaw" },
          { value: "Europe/Madrid", label: "Madrid" },
          { value: "Europe/Rome", label: "Rome" },
          { value: "America/New_York", label: "New York" },
          { value: "America/Los_Angeles", label: "Los Angeles" }
        ]
      },
      {
        key: "mapType",
        labelKey: "settingsMapType",
        type: "select",
        default: "default_no_sattelite",
        options: [
          { value: "default_sattelite", labelKey: "settingsMapSatellite" },
          { value: "default_no_sattelite", labelKey: "settingsMapStandard" }
        ]
      },
      {
        key: "notifications",
        labelKey: "settingsNotifications",
        type: "select",
        valueType: "boolean",
        default: "off",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "autostart",
        labelKey: "settingsAutostart",
        type: "select",
        valueType: "boolean",
        default: "off",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "stnColor",
        labelKey: "settingsStnColor",
        type: "select",
        default: "pga",
        options: [
          { value: "pgv", label: "PGV" },
          { value: "pga", label: "PGA" }
        ]
      },
      {
        key: "stnIntensityIcons",
        labelKey: "settingsStnIntensityIcons",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabledIfAvailable" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "stnSize",
        labelKey: "settingsStnSize",
        type: "select",
        valueType: "number",
        default: "100",
        options: [
          { value: "50", label: "50%" },
          { value: "75", label: "75%" },
          { value: "100", label: "100%" },
          { value: "125", label: "125%" },
          { value: "150", label: "150%" },
          { value: "200", label: "200%" }
        ]
      },
      {
        key: "waveAccuracy",
        labelKey: "settingsWaveAccuracy",
        type: "select",
        default: "accurate",
        options: [
          { value: "accurate", labelKey: "settingsWaveAccuracyAccurate" },
          { value: "estimation", labelKey: "settingsWaveAccuracyEstimation" }
        ]
      },
      {
        key: "uiZoom",
        labelKey: "settingsUiZoom",
        type: "select",
        valueType: "number",
        default: "100",
        options: [
          { value: "40", label: "40%" },
          { value: "50", label: "50%" },
          { value: "60", label: "60%" },
          { value: "75", label: "75%" },
          { value: "90", label: "90%" },
          { value: "100", label: "100%" },
          { value: "110", label: "110%" },
          { value: "125", label: "125%" },
          { value: "150", label: "150%" },
          { value: "175", label: "175%" }
        ]
      }
    ]
  },
  {
    titleKey: "settingsHome",
    fields: [
      { key: "lat", labelKey: "settingsLat", type: "text", valueType: "number", default: "35.6764", inputMode: "decimal" },
      { key: "lon", labelKey: "settingsLon", type: "text", valueType: "number", default: "139.6500", inputMode: "decimal" }
    ]
  },
  {
    titleKey: "settingsAlerts",
    fields: [
      { key: "alertThreshold", labelKey: "settingsAlertThreshold", type: "text", valueType: "number", default: "2", inputMode: "numeric" },
      { key: "alertStrongThreshold", labelKey: "settingsAlertStrongThreshold", type: "text", valueType: "number", default: "4", inputMode: "numeric" },
      {
        key: "alertIntensityType",
        labelKey: "settingsAlertIntensityType",
        type: "select",
        default: "shindo",
        options: [
          { value: "shindo", label: "Shindo (JMA)" },
          { value: "mmi", label: "MMI" },
          { value: "csis", labelKey: "settingsAlertIntensityTypeCsis" },
          { value: "cwasis", labelKey: "settingsAlertIntensityTypeCwasis" }
        ]
      }
    ]
  },
  {
    titleKey: "settingsIntensity",
    fields: [
      {
        key: "forceIntensity",
        labelKey: "settingsForceIntensity",
        type: "select",
        default: "off",
        options: [
          { value: "off", labelKey: "settingsForceIntensityOff" },
          { value: "shindo", label: "Shindo (JMA)" },
          { value: "mmi", label: "MMI" },
          { value: "csis", labelKey: "settingsAlertIntensityTypeCsis" },
          { value: "cwasis", labelKey: "settingsAlertIntensityTypeCwasis" },
          { value: "geonet_mmi", labelKey: "settingsForceIntensityGeonetMmi" }
        ]
      }
    ]
  },
  {
    titleKey: "settingsSounds",
    fields: [
      {
        key: "soundEqEnabled",
        labelKey: "settingsSoundEq",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "soundUpdateEnabled",
        labelKey: "settingsSoundUpdate",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "soundEew2Enabled",
        labelKey: "settingsSoundEew2",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "soundEew5Enabled",
        labelKey: "settingsSoundEew5",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "soundReportEnabled",
        labelKey: "settingsSoundReport",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "soundAlertEnabled",
        labelKey: "settingsSoundAlert",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "soundAlertStrongEnabled",
        labelKey: "settingsSoundAlertStrong",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      }
    ]
  },
  {
    titleKey: "settingsVoice",
    fields: [
      {
        key: "ttsEnabled",
        labelKey: "settingsTtsEnabled",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "ttsEngine",
        labelKey: "settingsTtsEngine",
        type: "select",
        default: "browser",
        options: [
          { value: "browser", labelKey: "settingsTtsBrowser" },
          { value: "azure", labelKey: "settingsTtsAzure" },
          { value: "elevenlabs", labelKey: "settingsTtsElevenlabs" },
          { value: "openai", labelKey: "settingsTtsOpenai" }
        ]
      },
      {
        key: "ttsVoice",
        labelKey: "settingsTtsVoice",
        type: "select",
        default: "",
        refreshOn: ["language"],
        visibleWhen: values => (values.ttsEngine ?? "browser") === "browser",
        options: values => {
          const voices = getBrowserVoicesFor(values.language).map(v => ({ value: v.name, label: v.name }));
          return [{ value: "", labelKey: "settingsTtsDefault" }, ...voices];
        }
      },
      {
        key: "azureApiKey",
        labelKey: "settingsAzureApiKey",
        type: "text",
        default: "",
        visibleWhen: values => values.ttsEngine === "azure"
      },
      {
        key: "azureRegion",
        labelKey: "settingsAzureRegion",
        type: "select",
        default: "eastus",
        visibleWhen: values => values.ttsEngine === "azure",
        options: [
          { value: "eastus", label: "East US" },
          { value: "westus2", label: "West US 2" },
          { value: "centralus", label: "Central US" },
          { value: "westeurope", label: "West Europe" },
          { value: "northeurope", label: "North Europe" },
          { value: "uksouth", label: "UK South" },
          { value: "japaneast", label: "Japan East" },
          { value: "koreacentral", label: "Korea Central" },
          { value: "eastasia", label: "East Asia" },
          { value: "southeastasia", label: "Southeast Asia" },
          { value: "australiaeast", label: "Australia East" }
        ]
      },
      {
        key: "elevenlabsApiKey",
        labelKey: "settingsElevenlabsApiKey",
        type: "text",
        default: "",
        visibleWhen: values => values.ttsEngine === "elevenlabs"
      },
      {
        key: "elevenlabsVoiceId",
        labelKey: "settingsElevenlabsVoiceId",
        type: "text",
        default: "",
        visibleWhen: values => values.ttsEngine === "elevenlabs"
      },
      {
        key: "openaiApiKey",
        labelKey: "settingsOpenaiApiKey",
        type: "text",
        default: "",
        visibleWhen: values => values.ttsEngine === "openai"
      },
      {
        key: "openaiVoice",
        labelKey: "settingsOpenaiVoice",
        type: "select",
        default: "alloy",
        visibleWhen: values => values.ttsEngine === "openai",
        options: [
          { value: "alloy", label: "Alloy" },
          { value: "ash", label: "Ash" },
          { value: "ballad", label: "Ballad" },
          { value: "coral", label: "Coral" },
          { value: "echo", label: "Echo" },
          { value: "fable", label: "Fable" },
          { value: "onyx", label: "Onyx" },
          { value: "nova", label: "Nova" },
          { value: "sage", label: "Sage" },
          { value: "shimmer", label: "Shimmer" },
          { value: "verse", label: "Verse" }
        ]
      }
    ]
  },
  {
    titleKey: "settingsSources",
    fields: [
      {
        key: "sourceWolfxJma",
        labelKey: "settingsSourceWolfxJma",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceWolfxSc",
        labelKey: "settingsSourceWolfxSc",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceWolfxCenc",
        labelKey: "settingsSourceWolfxCenc",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceWolfxFj",
        labelKey: "settingsSourceWolfxFj",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceWolfxCq",
        labelKey: "settingsSourceWolfxCq",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceKmaEew",
        labelKey: "settingsSourceKmaEew",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceShakealert",
        labelKey: "settingsSourceShakealert",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceExptechCwa",
        labelKey: "settingsSourceExptechCwa",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceExptechNied",
        labelKey: "settingsSourceExptechNied",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceCwaReport",
        labelKey: "settingsSourceCwaReport",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceKmaReport",
        labelKey: "settingsSourceKmaReport",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceCenc",
        labelKey: "settingsSourceCenc",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceJma",
        labelKey: "settingsSourceJma",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceEmsc",
        labelKey: "settingsSourceEmsc",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceUsgs",
        labelKey: "settingsSourceUsgs",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceBcsf",
        labelKey: "settingsSourceBcsf",
        type: "select",
        valueType: "boolean",
        default: "off",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceHko",
        labelKey: "settingsSourceHko",
        type: "select",
        valueType: "boolean",
        default: "off",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceGfz",
        labelKey: "settingsSourceGfz",
        type: "select",
        valueType: "boolean",
        default: "off",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceUsp",
        labelKey: "settingsSourceUsp",
        type: "select",
        valueType: "boolean",
        default: "off",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceFssn",
        labelKey: "settingsSourceFssn",
        type: "select",
        valueType: "boolean",
        default: "off",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceNingxia",
        labelKey: "settingsSourceNingxia",
        type: "select",
        valueType: "boolean",
        default: "off",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceGuangxi",
        labelKey: "settingsSourceGuangxi",
        type: "select",
        valueType: "boolean",
        default: "off",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceShanxi",
        labelKey: "settingsSourceShanxi",
        type: "select",
        valueType: "boolean",
        default: "off",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceBeijing",
        labelKey: "settingsSourceBeijing",
        type: "select",
        valueType: "boolean",
        default: "off",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceYunnan",
        labelKey: "settingsSourceYunnan",
        type: "select",
        valueType: "boolean",
        default: "off",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceGeonet",
        labelKey: "settingsSourceGeonet",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceGeonetFeltReports",
        labelKey: "settingsSourceGeonetFeltReports",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceBreq",
        labelKey: "settingsSourceBreq",
        type: "select",
        valueType: "boolean",
        default: "off",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceKmoni",
        labelKey: "settingsSourceKmoni",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourceExptechStn",
        labelKey: "settingsSourceExptechStn",
        type: "select",
        valueType: "boolean",
        default: "on",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      },
      {
        key: "sourcePalert",
        labelKey: "settingsSourcePalert",
        type: "select",
        valueType: "boolean",
        default: "off",
        options: [
          { value: "on", labelKey: "settingsEnabled" },
          { value: "off", labelKey: "settingsDisabled" }
        ]
      }
    ]
  }
];

const allFields: SettingField[] = SETTINGS_SCHEMA.flatMap(section => section.fields);

export interface AppSettings {
  language: string;
  timezone: string;
  mapType: "default_sattelite" | "default_no_sattelite";
  notifications: boolean;
  autostart: boolean;
  stnColor: "pga" | "pgv";
  stnIntensityIcons: boolean;
  stnSize: number;
  waveAccuracy: "accurate" | "estimation";
  uiZoom: number;
  lat: number;
  lon: number;
  alertThreshold: number;
  alertStrongThreshold: number;
  alertIntensityType: "shindo" | "mmi" | "csis" | "cwasis";
  forceIntensity: "off" | "shindo" | "mmi" | "csis" | "cwasis" | "geonet_mmi";
  soundEqEnabled: boolean;
  soundUpdateEnabled: boolean;
  soundEew2Enabled: boolean;
  soundEew5Enabled: boolean;
  soundReportEnabled: boolean;
  soundAlertEnabled: boolean;
  soundAlertStrongEnabled: boolean;
  ttsEnabled: boolean;
  ttsEngine: "browser" | "azure" | "elevenlabs" | "openai";
  ttsVoice: string;
  azureApiKey: string;
  azureRegion: string;
  elevenlabsApiKey: string;
  elevenlabsVoiceId: string;
  openaiApiKey: string;
  openaiVoice: string;
  sourceWolfxJma: boolean;
  sourceWolfxSc: boolean;
  sourceWolfxCenc: boolean;
  sourceWolfxFj: boolean;
  sourceWolfxCq: boolean;
  sourceKmaEew: boolean;
  sourceExptechCwa: boolean;
  sourceExptechNied: boolean;
  sourceCwaReport: boolean;
  sourceKmaReport: boolean;
  sourceCenc: boolean;
  sourceJma: boolean;
  sourceEmsc: boolean;
  sourceUsgs: boolean;
  sourceBcsf: boolean;
  sourceHko: boolean;
  sourceGfz: boolean;
  sourceUsp: boolean;
  sourceFssn: boolean;
  sourceNingxia: boolean;
  sourceGuangxi: boolean;
  sourceShanxi: boolean;
  sourceBeijing: boolean;
  sourceYunnan: boolean;
  sourceGeonet: boolean;
  sourceGeonetFeltReports: boolean;
  sourceBreq: boolean;
  sourceKmoni: boolean;
  sourceExptechStn: boolean;
  sourcePalert: boolean;
  sourceShakealert: boolean;
}

export const parseSettings = (raw: Record<string, string>): AppSettings => {
  const result: Record<string, unknown> = {};
  for (const field of allFields) {
    const rawValue = raw[field.key] ?? field.default;
    if (field.valueType === "boolean") {
      result[field.key] = rawValue === "on";
    } else if (field.valueType === "number") {
      const parsed = Number(rawValue);
      result[field.key] = Number.isFinite(parsed) ? parsed : Number(field.default);
    } else {
      result[field.key] = rawValue;
    }
  }
  return result as unknown as AppSettings;
};
export const formatSettings = (settings: AppSettings): Record<string, string> => {
  const source = settings as unknown as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const field of allFields) {
    const value = source[field.key];
    result[field.key] = field.valueType === "boolean" ? (value ? "on" : "off") : String(value);
  }
  return result;
};

export const DEFAULT_SETTINGS: AppSettings = parseSettings({});
