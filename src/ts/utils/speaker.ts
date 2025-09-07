

export const speak = (speed: number, language: string, text: string): void => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = speed;
  speechSynthesis.speak(utterance);
};

export const playSound = (sound: string): void => {
  const effect = new Audio(`/public/../../${sound}`);
  effect.play()
}