import React, { useState, useMemo } from 'react';
import { useVocab } from '../context/VocabContext';
import { VocabItem, RecallRating } from '../types';
import { AudioButton } from '../components/AudioButton';
import { FrenchAccentBar } from '../components/FrenchAccentBar';
import { formatInterval } from '../utils/srs';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Brain,
  HelpCircle,
  Layers,
  Sparkles,
  Shuffle,
  Volume2,
} from 'lucide-react';

export const PracticeExercisesView: React.FC = () => {
  const {
    activeItems,
    dueItems,
    recordReview,
    settings,
    reintroduceWord,
  } = useVocab();

  // Mode: 'due_only' | 'all_active'
  const [filterMode, setFilterMode] = useState<'due_only' | 'all_active'>('due_only');
  // Exercise Type: 'smart_flashcard' | 'multiple_choice' | 'cloze_fill' | 'word_scramble' | 'type_french'
  const [exerciseMode, setExerciseMode] = useState<'smart_flashcard' | 'multiple_choice' | 'cloze_fill' | 'word_scramble' | 'type_french'>('smart_flashcard');

  const pool = useMemo(() => {
    if (filterMode === 'due_only') {
      return dueItems.length > 0 ? dueItems : activeItems;
    }
    return activeItems.length > 0 ? activeItems : dueItems;
  }, [filterMode, dueItems, activeItems]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem: VocabItem | undefined = pool[currentIndex % pool.length];

  // Smart flashcard state
  const [isRevealed, setIsRevealed] = useState(false);

  // Multiple choice state
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [mcFeedback, setMcFeedback] = useState<boolean | null>(null);

  // Type French state
  const [typedInput, setTypedInput] = useState('');
  const [typeChecked, setTypeChecked] = useState(false);
  const [typeIsCorrect, setTypeIsCorrect] = useState(false);

  // Word Scramble state
  const wordsToScramble = useMemo(() => {
    if (!currentItem) return [];
    const tokens = currentItem.french.split(' ');
    return [...tokens].sort(() => Math.random() - 0.5);
  }, [currentItem]);

  const [assembledWords, setAssembledWords] = useState<string[]>([]);
  const [scrambleChecked, setScrambleChecked] = useState(false);
  const [scrambleIsCorrect, setScrambleIsCorrect] = useState(false);

  // Generate 4 multiple choice options
  const mcOptions = useMemo(() => {
    if (!currentItem) return [];
    const correct = currentItem.english;
    const others = activeItems
      .filter((i) => i.id !== currentItem.id)
      .map((i) => i.english)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const fallbacks = ['to sleep in', 'to have a drink', 'straight ahead', 'to get along well'];
    while (others.length < 3) {
      const fb = fallbacks[others.length];
      if (fb !== correct && !others.includes(fb)) others.push(fb);
    }

    return [correct, ...others].sort(() => Math.random() - 0.5);
  }, [currentItem, activeItems]);

  // Cloze prompt
  const clozePrompt = useMemo(() => {
    if (!currentItem) return { sentence: '', missing: '' };
    const missing = currentItem.french;
    // Replace expression in example sentence with blank: ______
    const regex = new RegExp(missing, 'i');
    const clozeSentence = currentItem.exampleFr.replace(regex, '_________');
    return {
      sentence: clozeSentence !== currentItem.exampleFr ? clozeSentence : `« _________ » (${currentItem.english})`,
      missing,
    };
  }, [currentItem]);

  const [clozeInput, setClozeInput] = useState('');
  const [clozeChecked, setClozeChecked] = useState(false);
  const [clozeIsCorrect, setClozeIsCorrect] = useState(false);

  // Reset card state when moving to next
  const goToNextItem = () => {
    setIsRevealed(false);
    setSelectedChoice(null);
    setMcFeedback(null);
    setTypedInput('');
    setTypeChecked(false);
    setAssembledWords([]);
    setScrambleChecked(false);
    setClozeInput('');
    setClozeChecked(false);
    setCurrentIndex((prev) => (prev + 1) % pool.length);
  };

  // SM-2 Recall Rating handler
  const handleRating = (rating: RecallRating) => {
    if (!currentItem) return;
    recordReview(currentItem.id, rating, exerciseMode);
    goToNextItem();
  };

  if (!currentItem) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-lg mx-auto space-y-4">
        <Brain size={48} className="mx-auto text-indigo-500" />
        <h3 className="text-xl font-bold text-slate-800">No words available for practice</h3>
        <p className="text-sm text-slate-500">
          Your spaced repetition deck is empty or no words have been introduced yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Exercise Controls Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm">
              <Brain size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">SRS Training & Practice Drills</h2>
              <p className="text-xs text-slate-500">
                {filterMode === 'due_only'
                  ? `${dueItems.length} word(s) due for review`
                  : `${activeItems.length} active word(s) in pool`}
              </p>
            </div>
          </div>

          {/* Filter toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterMode('due_only')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterMode === 'due_only'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Due for Review ({dueItems.length})
            </button>
            <button
              onClick={() => setFilterMode('all_active')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterMode === 'all_active'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Active Words ({activeItems.length})
            </button>
          </div>
        </div>

        {/* Exercise Types Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 text-xs font-medium scrollbar-none">
          <button
            onClick={() => {
              setExerciseMode('smart_flashcard');
              setIsRevealed(false);
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              exerciseMode === 'smart_flashcard'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            SRS Flashcard
          </button>
          <button
            onClick={() => {
              setExerciseMode('multiple_choice');
              setSelectedChoice(null);
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              exerciseMode === 'multiple_choice'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Multiple Choice (FR → EN)
          </button>
          <button
            onClick={() => {
              setExerciseMode('type_french');
              setTypeChecked(false);
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              exerciseMode === 'type_french'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            French Typing & Recall
          </button>
          <button
            onClick={() => {
              setExerciseMode('cloze_fill');
              setClozeChecked(false);
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              exerciseMode === 'cloze_fill'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Fill in the Blank (Cloze)
          </button>
          <button
            onClick={() => {
              setExerciseMode('word_scramble');
              setAssembledWords([]);
              setScrambleChecked(false);
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              exerciseMode === 'word_scramble'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Phrase Rebuilder
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SMART FLASHCARD SRS MODE */}
      {/* ========================================================================= */}
      {exerciseMode === 'smart_flashcard' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-indigo-600">
              {currentItem.category} • {currentItem.partOfSpeech}
            </span>
            <span className="font-mono">
              Card {currentIndex + 1} of {pool.length}
            </span>
          </div>

          {/* Flashcard Front */}
          <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {currentItem.french}
              </h3>
              <AudioButton text={currentItem.french} size="lg" />
            </div>
            <p className="text-xs font-mono text-slate-400">{currentItem.pronunciation}</p>
            {currentItem.gender !== 'unspecified' && (
              <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Gender: {currentItem.gender}
              </span>
            )}
          </div>

          {/* Flashcard Back (Revealed) */}
          {isRevealed ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    English Meaning
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white font-medium text-slate-600">
                    Register: {currentItem.register}
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{currentItem.english}</p>
                {currentItem.literalMeaning && (
                  <p className="text-xs text-slate-600 italic">
                    Literal translation: "{currentItem.literalMeaning}"
                  </p>
                )}
                <div className="border-t border-indigo-100 pt-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">"{currentItem.exampleFr}"</p>
                    <AudioButton text={currentItem.exampleFr} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 italic">"{currentItem.exampleEn}"</p>
                </div>
              </div>

              {/* 4 SRS Rating Buttons */}
              <div className="space-y-2">
                <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  How well did you recall this expression?
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => handleRating('again')}
                    className="p-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-800 text-center transition-colors cursor-pointer"
                  >
                    <span className="block font-bold text-sm">Again</span>
                    <span className="block text-[11px] opacity-80 mt-0.5">Tomorrow (1d)</span>
                  </button>

                  <button
                    onClick={() => handleRating('hard')}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-800 text-center transition-colors cursor-pointer"
                  >
                    <span className="block font-bold text-sm">Hard</span>
                    <span className="block text-[11px] opacity-80 mt-0.5">
                      {formatInterval(Math.max(1, Math.round(currentItem.intervalDays * 1.2)))}
                    </span>
                  </button>

                  <button
                    onClick={() => handleRating('good')}
                    className="p-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800 text-center transition-colors cursor-pointer"
                  >
                    <span className="block font-bold text-sm">Good</span>
                    <span className="block text-[11px] opacity-80 mt-0.5">
                      {formatInterval(Math.max(2, Math.round(currentItem.intervalDays * (currentItem.easeFactor || 2.5))))}
                    </span>
                  </button>

                  <button
                    onClick={() => handleRating('easy')}
                    className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-center transition-colors cursor-pointer"
                  >
                    <span className="block font-bold text-sm">Easy</span>
                    <span className="block text-[11px] opacity-80 mt-0.5">
                      {formatInterval(Math.max(4, Math.round(currentItem.intervalDays * (currentItem.easeFactor || 2.5) * 1.3)))}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center pt-2">
              <button
                onClick={() => setIsRevealed(true)}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-xs transition-colors cursor-pointer"
              >
                Show Answer
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MULTIPLE CHOICE MODE */}
      {/* ========================================================================= */}
      {exerciseMode === 'multiple_choice' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-indigo-600">
              Multiple Choice • {currentItem.category}
            </span>
            <span className="font-mono">{currentIndex + 1} of {pool.length}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              What is the exact English meaning of:
            </span>
            <div className="flex items-center justify-center gap-2 pt-1">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                « {currentItem.french} »
              </h3>
              <AudioButton text={currentItem.french} size="md" />
            </div>
          </div>

          <div className="space-y-2.5">
            {mcOptions.map((opt) => {
              const isSelected = selectedChoice === opt;
              const isCorrect = opt === currentItem.english;
              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (selectedChoice !== null) return;
                    setSelectedChoice(opt);
                    const correct = isCorrect;
                    setMcFeedback(correct);
                    recordReview(currentItem.id, correct ? 'good' : 'again', 'multiple_choice');
                  }}
                  disabled={selectedChoice !== null}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    selectedChoice !== null
                      ? isCorrect
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                        : isSelected
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                      : 'bg-white border-slate-200 hover:border-indigo-400 text-slate-800 shadow-xs'
                  }`}
                >
                  <span>{opt}</span>
                  {selectedChoice !== null && isCorrect && (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  )}
                  {selectedChoice !== null && isSelected && !isCorrect && (
                    <XCircle size={18} className="text-rose-600" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedChoice !== null && (
            <div className="flex justify-end pt-2">
              <button
                onClick={goToNextItem}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
              >
                Next Question →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TYPE FRENCH MODE */}
      {/* ========================================================================= */}
      {exerciseMode === 'type_french' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-indigo-600">
              Active Recall • Translate into French
            </span>
            <span className="font-mono">{currentIndex + 1} of {pool.length}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Translate into French:
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              "{currentItem.english}"
            </h3>
            <p className="text-xs text-slate-500">
              Category: {currentItem.category} • {currentItem.partOfSpeech}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const cleanUser = typedInput.trim().toLowerCase().replace(/[.,!?'"]/g, '');
              const cleanTarget = currentItem.french.trim().toLowerCase().replace(/[.,!?'"]/g, '');
              const match = cleanUser === cleanTarget;
              setTypeIsCorrect(match);
              setTypeChecked(true);
              recordReview(currentItem.id, match ? 'good' : 'again', 'type_french', typedInput, currentItem.french);
            }}
            className="space-y-4"
          >
            <div>
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Type the French translation..."
                disabled={typeChecked}
                className="w-full px-4 py-3 text-lg font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <FrenchAccentBar
                onInsert={(c) => setTypedInput((prev) => prev + c)}
                className="mt-1"
              />
            </div>

            {!typeChecked ? (
              <button
                type="submit"
                disabled={!typedInput.trim()}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition-colors cursor-pointer"
              >
                Check Answer
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                <div
                  className={`p-4 rounded-xl border ${
                    typeIsCorrect
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <p className="font-bold">
                    {typeIsCorrect ? 'Correct! Well done.' : 'Not quite. The correct French phrase is:'}
                  </p>
                  <div className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mt-1">
                    <span>{currentItem.french}</span>
                    <AudioButton text={currentItem.french} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 mt-1 italic">
                    Example: "{currentItem.exampleFr}"
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={goToNextItem}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer"
                  >
                    Next Word →
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CLOZE TEXT FILL MODE */}
      {/* ========================================================================= */}
      {exerciseMode === 'cloze_fill' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-indigo-600">
              Fill in the Blank • Complete the Sentence
            </span>
            <span className="font-mono">{currentIndex + 1} of {pool.length}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Fill in the missing French expression:
            </span>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-relaxed">
              {clozePrompt.sentence}
            </p>
            <p className="text-xs text-slate-500 italic">
              Translation: "{currentItem.exampleEn}"
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const cleanUser = clozeInput.trim().toLowerCase();
              const cleanTarget = clozePrompt.missing.toLowerCase();
              const match = cleanUser === cleanTarget;
              setClozeIsCorrect(match);
              setClozeChecked(true);
              recordReview(currentItem.id, match ? 'good' : 'again', 'cloze_fill');
            }}
            className="space-y-4"
          >
            <div>
              <input
                type="text"
                value={clozeInput}
                onChange={(e) => setClozeInput(e.target.value)}
                placeholder="Type the missing French word or phrase..."
                disabled={clozeChecked}
                className="w-full px-4 py-3 text-lg font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <FrenchAccentBar
                onInsert={(c) => setClozeInput((prev) => prev + c)}
                className="mt-1"
              />
            </div>

            {!clozeChecked ? (
              <button
                type="submit"
                disabled={!clozeInput.trim()}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition-colors cursor-pointer"
              >
                Check Blank
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                <div
                  className={`p-4 rounded-xl border ${
                    clozeIsCorrect
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <p className="font-bold">
                    {clozeIsCorrect ? 'Perfect! Sentence completed successfully.' : 'Not quite. The missing expression was:'}
                  </p>
                  <p className="text-lg font-bold text-slate-900 mt-1">« {currentItem.french} »</p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={goToNextItem}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer"
                  >
                    Next Sentence →
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. WORD SCRAMBLE MODE */}
      {/* ========================================================================= */}
      {exerciseMode === 'word_scramble' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-indigo-600">
              Reconstruct the French Expression
            </span>
            <span className="font-mono">{currentIndex + 1} of {pool.length}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Target Meaning:
            </span>
            <h3 className="text-2xl font-bold text-slate-900">"{currentItem.english}"</h3>
          </div>

          {/* Assembled Chips Drop Zone */}
          <div className="min-h-[60px] p-4 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 flex flex-wrap gap-2 items-center">
            {assembledWords.length === 0 ? (
              <span className="text-xs text-indigo-400 italic">
                Click the French words below in the correct order...
              </span>
            ) : (
              assembledWords.map((word, idx) => (
                <button
                  key={`${word}-${idx}`}
                  type="button"
                  onClick={() => {
                    if (scrambleChecked) return;
                    setAssembledWords((prev) => prev.filter((_, i) => i !== idx));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-xs hover:bg-indigo-700 cursor-pointer"
                >
                  {word} ✕
                </button>
              ))
            )}
          </div>

          {/* Shuffled Bank */}
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {wordsToScramble.map((word, idx) => {
              const alreadyCount = assembledWords.filter((w) => w === word).length;
              const totalCount = wordsToScramble.filter((w) => w === word).length;
              const isUsed = alreadyCount >= totalCount;
              return (
                <button
                  key={`${word}-${idx}`}
                  type="button"
                  disabled={isUsed || scrambleChecked}
                  onClick={() => setAssembledWords((prev) => [...prev, word])}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    isUsed
                      ? 'opacity-30 bg-slate-100 border-slate-200 text-slate-400'
                      : 'bg-white border-slate-300 hover:border-indigo-400 text-slate-800 shadow-xs active:scale-95'
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>

          {!scrambleChecked ? (
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssembledWords([])}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                disabled={assembledWords.length === 0}
                onClick={() => {
                  const formed = assembledWords.join(' ').toLowerCase();
                  const target = currentItem.french.toLowerCase();
                  const match = formed === target;
                  setScrambleIsCorrect(match);
                  setScrambleChecked(true);
                  recordReview(currentItem.id, match ? 'good' : 'again', 'word_scramble');
                }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm cursor-pointer shadow-xs"
              >
                Verify Sentence Order
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div
                className={`p-4 rounded-xl border ${
                  scrambleIsCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <p className="font-bold">
                  {scrambleIsCorrect ? 'Bravo! Perfect sentence assembly.' : 'Incorrect order. The exact French phrase is:'}
                </p>
                <div className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-1">
                  <span>{currentItem.french}</span>
                  <AudioButton text={currentItem.french} size="sm" />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={goToNextItem}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer"
                >
                  Next Expression →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
