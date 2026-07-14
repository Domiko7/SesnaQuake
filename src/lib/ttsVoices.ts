let browserVoices: SpeechSynthesisVoice[] = speechSynthesis.getVoices();
speechSynthesis.addEventListener("voiceschanged", () => {
  browserVoices = speechSynthesis.getVoices();
});

export const getBrowserVoicesFor = (language: string): SpeechSynthesisVoice[] => {
  const prefix = language.split("-")[0].toLowerCase();
  const normalized = (lang: string) => lang.replace("_", "-").toLowerCase();

  return browserVoices
    .filter(v => normalized(v.lang).startsWith(prefix))
    .sort((a, b) => {
      const exactA = normalized(a.lang) === language.toLowerCase() ? 0 : 1;
      const exactB = normalized(b.lang) === language.toLowerCase() ? 0 : 1;
      return exactA - exactB;
    });
};
