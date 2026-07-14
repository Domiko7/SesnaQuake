import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import zhCN from "./locales/zh-CN/translations.json";
import plPL from "./locales/pl-PL/translations.json";
import enUS from "./locales/en-US/translations.json";
import jaJP from "./locales/ja-JP/translations.json";
import esES from "./locales/es-ES/translations.json";
import itIT from "./locales/it-IT/translations.json";
import zhTW from "./locales/zh-TW/translations.json";
import koKR from "./locales/ko-KR/translations.json";
import ptBR from "./locales/pt-BR/translations.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      "zh-CN": { translation: zhCN },
      "pl-PL": { translation: plPL },
      "en-US": { translation: enUS },
      "ja-JP": { translation: jaJP },
      "es-ES": { translation: esES },
      "it-IT": { translation: itIT },
      "zh-TW": { translation: zhTW },
      "ko-KR": { translation: koKR },
      "pt-BR": { translation: ptBR },
    },
    lng: "en-US",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
