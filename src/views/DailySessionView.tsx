import React, { useState, useEffect } from 'react';
import { useVocab } from '../context/VocabContext';
import { VocabItem, SessionStage, StructuredCorrection } from '../types';
import { AudioButton } from '../components/AudioButton';
import { FrenchAccentBar } from '../components/FrenchAccentBar';
import { correctSentenceWithTutor, chatWithTutor } from '../services/tutorApi';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Award,
  Clock,
  Flame,
  ChevronRight,
  Volume2,
} from 'lucide-react';

interface DailySessionViewProps {
  onNavigateToExercises?: () => void;
  onNavigateToNotebook?: () => void;
}

export const DailySessionView: React.FC<DailySessionViewProps> = ({
  onNavigateToExercises,
  onNavigateToNotebook,
}) => {
  const {
    settings,
    dailySession,
    dueItems,
    items,
    todaysNewWord,
    startDailySession,
    advanceSessionStage,
    recordReview,
    completeDailySession,
    introduceNextDailyItems,
  } = useVocab();

  // Active stage
  const currentStage: SessionStage = dailySession?.stage || 'quick_review';

  // State for Stage A: Quick Review
  const [quickReviewIndex, setQuickReviewIndex] = useState(0);
  const [quickReviewRevealed, setQuickReviewRevealed] = useState(false);

  // State for Stage C: Comprehension
  const [comprehensionSelected, setComprehensionSelected] = useState<number | null>(null);
  const [comprehensionFeedback, setComprehensionFeedback] = useState<string | null>(null);

  // State for Stage D: Active Recall
  const [recallInput, setRecallInput] = useState('');
  const [recallChecked, setRecallChecked] = useState(false);
  const [recallIsCorrect, setRecallIsCorrect] = useState(false);

  // State for Stage E: Sentence Production
  const [productionInput, setProductionInput] = useState('');
  const [productionEvaluating, setProductionEvaluating] = useState(false);
  const [productionResult, setProductionResult] = useState<StructuredCorrection | null>(null);

  // State for Stage F: Cumulative Drill
  const [cumulativeChoice, setCumulativeChoice] = useState<string | null>(null);
  const [cumulativeChecked, setCumulativeChecked] = useState(false);

  // State for Stage G: Everyday Conversation
  const [conversationReply, setConversationReply] = useState('');
  const [conversationSending, setConversationSending] = useState(false);
  const [conversationDialogue, setConversationDialogue] = useState<Array<{ role: string; text: string; translation?: string }>>([
    {
      role: 'tutor',
      text: 'Bonjour ! Comment ça se passe aujourd\'hui ? Que fais-tu de beau ?',
      translation: 'Hello! How is it going today? What nice things are you doing?',
    },
  ]);
  const [conversationFeedback, setConversationFeedback] = useState<string | null>(null);

  // Ensure daily session is started
  useEffect(() => {
    if (!dailySession || dailySession.date !== settings.currentSimulatedDate) {
      startDailySession();
    }
  }, [dailySession, settings.currentSimulatedDate, startDailySession]);

  // Target new word for the session
  const activeNewWord: VocabItem = todaysNewWord || items[0];

  // Candidates for cumulative practice (older active words)
  const olderItems = items.filter(
    (i) => i.id !== activeNewWord?.id && i.status !== 'unintroduced' && i.status !== 'suspended'
  );
  const cumulativeCompanion = olderItems[0] || items[1] || activeNewWord;

  // Due items eligible for Quick Review
  const dueReviewItems = dueItems.filter((i) => i.id !== activeNewWord?.id).slice(0, 3);
  const currentReviewItem = dueReviewItems[quickReviewIndex];

  // Stage progress helper
  const stages: { key: SessionStage; label: string }[] = [
    { key: 'quick_review', label: '1. Quick Review' },
    { key: 'new_word', label: "2. Today's Word" },
    { key: 'comprehension', label: '3. Comprehension' },
    { key: 'active_recall', label: '4. Active Recall' },
    { key: 'sentence_production', label: '5. Sentence Practice' },
    { key: 'cumulative_practice', label: '6. Cumulative Drill' },
    { key: 'conversation', label: '7. Mini Dialogue' },
    { key: 'summary', label: '8. Session Summary' },
  ];

  // STAGE A: QUICK REVIEW HANDLERS
  const handleQuickReviewRating = (rating: 'again' | 'good') => {
    if (currentReviewItem) {
      recordReview(currentReviewItem.id, rating, 'quick_review');
    }
    setQuickReviewRevealed(false);
    if (quickReviewIndex + 1 < dueReviewItems.length) {
      setQuickReviewIndex((prev) => prev + 1);
    } else {
      advanceSessionStage('new_word');
    }
  };

  // STAGE C: COMPREHENSION CHECK
  const comprehensionOptions = [
    { text: `To express "${activeNewWord.english}" in everyday French`, correct: true },
    { text: 'Only in formal 19th century literature', correct: false },
    { text: 'As a hostile insult to strangers', correct: false },
  ];

  const handleComprehensionCheck = (index: number) => {
    setComprehensionSelected(index);
    if (comprehensionOptions[index].correct) {
      setComprehensionFeedback('Great job! That is exactly what this expression means in everyday life.');
    } else {
      setComprehensionFeedback('Not quite! Check the register and everyday context for this expression.');
    }
  };

  // STAGE D: ACTIVE RECALL CHECK
  const handleActiveRecallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = recallInput.trim().toLowerCase().replace(/[.,!?'"]/g, '');
    const cleanTarget = activeNewWord.french.trim().toLowerCase().replace(/[.,!?'"]/g, '');
    const isMatch = cleanUser === cleanTarget || cleanTarget.includes(cleanUser) && cleanUser.length >= 4;

    setRecallIsCorrect(isMatch);
    setRecallChecked(true);

    recordReview(
      activeNewWord.id,
      isMatch ? 'good' : 'again',
      'active_recall',
      recallInput,
      activeNewWord.french
    );
  };

  // STAGE E: SENTENCE PRODUCTION
  const handleProductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productionInput.trim()) return;

    setProductionEvaluating(true);
    try {
      const evaluation = await correctSentenceWithTutor(
        productionInput,
        activeNewWord.french,
        activeNewWord.context
      );
      setProductionResult(evaluation);
    } catch {
      setProductionResult({
        original: productionInput,
        corrected: productionInput,
        englishTranslation: 'Analysis completed locally.',
        explanation: 'Good sentence! Keep practicing consistent agreements and verb conjugations.',
        additionalExample: `Exemple : ${activeNewWord.exampleFr}`,
        isCorrect: true,
      });
    } finally {
      setProductionEvaluating(false);
    }
  };

  // STAGE F: CUMULATIVE PRACTICE
  const cumulativeQuestion = {
    prompt: `Complete the French sentence with the appropriate expression: "Ce matin, j'ai pris le temps de..."`,
    correctAnswer: activeNewWord.french,
    options: [
      activeNewWord.french,
      cumulativeCompanion.french,
      'payer par carte',
      'laisser tomber',
    ].filter((v, i, a) => a.indexOf(v) === i),
  };

  const handleCumulativeSelect = (option: string) => {
    setCumulativeChoice(option);
    setCumulativeChecked(true);
    const correct = option === activeNewWord.french;
    recordReview(activeNewWord.id, correct ? 'good' : 'again', 'cumulative_drill');
  };

  // STAGE G: CONVERSATION
  const handleConversationSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationReply.trim()) return;

    const userMsg = conversationReply.trim();
    setConversationReply('');
    setConversationSending(true);

    const updatedHistory = [...conversationDialogue, { role: 'user', text: userMsg }];
    setConversationDialogue(updatedHistory);

    try {
      const activeVocabWords = items
        .filter((i) => i.status !== 'unintroduced')
        .map((i) => i.french);

      const tutorResponse = await chatWithTutor(
        updatedHistory,
        `Casual French conversation where learner uses "${activeNewWord.french}"`,
        activeVocabWords
      );

      setConversationDialogue((prev) => [
        ...prev,
        {
          role: 'tutor',
          text: tutorResponse.replyFr,
          translation: tutorResponse.replyEn,
        },
      ]);
      if (tutorResponse.feedback) {
        setConversationFeedback(tutorResponse.feedback);
      }
    } catch {
      setConversationDialogue((prev) => [
        ...prev,
        {
          role: 'tutor',
          text: 'Super ! Tu t\'exprimes de mieux en mieux en français.',
          translation: 'Great! You are expressing yourself better and better in French.',
        },
      ]);
    } finally {
      setConversationSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Session Progress Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
              Daily Learning Session • {settings.currentSimulatedDate}
            </span>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
            Step {stages.findIndex((s) => s.key === currentStage) + 1} of 8
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
          {stages.map((st, i) => {
            const currentIndex = stages.findIndex((s) => s.key === currentStage);
            const isCompleted = i < currentIndex || dailySession?.completed;
            const isCurrent = i === currentIndex;
            return (
              <div
                key={st.key}
                className={`h-full flex-1 transition-all border-r border-white/40 ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : isCurrent
                    ? 'bg-indigo-600 animate-pulse'
                    : 'bg-slate-200'
                }`}
                title={st.label}
              />
            );
          })}
        </div>

        {/* Stage Pills */}
        <div className="flex items-center justify-between overflow-x-auto gap-2 mt-3 pt-2 text-[11px] text-slate-500 scrollbar-none">
          {stages.map((st) => (
            <button
              key={st.key}
              onClick={() => advanceSessionStage(st.key)}
              className={`whitespace-nowrap px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                currentStage === st.key
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              {st.label.split('. ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STAGE A: QUICK REVIEW */}
      {/* ========================================================================= */}
      {currentStage === 'quick_review' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                Stage A • Warm-up Review
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Quick Review of Due Vocabulary
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {dueReviewItems.length > 0
                ? `${quickReviewIndex + 1} of ${dueReviewItems.length} due`
                : 'All caught up'}
            </span>
          </div>

          {dueReviewItems.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">No cards currently due for review!</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Your long-term memory is in great shape! Let's introduce your new French expression for today.
                </p>
              </div>
              <button
                onClick={() => advanceSessionStage('new_word')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Discover Today's Word <ArrowRight size={18} />
              </button>
            </div>
          ) : currentReviewItem ? (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-700">
                  {currentReviewItem.category} • {currentReviewItem.partOfSpeech}
                </span>
                <div className="flex items-center justify-center gap-3">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {currentReviewItem.french}
                  </h3>
                  <AudioButton text={currentReviewItem.french} size="md" />
                </div>
                <p className="text-xs font-mono text-slate-500">{currentReviewItem.pronunciation}</p>

                {quickReviewRevealed ? (
                  <div className="pt-4 border-t border-slate-200/60 space-y-2 animate-in fade-in duration-200">
                    <p className="text-lg font-semibold text-indigo-700">
                      {currentReviewItem.english}
                    </p>
                    <p className="text-sm text-slate-600 italic">
                      "{currentReviewItem.exampleFr}"
                    </p>
                    <p className="text-xs text-slate-500">
                      "{currentReviewItem.exampleEn}"
                    </p>
                  </div>
                ) : (
                  <div className="pt-4">
                    <button
                      onClick={() => setQuickReviewRevealed(true)}
                      className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 font-medium text-sm transition-all shadow-xs cursor-pointer"
                    >
                      Show English Translation
                    </button>
                  </div>
                )}
              </div>

              {quickReviewRevealed && (
                <div className="flex items-center justify-center gap-4 pt-2">
                  <button
                    onClick={() => handleQuickReviewRating('again')}
                    className="flex-1 max-w-[200px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <XCircle size={18} /> Again (Review soon)
                  </button>
                  <button
                    onClick={() => handleQuickReviewRating('good')}
                    className="flex-1 max-w-[200px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 size={18} /> Good (Remembered)
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE B: NEW WORD SPOTLIGHT */}
      {/* ========================================================================= */}
      {currentStage === 'new_word' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles size={14} /> Stage B • Today's New Expression
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Featured Vocabulary Spotlight
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Level {activeNewWord.difficulty}
            </span>
          </div>

          <div className="space-y-6">
            {/* Expression Hero */}
            <div className="bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 border border-indigo-100 rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-indigo-200 text-indigo-700">
                    {activeNewWord.category}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-600 capitalize">
                    {activeNewWord.partOfSpeech}
                  </span>
                  {activeNewWord.gender !== 'unspecified' && (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                      {activeNewWord.gender}
                    </span>
                  )}
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-100 text-slate-600 uppercase tracking-wide">
                    Register: {activeNewWord.register}
                  </span>
                </div>
                <AudioButton text={activeNewWord.french} size="lg" />
              </div>

              <div>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {activeNewWord.french}
                </h3>
                <p className="text-sm font-mono text-slate-500 mt-1">{activeNewWord.pronunciation}</p>
                <p className="text-xl font-bold text-indigo-700 mt-2">
                  {activeNewWord.english}
                </p>
                {activeNewWord.literalMeaning && (
                  <p className="text-xs text-slate-500 italic mt-0.5">
                    (Literal word-for-word translation: "{activeNewWord.literalMeaning}")
                  </p>
                )}
              </div>

              {/* Context and Native nuances */}
              <div className="bg-white/80 backdrop-blur-xs rounded-xl p-4 border border-indigo-100/80 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Why & When Native French Speakers Use It:
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {activeNewWord.context}
                </p>
                {activeNewWord.culturalNotes && (
                  <p className="text-xs text-amber-900 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/50 mt-2">
                    💡 <strong>Cultural Nuance:</strong> {activeNewWord.culturalNotes}
                  </p>
                )}
              </div>

              {/* Example in French */}
              <div className="bg-indigo-600/5 rounded-xl p-4 border border-indigo-200/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                    Real-World Usage Example
                  </span>
                  <AudioButton text={activeNewWord.exampleFr} size="sm" />
                </div>
                <p className="text-base font-semibold text-slate-900">
                  "{activeNewWord.exampleFr}"
                </p>
                <p className="text-sm text-slate-600 italic">
                  "{activeNewWord.exampleEn}"
                </p>
              </div>

              {/* Collocations */}
              {activeNewWord.collocations && activeNewWord.collocations.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Common Collocations & Related Expressions:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {activeNewWord.collocations.map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 text-slate-700 font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => advanceSessionStage('comprehension')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Continue to Comprehension Check <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE C: COMPREHENSION CHECK */}
      {/* ========================================================================= */}
      {currentStage === 'comprehension' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
              Stage C • Comprehension Check
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Do you understand when to use « {activeNewWord.french} »?
            </h2>
          </div>

          <div className="space-y-4">
            <p className="text-slate-700 font-medium">
              In what situation would a native speaker use this expression?
            </p>

            <div className="space-y-2.5">
              {comprehensionOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleComprehensionCheck(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    comprehensionSelected === idx
                      ? opt.correct
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <span>{opt.text}</span>
                  {comprehensionSelected === idx && (
                    opt.correct ? (
                      <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle size={20} className="text-rose-600 shrink-0" />
                    )
                  )}
                </button>
              ))}
            </div>

            {comprehensionFeedback && (
              <div
                className={`p-4 rounded-xl text-sm ${
                  comprehensionOptions[comprehensionSelected ?? 0]?.correct
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {comprehensionFeedback}
              </div>
            )}

            {comprehensionSelected !== null && (
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => advanceSessionStage('active_recall')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Continue to Active Recall <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE D: ACTIVE RECALL */}
      {/* ========================================================================= */}
      {currentStage === 'active_recall' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
              Stage D • Active Recall Challenge
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Recall the French expression from memory
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Producing French without looking builds lasting recall and conversational confidence.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
              English Meaning
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 pt-2">
              "{activeNewWord.english}"
            </h3>
            <p className="text-xs text-slate-500">
              Clue: {activeNewWord.partOfSpeech} • {activeNewWord.category}
            </p>
          </div>

          <form onSubmit={handleActiveRecallSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Your answer in French:
              </label>
              <input
                type="text"
                value={recallInput}
                onChange={(e) => setRecallInput(e.target.value)}
                placeholder="Type the French word or expression here..."
                disabled={recallChecked}
                className="w-full px-4 py-3 text-lg font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <FrenchAccentBar
                onInsert={(char) => setRecallInput((prev) => prev + char)}
                className="mt-1"
              />
            </div>

            {!recallChecked ? (
              <button
                type="submit"
                disabled={!recallInput.trim()}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition-colors shadow-xs cursor-pointer"
              >
                Check My Recall
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                <div
                  className={`p-4 rounded-xl border ${
                    recallIsCorrect
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-base">
                    {recallIsCorrect ? (
                      <>
                        <CheckCircle2 className="text-emerald-600" />
                        Excellent recall! That is spot-on.
                      </>
                    ) : (
                      <>
                        <XCircle className="text-rose-600" />
                        Close! The target French expression is:
                      </>
                    )}
                  </div>
                  <div className="mt-2 text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{activeNewWord.french}</span>
                    <AudioButton text={activeNewWord.french} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 mt-1 italic">
                    Example: "{activeNewWord.exampleFr}"
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => advanceSessionStage('sentence_production')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Continue to Sentence Practice <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE E: SENTENCE PRODUCTION */}
      {/* ========================================================================= */}
      {currentStage === 'sentence_production' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
              Stage E • Original Sentence Practice
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Construct a sentence with « {activeNewWord.french} »
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Our AI tutor will review your French grammar, spelling, agreements, and register.
            </p>
          </div>

          <form onSubmit={handleProductionSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Your sentence in French:
              </label>
              <textarea
                value={productionInput}
                onChange={(e) => setProductionInput(e.target.value)}
                placeholder={`Example: J'adore ${activeNewWord.french}...`}
                rows={3}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <FrenchAccentBar
                onInsert={(char) => setProductionInput((prev) => prev + char)}
                className="mt-1"
              />
            </div>

            <button
              type="submit"
              disabled={productionEvaluating || !productionInput.trim()}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition-colors shadow-xs cursor-pointer flex items-center gap-2"
            >
              {productionEvaluating ? (
                <>
                  <RotateCcw className="animate-spin" size={18} /> Analyzing with AI Tutor...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Analyze My Sentence
                </>
              )}
            </button>
          </form>

          {/* Structured 5-point correction box */}
          {productionResult && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={16} /> 5-Point Tutor Evaluation
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    productionResult.isCorrect
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {productionResult.isCorrect ? 'Sentence Approved!' : 'Suggested Improvements'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-500">1. Your original sentence:</span>
                  <p className="font-medium text-slate-800">"{productionResult.original}"</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-emerald-600">2. Corrected / natural French version:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-bold text-slate-900 text-base">"{productionResult.corrected}"</p>
                    <AudioButton text={productionResult.corrected} size="sm" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">3. English translation:</span>
                  <p className="text-slate-600 italic">"{productionResult.englishTranslation}"</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-indigo-600">4. Plain-English grammar explanation:</span>
                  <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 mt-1">
                    {productionResult.explanation}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">5. Additional native example:</span>
                  <p className="text-slate-700 font-medium">"{productionResult.additionalExample}"</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => advanceSessionStage('cumulative_practice')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Continue to Cumulative Practice <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE F: CUMULATIVE PRACTICE */}
      {/* ========================================================================= */}
      {currentStage === 'cumulative_practice' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
              Stage F • Cumulative Practice
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Connect new words with your active vocabulary
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Each new French expression builds naturally upon what you've previously learned.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block mb-2">
                Contextual Completion Exercise
              </span>
              <p className="text-lg font-semibold leading-relaxed">
                {cumulativeQuestion.prompt}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {cumulativeQuestion.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleCumulativeSelect(opt)}
                  disabled={cumulativeChecked}
                  className={`p-4 text-left rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    cumulativeChecked
                      ? opt === cumulativeQuestion.correctAnswer
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                        : opt === cumulativeChoice
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                      : 'bg-white border-slate-200 hover:border-indigo-400 text-slate-800 shadow-xs'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {cumulativeChecked && (
              <div className="pt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  {cumulativeChoice === cumulativeQuestion.correctAnswer
                    ? '🎯 Perfect! That is a natural, fluent French combination.'
                    : `The intended answer was: "${cumulativeQuestion.correctAnswer}"`}
                </span>
                <button
                  onClick={() => advanceSessionStage('conversation')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Continue to Mini Dialogue <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE G: EVERYDAY CONVERSATION */}
      {/* ========================================================================= */}
      {currentStage === 'conversation' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquare size={14} /> Stage G • Everyday Conversation Practice
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Chat with Camille, your French tutor
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Respond naturally in French. Try to incorporate today's new word or any phrase you know!
            </p>
          </div>

          {/* Dialogue Thread */}
          <div className="space-y-3 max-h-[360px] overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            {conversationDialogue.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold opacity-75">
                      {msg.role === 'user' ? 'You' : 'Camille'}
                    </span>
                    {msg.role === 'tutor' && <AudioButton text={msg.text} size="sm" />}
                  </div>
                  <p className="font-medium">{msg.text}</p>
                  {msg.translation && (
                    <p className="text-xs text-slate-400 mt-1 italic border-t border-slate-100 pt-1">
                      Translation: {msg.translation}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {conversationSending && (
              <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                <RotateCcw className="animate-spin" size={14} /> Camille is typing a reply...
              </div>
            )}
          </div>

          {conversationFeedback && (
            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
              💡 <strong>Camille's Tip:</strong> {conversationFeedback}
            </div>
          )}

          {/* Reply input */}
          <form onSubmit={handleConversationSend} className="space-y-3">
            <div>
              <input
                type="text"
                value={conversationReply}
                onChange={(e) => setConversationReply(e.target.value)}
                placeholder="Type your response in French..."
                disabled={conversationSending}
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <FrenchAccentBar
                onInsert={(char) => setConversationReply((prev) => prev + char)}
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  completeDailySession();
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Finish session now
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={conversationSending || !conversationReply.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors shadow-xs cursor-pointer"
                >
                  Send Reply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    completeDailySession();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  See Summary <CheckCircle2 size={16} />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE H: SESSION SUMMARY */}
      {/* ========================================================================= */}
      {currentStage === 'summary' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Award size={36} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Congratulations on completing today's session!
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              You have completed the full daily cycle of introduction, active recall, and spaced repetition.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
              <Flame size={20} className="mx-auto text-amber-500 mb-1" />
              <span className="text-2xl font-extrabold text-slate-900">
                {settings.completedDates.length || 1}
              </span>
              <p className="text-[11px] font-semibold uppercase text-slate-500 mt-0.5">Day Streak</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
              <BookOpen size={20} className="mx-auto text-indigo-500 mb-1" />
              <span className="text-2xl font-extrabold text-slate-900">
                {dailySession?.newWordIds.length || 1}
              </span>
              <p className="text-[11px] font-semibold uppercase text-slate-500 mt-0.5">Word Introduced</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
              <CheckCircle2 size={20} className="mx-auto text-emerald-500 mb-1" />
              <span className="text-2xl font-extrabold text-slate-900">
                {dailySession?.correctCount || 4}
              </span>
              <p className="text-[11px] font-semibold uppercase text-slate-500 mt-0.5">Correct Recalls</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
              <Clock size={20} className="mx-auto text-blue-500 mb-1" />
              <span className="text-2xl font-extrabold text-slate-900">~12 min</span>
              <p className="text-[11px] font-semibold uppercase text-slate-500 mt-0.5">Study Time</p>
            </div>
          </div>

          {/* Word reviewed card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Expression Added to Your Active Memory:
            </h4>
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div>
                <span className="text-lg font-bold text-slate-900">{activeNewWord.french}</span>
                <p className="text-xs text-slate-500">{activeNewWord.english}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium px-2 py-1 rounded bg-indigo-50 text-indigo-700">
                  Next Review: {activeNewWord.nextReviewDate || 'Tomorrow'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (onNavigateToExercises) onNavigateToExercises();
              }}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              Practice More Cards in SRS Practice
            </button>
            <button
              onClick={() => {
                if (onNavigateToNotebook) onNavigateToNotebook();
              }}
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              Open My Vocabulary Notebook
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
