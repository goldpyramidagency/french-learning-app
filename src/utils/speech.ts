/**
 * Web Speech API text-to-speech utility for French (fr-FR)
 */

let cachedFrenchVoice: SpeechSynthesisVoice | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([]);
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

export async function getFrenchVoice(): Promise<SpeechSynthesisVoice | null> {
  if (cachedFrenchVoice) return cachedFrenchVoice;
  const voices = await loadVoices();
  
  // Prefer high quality French voices: French (France), Thomas, Amélie, Hortense, Google français
  const frenchVoices = voices.filter((v) => v.lang.startsWith('fr'));
  const preferred = frenchVoices.find(
    (v) =>
      v.name.includes('Thomas') ||
      v.name.includes('Amélie') ||
      v.name.includes('Hortense') ||
      v.name.includes('Google français') ||
      v.lang === 'fr-FR'
  );

  cachedFrenchVoice = preferred || frenchVoices[0] || null;
  return cachedFrenchVoice;
}

export async function speakFrench(text: string, rate: number = 0.9): Promise<void> {
  if (!('speechSynthesis' in window) || !text) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const voice = await getFrenchVoice();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = rate; // slightly slower for language learners
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}

export function stopSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
