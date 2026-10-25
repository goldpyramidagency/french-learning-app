import { StructuredCorrection } from '../types';
import { evaluateSentenceOffline, getFallbackGrammarExplanation } from './fallbackTutor';

export async function checkTutorApiStatus(): Promise<{ hasApiKey: boolean; model: string }> {
  try {
    const res = await fetch('/api/tutor/status');
    if (!res.ok) throw new Error('Status failed');
    return await res.json();
  } catch {
    return { hasApiKey: false, model: 'offline-rule-based' };
  }
}

export async function explainGrammarWithTutor(
  topic: string,
  context?: string,
  activeVocab?: string[]
): Promise<{ explanation: string; fallback: boolean }> {
  try {
    const res = await fetch('/api/tutor/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, context, activeVocab }),
    });
    if (!res.ok) throw new Error('Failed to fetch tutor explanation');
    return await res.json();
  } catch {
    return {
      explanation: getFallbackGrammarExplanation(topic),
      fallback: true,
    };
  }
}

export async function correctSentenceWithTutor(
  userResponse: string,
  targetWord?: string,
  expectedContext?: string
): Promise<StructuredCorrection> {
  try {
    const res = await fetch('/api/tutor/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userResponse, targetWord, expectedContext }),
    });
    if (!res.ok) throw new Error('Correction request failed');
    return await res.json();
  } catch {
    return evaluateSentenceOffline(userResponse, targetWord, expectedContext);
  }
}

export async function chatWithTutor(
  messages: Array<{ role: string; text: string }>,
  scenario: string,
  activeVocab?: string[]
): Promise<{
  replyFr: string;
  replyEn: string;
  feedback?: string;
  suggestedReplies?: string[];
  fallback: boolean;
}> {
  try {
    const res = await fetch('/api/tutor/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, scenario, activeVocab }),
    });
    if (!res.ok) throw new Error('Chat failed');
    return await res.json();
  } catch {
    const lastMsg = messages[messages.length - 1]?.text || '';
    return {
      replyFr: `C'est noté ! "${lastMsg}" est bien formulé. Peux-tu me donner un exemple en situation ?`,
      replyEn: `Understood! "${lastMsg}" is well formulated. Can you give me an example in context?`,
      feedback: 'Offline tutor mode active. Continue speaking in French!',
      suggestedReplies: ['Oui, tout à fait !', 'Par exemple, hier matin...', 'J\'ai une question.'],
      fallback: true,
    };
  }
}
