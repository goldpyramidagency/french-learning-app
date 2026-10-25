import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini Client server-side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI:', err);
  }
}

// API Health / Status
app.get('/api/tutor/status', (_req, res) => {
  res.json({
    hasApiKey: Boolean(apiKey && apiKey.trim().length > 0 && apiKey !== 'MY_GEMINI_API_KEY'),
    model: 'gemini-3.8-flash',
  });
});

// Helper for timeout race
function withTimeout<T>(promise: Promise<T>, ms: number = 6000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI request timeout')), ms)),
  ]);
}

// Explain Grammar in Plain English
app.post('/api/tutor/explain', async (req, res) => {
  const { topic, context, activeVocab } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  if (!ai || !apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.json({
      fallback: true,
      explanation: `**Grammar Note on "${topic}"**:\nIn French, this structure is fundamental for conversational fluency. Pay special attention to agreement (gender & number) and register (tu vs vous). Native speakers often contract expressions in spoken French (e.g. "c'est", "j'ai"). Review your example sentences to see it in action!`,
    });
  }

  try {
    const vocabList = Array.isArray(activeVocab) ? activeVocab.slice(0, 10).join(', ') : '';
    const prompt = `You are a supportive, expert French language tutor for English speakers.
Explain this French grammar concept or expression clearly in plain English: "${topic}".
${context ? `Context or learner question: "${context}"` : ''}
${vocabList ? `Incorporate where appropriate some of these words the learner knows: ${vocabList}` : ''}

Format your response cleanly:
1. Short overview (1-2 sentences).
2. Key rules and patterns with French examples and English translations.
3. Common traps or differences from English (e.g., false friends, contractions, register).
4. One memorable practical tip.
Keep explanations concise, encouraging, and natural.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      }),
      4500
    );

    res.json({
      explanation: response.text || 'No explanation generated.',
      fallback: false,
    });
  } catch (error: any) {
    console.error('Error generating explanation:', error);
    let detailed = `**Grammar Note on "${topic}"**:\nIn French, this structure requires careful attention to gender (masculin/féminin) and number (singulier/pluriel). In everyday French, native speakers prioritize smooth flow, often using natural elisions (j'ai, d'accord) and contracted articles (à + le = au, de + le = du).`;
    if (/passé composé/i.test(topic)) {
      detailed = `### Le Passé Composé (Past Tense)\n\nUsed for completed actions in the past. Built with an auxiliary verb (*avoir* or *être* for movement/reflexive verbs) + the past participle.\n\n• **Avec Avoir** : *J'ai mangé un croissant.* (I ate a croissant)\n• **Avec Être** : *Elle est allée à la gare.* (She went to the station - past participle agrees in gender/number: +e for feminine)\n\n💡 **Astuce pratique :** Most French verbs use *avoir*. Movement verbs and reflexive verbs (*se lever, se coucher*) use *être*.`;
    } else if (/genre|masculin|féminin/i.test(topic)) {
      detailed = `### Le Genre Grammatical (Masculin vs Féminin)\n\nIn French, every noun has a gender: masculine (*un / le*) or feminine (*une / la*). Adjectives must agree in gender and number with the noun they describe (*un grand livre, une grande maison*).\n\n💡 **Astuce pratique :** Words ending in *-tion, -sion, -té, -ette, -ence* are almost always feminine!`;
    } else if (/subjonctif/i.test(topic)) {
      detailed = `### Le Subjonctif Présent\n\nUsed after expressions of necessity, desire, emotion, doubt, or subjective will (*Il faut que, J'aimerais que, Bien que*).\n\n• *Il faut que je parte.* (I have to leave)\n• *J'ai peur qu'il soit en retard.* (I'm afraid he might be late)\n\n💡 **Astuce pratique :** In everyday conversation, focus first on regular subjunctive stems and high-frequency irregulars (*être: sois/soit, avoir: aie/ait, faire: fasse*).`;
    }
    res.json({
      fallback: true,
      explanation: detailed,
    });
  }
});

