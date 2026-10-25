import React, { useState, useMemo } from 'react';
import { useVocab } from '../context/VocabContext';
import { VocabItem, PartOfSpeech, GrammaticalGender, Register, CEFRLevel } from '../types';
import { AudioButton } from '../components/AudioButton';
import { FrenchAccentBar } from '../components/FrenchAccentBar';
import { CATEGORIES } from '../data/seedVocabulary';
import {
  BookMarked,
  AlertTriangle,
  PlusCircle,
  Search,
  Star,
  Flag,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Edit3,
  Save,
  Tag,
} from 'lucide-react';

export const NotebookView: React.FC = () => {
  const {
    items,
    mistakes,
    toggleStarWord,
    toggleSuspendWord,
    toggleFlagGrammar,
    updateWordNotes,
    reintroduceWord,
    addCustomWord,
    resolveMistake,
    deleteMistake,
  } = useVocab();

  // Active Tab: 'vocab' | 'mistakes' | 'add_word'
  const [activeTab, setActiveTab] = useState<'vocab' | 'mistakes' | 'add_word'>('vocab');

  // Search & Filter state for vocabulary
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<'all' | 'starred' | 'struggling' | 'grammar' | 'suspended' | 'mastered'>('all');

  // Editing notes state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Form state for adding custom word
  const [customFrench, setCustomFrench] = useState('');
  const [customEnglish, setCustomEnglish] = useState('');
  const [customPartOfSpeech, setCustomPartOfSpeech] = useState<PartOfSpeech>('expression');
  const [customGender, setCustomGender] = useState<GrammaticalGender>('unspecified');
  const [customPronunciation, setCustomPronunciation] = useState('');
  const [customExampleFr, setCustomExampleFr] = useState('');
  const [customExampleEn, setCustomExampleEn] = useState('');
  const [customCategory, setCustomCategory] = useState<string>(CATEGORIES[0]);
  const [customRegister, setCustomRegister] = useState<Register>('neutral');
  const [customDifficulty, setCustomDifficulty] = useState<CEFRLevel>('A1');
  const [customNotes, setCustomNotes] = useState('');
  const [customSavedSuccess, setCustomSavedSuccess] = useState(false);

  // Filtered Vocab list
  const filteredVocab = useMemo(() => {
    return items.filter((item) => {
      // Must not be completely unintroduced, or let's show all introduced/active/custom
      if (item.status === 'unintroduced' && !item.isCustom) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const m1 = item.french.toLowerCase().includes(q);
        const m2 = item.english.toLowerCase().includes(q);
        const m3 = item.userNotes?.toLowerCase().includes(q);
        if (!m1 && !m2 && !m3) return false;
      }

      if (filterTag === 'starred' && !item.isStarred) return false;
      if (filterTag === 'struggling' && !item.isStruggling) return false;
      if (filterTag === 'grammar' && !item.flaggedGrammar) return false;
      if (filterTag === 'suspended' && item.status !== 'suspended') return false;
      if (filterTag === 'mastered' && item.status !== 'mastered') return false;

      return true;
    });
  }, [items, searchQuery, filterTag]);

  // Handle Add Custom Word submit
  const handleAddCustomWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFrench.trim() || !customEnglish.trim()) return;

    addCustomWord({
      french: customFrench.trim(),
      english: customEnglish.trim(),
      partOfSpeech: customPartOfSpeech,
      gender: customGender,
      plural: null,
      pronunciation: customPronunciation.trim() || `/${customFrench.toLowerCase()}/`,
      exampleFr: customExampleFr.trim() || `J'utilise "${customFrench}" au quotidien.`,
      exampleEn: customExampleEn.trim() || `I use "${customEnglish}" in daily life.`,
      context: 'Expression ajoutée personnellement par l\'apprenant.',
      register: customRegister,
      collocations: [],
      difficulty: customDifficulty,
      category: customCategory,
      userNotes: customNotes.trim() || undefined,
    });

    // Reset form
    setCustomFrench('');
    setCustomEnglish('');
    setCustomPronunciation('');
    setCustomExampleFr('');
    setCustomExampleEn('');
    setCustomNotes('');
    setCustomSavedSuccess(true);
    setTimeout(() => setCustomSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Personal Notebook & Mistakes Manager
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
            My Learning Space
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal study notes, review logged mistakes, and add custom French expressions.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 border-b border-slate-100 pt-2 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('vocab')}
            className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'vocab'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookMarked size={16} /> My Vocabulary ({filteredVocab.length})
          </button>
          <button
            onClick={() => setActiveTab('mistakes')}
            className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'mistakes'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle size={16} /> Mistakes Notebook ({mistakes.filter((m) => !m.resolved).length})
          </button>
          <button
            onClick={() => setActiveTab('add_word')}
            className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'add_word'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusCircle size={16} /> Add Custom Word
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VOCABULARY NOTEBOOK TAB */}
      {/* ========================================================================= */}
      {activeTab === 'vocab' && (
        <div className="space-y-4">
          {/* Search & Tag filter pills */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by French word, English meaning, or personal notes..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <button
                onClick={() => setFilterTag('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterTag === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({items.filter((i) => i.status !== 'unintroduced').length})
              </button>
              <button
                onClick={() => setFilterTag('starred')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  filterTag === 'starred'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Star size={12} fill="currentColor" /> Starred (
                {items.filter((i) => i.isStarred).length})
              </button>
              <button
                onClick={() => setFilterTag('struggling')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  filterTag === 'struggling'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <AlertTriangle size={12} /> Struggling (
                {items.filter((i) => i.isStruggling).length})
              </button>
              <button
                onClick={() => setFilterTag('grammar')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  filterTag === 'grammar'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Flag size={12} /> Flagged Grammar (
                {items.filter((i) => i.flaggedGrammar).length})
              </button>
              <button
                onClick={() => setFilterTag('mastered')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  filterTag === 'mastered'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 size={12} /> Mastered (
                {items.filter((i) => i.status === 'mastered').length})
              </button>
              <button
                onClick={() => setFilterTag('suspended')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  filterTag === 'suspended'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Pause size={12} /> Suspended (
                {items.filter((i) => i.status === 'suspended').length})
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {filteredVocab.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 space-y-2">
                <BookMarked size={36} className="mx-auto text-slate-400" />
                <p className="font-semibold text-slate-700">No words matching this filter category.</p>
                <p className="text-xs">Add more expressions from the library or complete your daily session.</p>
              </div>
            ) : (
              filteredVocab.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all space-y-3 ${
                    item.isStruggling
                      ? 'border-rose-300'
                      : item.status === 'suspended'
                      ? 'border-slate-300 opacity-60 bg-slate-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{item.french}</h3>
                        <AudioButton text={item.french} size="sm" />
                        <span className="text-xs font-mono text-slate-400">{item.pronunciation}</span>
                        {item.gender !== 'unspecified' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            {item.gender}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.difficulty}
                        </span>
                        {item.status === 'mastered' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Mastered ⭐
                          </span>
                        )}
                        {item.isStruggling && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            Needs Practice
                          </span>
                        )}
                        {item.status === 'suspended' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            Suspended
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-indigo-700">{item.english}</p>
                      <p className="text-xs text-slate-500">
                        "{item.exampleFr}" — <span className="italic">{item.exampleEn}</span>
                      </p>
                    </div>

                    {/* Quick word actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleStarWord(item.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          item.isStarred ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400'
                        }`}
                        title="Star / Favorite"
                      >
                        <Star size={16} fill={item.isStarred ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleFlagGrammar(item.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          item.flaggedGrammar ? 'text-purple-600 bg-purple-50' : 'text-slate-300 hover:text-purple-500'
                        }`}
                        title="Flag Grammar Rule"
                      >
                        <Flag size={16} fill={item.flaggedGrammar ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        type="button"
                        onClick={() => reintroduceWord(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Deliberately reintroduce for a fresh learning cycle"
                      >
                        <RotateCcw size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSuspendWord(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title={item.status === 'suspended' ? 'Reactivate Word' : 'Suspend from Reviews'}
                      >
                        {item.status === 'suspended' ? <Play size={16} /> : <Pause size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Personal notes section */}
                  <div className="pt-2 border-t border-slate-100">
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          placeholder="Add a personal mnemonic, usage note, or grammar rule..."
                          rows={2}
                          className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 text-xs rounded border border-slate-200 text-slate-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateWordNotes(item.id, editingText);
                              setEditingId(null);
                            }}
                            className="px-3 py-1 text-xs rounded bg-indigo-600 text-white font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Save size={12} /> Save Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        {item.userNotes ? (
                          <p className="bg-amber-50/70 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-200/50 flex-1 mr-2">
                            📝 <strong>Note:</strong> {item.userNotes}
                          </p>
                        ) : (
                          <span className="text-slate-400 italic">No personal notes yet</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditingText(item.userNotes || '');
                          }}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Edit3 size={12} /> {item.userNotes ? 'Edit' : 'Add Note'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SRS History Stats mini bar */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      Successful recalls: <strong className="text-slate-600">{item.successfulAttempts}</strong> • Failed: {' '}
                      <strong className="text-slate-600">{item.failedAttempts}</strong>
                    </span>
                    <span>SRS Interval: {item.intervalDays} day(s)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MISTAKES NOTEBOOK TAB */}
      {/* ========================================================================= */}
      {activeTab === 'mistakes' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed">
            💡 <strong>Smart Mistakes Notebook:</strong> Every incorrect recall attempt during your sessions is automatically recorded here. These mistakes directly influence the SRS scheduler to prioritize reviewing your weakest expressions.
          </div>

          <div className="space-y-3">
            {mistakes.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 space-y-2">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                <p className="font-bold text-slate-800 text-base">No mistakes recorded yet!</p>
                <p className="text-xs">You have successfully mastered all currently active expressions.</p>
              </div>
            ) : (
              mistakes.map((m) => (
                <div
                  key={m.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all space-y-3 ${
                    m.resolved ? 'border-slate-200 opacity-60 bg-slate-50/50' : 'border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900">{m.french}</span>
                        <AudioButton text={m.french} size="sm" />
                        <span className="text-xs text-indigo-700 font-semibold">({m.english})</span>
                        {m.repeatedCount > 1 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                            {m.repeatedCount}x missed
                          </span>
                        )}
                        {m.resolved && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Date: {m.date}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => resolveMistake(m.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          m.resolved
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {m.resolved ? 'Mark Unresolved' : 'Mark as Understood'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMistake(m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete this mistake entry"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="font-bold text-rose-600">Your Answer:</span>
                      <p className="text-slate-800 font-medium">"{m.userResponse}"</p>
                    </div>
                    <div>
                      <span className="font-bold text-emerald-600">Expected French:</span>
                      <p className="text-slate-800 font-medium">"{m.correctResponse}"</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    💡 <strong>Explanation:</strong> {m.explanation}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ADD CUSTOM WORD TAB */}
      {/* ========================================================================= */}
      {activeTab === 'add_word' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Add a Custom French Expression
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Encountered a new phrase in a film, podcast, or conversation? Add it to your cumulative spaced repetition system.
            </p>
          </div>

          {customSavedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="text-emerald-600" />
              Expression successfully added to your active study pool!
            </div>
          )}

          <form onSubmit={handleAddCustomWord} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  French Word or Expression *
                </label>
                <input
                  type="text"
                  required
                  value={customFrench}
                  onChange={(e) => setCustomFrench(e.target.value)}
                  placeholder="e.g. faire la moue"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                />
                <FrenchAccentBar
                  onInsert={(c) => setCustomFrench((p) => p + c)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  English Meaning *
                </label>
                <input
                  type="text"
                  required
                  value={customEnglish}
                  onChange={(e) => setCustomEnglish(e.target.value)}
                  placeholder="e.g. to pout / make a face"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Part of Speech</label>
                <select
                  value={customPartOfSpeech}
                  onChange={(e) => setCustomPartOfSpeech(e.target.value as PartOfSpeech)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="expression">Expression</option>
                  <option value="phrase">Phrase</option>
                  <option value="noun">Noun</option>
                  <option value="verb">Verb</option>
                  <option value="adjective">Adjective</option>
                  <option value="adverb">Adverb</option>
                  <option value="conjunction">Conjunction</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Grammatical Gender</label>
                <select
                  value={customGender}
                  onChange={(e) => setCustomGender(e.target.value as GrammaticalGender)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="unspecified">Unspecified / N/A</option>
                  <option value="masculine">Masculine</option>
                  <option value="feminine">Feminine</option>
                  <option value="both">Both / Either</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Register</label>
                <select
                  value={customRegister}
                  onChange={(e) => setCustomRegister(e.target.value as Register)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="neutral">Neutral (Standard)</option>
                  <option value="informal">Informal (Everyday Spoken)</option>
                  <option value="formal">Formal</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Level</label>
                <select
                  value={customDifficulty}
                  onChange={(e) => setCustomDifficulty(e.target.value as CEFRLevel)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="A1">A1 Beginner</option>
                  <option value="A2">A2 Elementary</option>
                  <option value="B1">B1 Intermediate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Thematic Category
              </label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  French Example Sentence
                </label>
                <input
                  type="text"
                  value={customExampleFr}
                  onChange={(e) => setCustomExampleFr(e.target.value)}
                  placeholder="e.g. Elle fait la moue quand elle n'est pas contente."
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Example English Translation
                </label>
                <input
                  type="text"
                  value={customExampleEn}
                  onChange={(e) => setCustomExampleEn(e.target.value)}
                  placeholder="e.g. She pouts when she isn't happy."
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Personal Notes or Memory Hooks
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Heard in Lupin episode 2, rhymes with..."
                rows={2}
                className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <PlusCircle size={18} /> Add to Active Study Pool
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
