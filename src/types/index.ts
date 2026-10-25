export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'phrase'
  | 'expression'
  | 'conjunction'
  | 'preposition'
  | 'pronoun';

export type GrammaticalGender = 'masculine' | 'feminine' | 'unspecified' | 'both';

export type Register = 'informal' | 'neutral' | 'formal';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2';

export type VocabStatus = 'unintroduced' | 'introduced' | 'learning' | 'mastered' | 'suspended';

export type RecallRating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewRecord {
  id: string;
  date: string; // YYYY-MM-DD
  rating: RecallRating;
  exerciseType: string;
  wasCorrect: boolean;
  intervalDaysAfter: number;
}

export interface VocabItem {
  id: string;
  french: string;
  english: string;
  partOfSpeech: PartOfSpeech;
  gender: GrammaticalGender;
  plural: string | null;
  pronunciation: string; // IPA or phonetic
  exampleFr: string;
  exampleEn: string;
  context: string;
  register: Register;
  collocations: string[];
  difficulty: CEFRLevel;
  category: string;
  literalMeaning?: string;
  culturalNotes?: string;
  status: VocabStatus;
  introducedDate: string | null; // YYYY-MM-DD
  lastReviewedDate: string | null; // YYYY-MM-DD
  nextReviewDate: string | null; // YYYY-MM-DD
  repetitionCount: number;
  intervalDays: number;
  easeFactor: number; // default 2.5
  successfulAttempts: number;
  failedAttempts: number;
  reviewHistory: ReviewRecord[];
  userNotes?: string;
  isStarred?: boolean;
  isCustom?: boolean;
  isStruggling?: boolean;
  flaggedGrammar?: boolean;
}

export interface MistakeEntry {
  id: string;
  vocabId: string;
  french: string;
  english: string;
  userResponse: string;
  correctResponse: string;
  date: string;
  explanation: string;
  repeatedCount: number;
  resolved: boolean;
}

export type SessionStage =
  | 'quick_review'
  | 'new_word'
  | 'comprehension'
  | 'active_recall'
  | 'sentence_production'
  | 'cumulative_practice'
  | 'conversation'
  | 'summary';

export interface DailySessionState {
  date: string;
  completed: boolean;
  stage: SessionStage;
  stageIndex: number;
  newWordIds: string[];
  reviewedWordIds: string[];
  correctCount: number;
  incorrectCount: number;
  startTime: number;
  timeSpentSeconds: number;
}

export interface UserSettings {
  dailyTarget: number; // 1, 2, 3, 5, or custom
  sundayConsolidation: boolean; // default true: consolidation / review only on Sunday
  audioAutoplay: boolean;
  voiceSpeed: number; // 0.8, 1.0, 1.2
  currentSimulatedDate: string; // YYYY-MM-DD
  completedDates: string[];
}

export interface StructuredCorrection {
  original: string;
  corrected: string;
  englishTranslation: string;
  explanation: string;
  additionalExample: string;
  isCorrect: boolean;
  fallback?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'tutor';
  text: string;
  translationEn?: string;
  feedback?: string;
  suggestedReplies?: string[];
  timestamp: string;
}

export interface StudyStats {
  currentStreak: number;
  longestStreak: number;
  totalStudyTimeSeconds: number;
  sessionsCompleted: number;
  totalWordsIntroduced: number;
  recallAccuracy: number;
}
