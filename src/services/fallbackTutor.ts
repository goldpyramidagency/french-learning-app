import { StructuredCorrection } from '../types';

/**
 * Intelligent deterministic fallback engine for the French AI Tutor
 * Ensures the app functions completely when offline or without Gemini API key.
 */

interface GrammarEntry {
  title: string;
  explanation: string;
  examples: { fr: string; en: string }[];
  proTip: string;
}

export const FALLBACK_GRAMMAR_TOPICS: Record<string, GrammarEntry> = {
  gender: {
    title: 'Le genre grammatical (Masculin vs Féminin)',
    explanation:
      'In French, every noun has a gender: masculine (un / le) or feminine (une / la). Adjectives must agree in gender and number with the noun they describe (e.g. un grand livre, une grande maison).',
    examples: [
      { fr: 'Le café chaud / La boisson chaude', en: 'The hot coffee (masc) / The hot drink (fem)' },
      { fr: 'Il est enchanté / Elle est enchantée', en: 'He is delighted / She is delighted' },
    ],
    proTip: 'Words ending in -tion, -sion, -té, -ette, and -ence are almost always feminine.',
  },
  passé_composé: {
    title: 'Le Passé Composé (Past Tense)',
    explanation:
      'Used for completed actions in the past. Built with an auxiliary verb ("avoir" or "être" for movement/reflexive verbs) + the past participle (e.g., mangé, fini, vendu).',
    examples: [
      { fr: 'J\'ai commandé un croissant.', en: 'I ordered a croissant. (Auxiliary avoir)' },
      { fr: 'Elle est allée à la gare.', en: 'She went to the train station. (Auxiliary être)' },
    ],
    proTip: 'Remember the acronym DR & MRS VANDERTRAMP for verbs conjugated with être in the past.',
  },
  negation: {
    title: 'La Négation (ne ... pas)',
    explanation:
      'Standard French wraps the conjugated verb between "ne" (or n\' before a vowel) and "pas". In casual spoken French, native speakers very frequently drop the "ne" completely!',
    examples: [
      { fr: 'Je ne sais pas.', en: 'I don\'t know. (Formal / written)' },
      { fr: 'J\'sais pas !', en: 'I don\'t know! (Everyday spoken French)' },
    ],
    proTip: 'When practicing for daily life, be comfortable hearing both versions.',
  },
  tu_vs_vous: {
    title: 'Le Vouvoiement et le Tutoiement (Tu vs Vous)',
    explanation:
      '"Tu" is used with family, friends, children, and close peers. "Vous" is the polite formal form for strangers, service staff, elders, and professionals, as well as the plural "you".',
    examples: [
      { fr: 'Comment vas-tu ?', en: 'How are you? (Informal friend)' },
      { fr: 'Comment allez-vous, madame ?', en: 'How are you, madam? (Formal)' },
    ],
    proTip: 'When in doubt in shops or restaurants, always start with "Vous" until invited to use "Tu".',
  },
  contractions: {
    title: 'Les Contractions et Liaisons',
    explanation:
      'In French, vowels clash is avoided through elision (e.g., je + ai = j\'ai, de + accord = d\'accord) and mandatory contractions like à + le = au, de + le = du.',
    examples: [
      { fr: 'Je vais au marché (à + le).', en: 'I am going to the market.' },
      { fr: 'Il revient du bureau (de + le).', en: 'He returns from the office.' },
    ],
    proTip: 'Never say "à le" or "de le" — always contract to "au" and "du"!',
  },
};

export function getFallbackGrammarExplanation(topic: string): string {
  const normalized = topic.toLowerCase();
  for (const [key, entry] of Object.entries(FALLBACK_GRAMMAR_TOPICS)) {
    if (normalized.includes(key) || topic.toLowerCase().includes(entry.title.toLowerCase())) {
      return `### ${entry.title}\n\n${entry.explanation}\n\n**Exemples clairs :**\n${entry.examples
        .map((e) => `• *${e.fr}* — ${e.en}`)
        .join('\n')}\n\n💡 **Astuce pratique :** ${entry.proTip}`;
    }
  }

  return `### Grammaire : ${topic}\n\nIn French, this structure is key for practical everyday communication. Remember that French sentences value rhythm, smooth vowel flow (liaisons/elisions like *j'ai*, *d'accord*), and strict agreement in gender (masculine/feminine) and number (singular/plural).\n\n💡 **Astuce pratique :** Notice how native speakers use this phrase in context rather than translating word-for-word from English!`;
}

/**
 * Deterministic sentence correction analyzer
 */
