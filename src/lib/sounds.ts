import eqSound from "../assets/sounds/eq.mp3";
import updateSound from "../assets/sounds/update.mp3";
import eew2Sound from "../assets/sounds/eew2.mp3";
import eew5Sound from "../assets/sounds/eew5.wav";
import reportSound from "../assets/sounds/report.mp3";
import alertSound from "../assets/sounds/alert.mp3";
import alertStrongSound from "../assets/sounds/alert_strong.mp3";
import alertStrongSoundEs from "../assets/sounds/alert_strong_es.mp3";
import alertStrongSoundJp from "../assets/sounds/alert_strong_jp.mp3";
import alertStrongSoundKr from "../assets/sounds/alert_strong_kr.mp3";
import alertStrongSoundPt from "../assets/sounds/alert_strong_pt.mp3";
import alertStrongSoundZh from "../assets/sounds/alert_strong_zh.mp3";

export { eqSound, updateSound, eew2Sound, eew5Sound, reportSound, alertSound };

const ALERT_STRONG_BY_LOCALE: Record<string, string> = {
  "ja-JP": alertStrongSoundJp,
  "zh-CN": alertStrongSoundZh,
  "zh-TW": alertStrongSoundZh,
  "es-ES": alertStrongSoundEs,
  "ko-KR": alertStrongSoundKr,
  "pt-BR": alertStrongSoundPt,
};

export const resolveAlertStrongSound = (language: string): string => ALERT_STRONG_BY_LOCALE[language] ?? alertStrongSound;
