import { corsFetch } from "../sources/http";

const AZURE_VOICE_BY_LOCALE: Record<string, string> = {
  "en-US": "en-US-JennyNeural",
  "ja-JP": "ja-JP-NanamiNeural",
  "zh-CN": "zh-CN-XiaoxiaoNeural",
  "zh-TW": "zh-TW-HsiaoChenNeural",
  "pl-PL": "pl-PL-ZofiaNeural",
  "es-ES": "es-ES-ElviraNeural",
  "it-IT": "it-IT-ElsaNeural",
  "ko-KR": "ko-KR-SunHiNeural",
};

const escapeXml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export interface AzureCredentials {
  apiKey: string;
  region: string;
}

export const synthesizeAzure = async (text: string, language: string, credentials: AzureCredentials): Promise<Blob> => {
  const voice = AZURE_VOICE_BY_LOCALE[language] ?? AZURE_VOICE_BY_LOCALE["en-US"];
  const ssml = `<speak version='1.0' xml:lang='${language}'><voice xml:lang='${language}' name='${voice}'>${escapeXml(text)}</voice></speak>`;

  const res = await corsFetch(`https://${credentials.region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": credentials.apiKey,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "SesnaQuake",
    },
    body: ssml,
  });

  if (!res.ok) throw new Error(`Azure TTS returned ${res.status}`);
  return res.blob();
};
