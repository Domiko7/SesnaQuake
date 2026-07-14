import { corsFetch } from "../sources/http";

export interface OpenAiCredentials {
  apiKey: string;
  voice: string;
}

export const synthesizeOpenAi = async (text: string, credentials: OpenAiCredentials): Promise<Blob> => {
  const res = await corsFetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${credentials.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: credentials.voice,
      input: text,
      response_format: "mp3",
    }),
  });

  if (!res.ok) throw new Error(`OpenAI TTS returned ${res.status}`);
  return res.blob();
};
