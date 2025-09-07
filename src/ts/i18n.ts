import i18n from "i18next";

import zhCN from "../locales/zh-CN/translations.json";
import plPL from "../locales/pl-PL/translations.json";
import enUS from "../locales/en-US/translations.json";
import jaJP from "../locales/ja-JP/translations.json";
import i18next from "i18next";


let language = "ja-JP";

i18n.init({
  resources: {
    "zh-CN": { translation: zhCN },
    "pl-PL": { translation: plPL },
    "en-US": { translation: enUS },
    "ja-JP": { translation: jaJP },
  },
  lng: language,
  fallbackLng: "en"
});

export function getLanguage() {
  return language;
}

export function setLanguage(lng: string) {
  language = lng;
  i18n.changeLanguage(lng);
}

export function translatePage() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = i18next.t(key);
  });
}

export default i18n;