// Sentence Correction with 5 Structured Fields
app.post('/api/tutor/correct', async (req, res) => {
  const { userResponse, targetWord, expectedContext } = req.body;
  if (!userResponse) {
    return res.status(400).json({ error: 'User response is required' });
  }

  if (!ai || !apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Deterministic fallback correction
    const trimmed = userResponse.trim();
    return res.json({
      fallback: true,
      original: trimmed,
      corrected: trimmed,
      englishTranslation: 'Your sentence was analyzed offline.',
      explanation: 'Offline mode active: To get detailed AI grammar analysis, ensure Gemini API key is configured. Your sentence structure appears complete!',
      additionalExample: targetWord ? `Exemple: J'utilise souvent "${targetWord}" dans mes conversations quotidiennes.` : 'Exemple: C\'est une bonne phrase.',
      isCorrect: true,
    });
  }

  try {
    const prompt = `You are an expert French language tutor. A learner wrote this French sentence:
Original: "${userResponse}"
${targetWord ? `Target French expression to use: "${targetWord}"` : ''}
${expectedContext ? `Intended meaning/context: "${expectedContext}"` : ''}

Evaluate the sentence carefully. IMPORTANT: Do not mark a valid alternative expression wrong simply because it differs from a textbook answer.

Return ONLY a valid JSON object strictly matching this schema:
{
  "original": "${userResponse.replace(/"/g, '\\"')}",
  "corrected": "The most natural, grammatically correct French sentence",
  "englishTranslation": "Accurate English translation of the corrected French sentence",
  "explanation": "Concise explanation of any grammar/vocabulary error, or why the phrasing was improved, or praise if already correct",
  "additionalExample": "One fresh, natural French example sentence using the target word/structure with English translation in parentheses",
  "isCorrect": boolean (true if original was completely correct or had only trivial typo, false if there were noticeable errors)
}`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      4500
    );

    const rawText = response.text || '{}';
    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    res.json({
      ...parsed,
      fallback: false,
    });
  } catch (error: any) {
    console.error('Error in tutor correction:', error);
    // Smart heuristic fallback
    let corrected = userResponse.trim();
    let explanation = 'Sentence reviewed locally. Ensure proper verb agreements and word order.';
    let isCorrect = true;
    if (/je suis faim/i.test(corrected)) {
      corrected = corrected.replace(/je suis faim/gi, "j'ai faim");
      explanation = 'French uses "avoir" (to have), not "être" (to be) for physical states: say "j\'ai faim".';
      isCorrect = false;
    } else if (/je suis peur/i.test(corrected)) {
      corrected = corrected.replace(/je suis peur/gi, "j'ai peur");
      explanation = 'Use "avoir peur" rather than "être peur".';
      isCorrect = false;
    }
    res.json({
      fallback: true,
      original: userResponse,
      corrected,
      englishTranslation: 'Analyzed in fallback mode.',
      explanation,
      additionalExample: targetWord ? `Exemple : ${targetWord} s'utilise fréquemment ainsi.` : 'Exemple : C\'est une phrase naturelle.',
      isCorrect,
    });
  }
});

// Role-play / French Conversation Partner
app.post('/api/tutor/chat', async (req, res) => {
  const { messages, scenario, activeVocab } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  if (!ai || !apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const lastUserMsg = messages[messages.length - 1]?.text || '';
    return res.json({
      fallback: true,
      replyFr: `Très bien ! Tu as dit : "${lastUserMsg}". En français quotidien, on peut aussi dire "C'est super !" Comment se passe ta journée ?`,
      replyEn: `Very good! You said: "${lastUserMsg}". In everyday French, one can also say "That's great!" How is your day going?`,
      feedback: 'Offline mode active. Keep answering in French!',
    });
  }

  try {
    const historyText = messages
      .map((m: any) => `${m.role === 'user' ? 'Learner' : 'Tutor'}: ${m.text}`)
      .join('\n');
    const vocabList = Array.isArray(activeVocab) ? activeVocab.slice(0, 15).join(', ') : '';

    const prompt = `You are a friendly, encouraging native French conversational partner named "Camille".
Scenario: "${scenario || 'Casual conversation in a Paris café'}".
Learner's target: Practice conversational French at an A2/B1 level.
Learner's active vocabulary (try to naturally recycle some when appropriate): ${vocabList}

Conversation so far:
${historyText}

Respond as Camille:
1. Provide a natural, friendly French reply (1-3 sentences max) keeping the conversation going in character.
2. Provide a helpful English translation of your reply.
3. If the learner made a notable French error in their last message, provide a gentle, polite 1-sentence tip; if they did well, give a quick encouraging note.

Return ONLY a valid JSON object matching:
{
  "replyFr": "Your French response",
  "replyEn": "English translation of your reply",
  "feedback": "Encouragement or gentle tip on their French phrasing",
  "suggestedReplies": ["Quick phrase 1 the learner could say back", "Quick phrase 2"]
}`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      4500
    );

    const rawText = response.text || '{}';
    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    res.json({
      ...parsed,
      fallback: false,
    });
  } catch (error: any) {
    console.error('Error in tutor chat:', error);
    res.json({
      fallback: true,
      replyFr: 'Je te comprends tout à fait ! Peux-tu m\'en dire plus ?',
      replyEn: 'I understand you completely! Can you tell me more about that?',
      feedback: 'Conversation continuing in local mode.',
      suggestedReplies: ['Oui, bien sûr !', 'Avec plaisir. Et toi ?'],
    });
  }
});

// Production / Development Vite Integration
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Parler French App server listening on port ${PORT}`);
  });
}

startServer();