export function evaluateSentenceOffline(
  userText: string,
  targetWord?: string,
  expectedContext?: string
): StructuredCorrection {
  const trimmed = userText.trim();
  const lower = trimmed.toLowerCase();

  // Check if user text is empty or very short
  if (!trimmed) {
    return {
      original: userText,
      corrected: targetWord || 'Bonjour !',
      englishTranslation: 'Please write a complete French sentence.',
      explanation: 'No response was provided. Try writing a sentence using the target vocabulary.',
      additionalExample: targetWord ? `Exemple : J'ai hâte d'utiliser "${targetWord}".` : 'Exemple : Je parle français.',
      isCorrect: false,
      fallback: true,
    };
  }

  // Common learner pitfalls check
  const corrections: string[] = [];
  let correctedSentence = trimmed;

  // "je suis faim" -> "j'ai faim"
  if (lower.includes('je suis faim')) {
    correctedSentence = correctedSentence.replace(/je suis faim/gi, "j'ai faim");
    corrections.push('French expresses physical states like hunger with "avoir" (to have), not "être" (to be): say "j\'ai faim".');
  }

  // "je suis raison" -> "j'ai raison"
  if (lower.includes('je suis raison')) {
    correctedSentence = correctedSentence.replace(/je suis raison/gi, "j'ai raison");
    corrections.push('Say "j\'ai raison" (I have reason) rather than "je suis raison".');
  }

  // "je suis peur" -> "j'ai peur"
  if (lower.includes('je suis peur')) {
    correctedSentence = correctedSentence.replace(/je suis peur/gi, "j'ai peur");
    corrections.push('Use "avoir" for fear: "j\'ai peur" instead of "je suis peur".');
  }

  // "à le" -> "au"
  if (/\bà le\b/i.test(correctedSentence)) {
    correctedSentence = correctedSentence.replace(/\bà le\b/gi, 'au');
    corrections.push('In French, "à + le" must contract into "au".');
  }

  // "de le" -> "du"
  if (/\bde le\b/i.test(correctedSentence)) {
    correctedSentence = correctedSentence.replace(/\bde le\b/gi, 'du');
    corrections.push('In French, "de + le" must contract into "du".');
  }

  // Missing capital letter at start
  if (correctedSentence.length > 0 && correctedSentence[0] === correctedSentence[0].toLowerCase()) {
    correctedSentence = correctedSentence[0].toUpperCase() + correctedSentence.slice(1);
  }

  // Missing ending punctuation
  if (!/[.!?]$/.test(correctedSentence)) {
    correctedSentence += '.';
  }

  const isFlawless = corrections.length === 0;

  return {
    original: trimmed,
    corrected: correctedSentence,
    englishTranslation: `Translation: "${correctedSentence}" (interpreted in context)`,
    explanation: isFlawless
      ? targetWord && !lower.includes(targetWord.toLowerCase())
        ? `Great French sentence! Remember to integrate the target expression "${targetWord}" when completing this exercise.`
        : 'Excellent travail ! Your sentence is grammatically sound, natural, and well-structured.'
      : corrections.join(' '),
    additionalExample: targetWord
      ? `Exemple modèle : ${targetWord} permet d'exprimer cela très naturellement.`
      : 'Exemple modèle : Nous aimons pratiquer le français chaque matin.',
    isCorrect: isFlawless,
    fallback: true,
  };
}

/**
 * Conversational responses for French roleplay scenarios
 */
export const CONVERSATION_SCENARIOS = [
  {
    id: 'cafe',
    title: 'Au café parisien',
    description: 'Commander un café et des viennoiseries en terrasse avec le serveur.',
    initialMessage: 'Bonjour ! Bienvenue au Café de Flore. Vous êtes combien ? Que puis-je vous servir aujourd\'hui ?',
    initialTranslation: 'Hello! Welcome to Café de Flore. How many are you? What can I serve you today?',
  },
  {
    id: 'marche',
    title: 'Au marché aux fruits et légumes',
    description: 'Acheter des produits frais auprès du maraîcher.',
    initialMessage: 'Bonjour madame, bonjour monsieur ! Regardez mes belles fraises de Carpentras. Qu\'est-ce qui vous ferait plaisir ?',
    initialTranslation: 'Hello! Look at my beautiful Carpentras strawberries. What would you like today?',
  },
  {
    id: 'gare',
    title: 'À la gare SNCF',
    description: 'Demander des renseignements pour un train pour Lyon ou Marseille.',
    initialMessage: 'Bonjour. Vous souhaitez partir pour quelle destination et à quelle date ?',
    initialTranslation: 'Hello. Which destination and date would you like to depart for?',
  },
  {
    id: 'amis',
    title: 'Retrouvailles entre amis',
    description: 'Discuter avec Camille de vos projets de week-end.',
    initialMessage: 'Salut ! Ça fait tellement plaisir de te voir ! Tu as prévu quoi de beau ce week-end ?',
    initialTranslation: 'Hi! So good to see you! What nice things do you have planned for this weekend?',
  },
];
