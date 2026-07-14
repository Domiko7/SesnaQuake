import { corsFetch } from "../sources/http";

export interface ElevenLabsCredentials {
  apiKey: string;
  voiceId: string;
}

export const synthesizeElevenLabs = async (text: string, credentials: ElevenLabsCredentials): Promise<Blob> => {
  const res = await corsFetch(`https://api.elevenlabs.io/v1/text-to-speech/${credentials.voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": credentials.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
  });

  if (!res.ok) throw new Error(`ElevenLabs TTS returned ${res.status}`);
  return res.blob();
};
