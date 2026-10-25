import React, { useState, useMemo } from 'react';
import { useVocab } from '../context/VocabContext';
import { CATEGORIES } from '../data/seedVocabulary';
import { VocabItem, Register, CEFRLevel } from '../types';
import { AudioButton } from '../components/AudioButton';
import {
  Search,
  BookOpen,
  Sparkles,
  PlusCircle,
  Check,
  Star,
  Info,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const PhraseLibraryView: React.FC = () => {
  const { items, toggleStarWord, introduceNextDailyItems, reintroduceWord } = useVocab();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRegister, setSelectedRegister] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // "Useful Today" recommendation selection (rotates based on current day or learner's stage)
  const usefulTodayItems = useMemo(() => {
    return items
      .filter((i) => i.register !== 'formal')
      .slice(0, 3);
  }, [items]);

  // Filtered library items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchFrench = item.french.toLowerCase().includes(query);
        const matchEnglish = item.english.toLowerCase().includes(query);
        const matchExample = item.exampleFr.toLowerCase().includes(query);
        if (!matchFrench && !matchEnglish && !matchExample) return false;
      }

      // Category
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Register
      if (selectedRegister !== 'All' && item.register !== selectedRegister) {
        return false;
      }

      // Level
      if (selectedLevel !== 'All' && item.difficulty !== selectedLevel) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, selectedCategory, selectedRegister, selectedLevel]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Vocabulary & Expression Library
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
            Authentic Everyday French Expressions
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Explore 110+ natural French expressions organized by real-world daily situations.
          </p>
        </div>

        {/* Useful Today Recommendation Card */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
            <Sparkles size={16} className="text-amber-600" /> Recommended For Your Day
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Essential idiomatic expressions selected for your learning stage:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {usefulTodayItems.map((rec) => (
              <div
                key={rec.id}
                className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{rec.french}</span>
                  <AudioButton text={rec.french} size="sm" />
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{rec.english}</p>
                <span className="inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                  {rec.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Search & Filters Controls */}
        <div className="space-y-3 pt-2">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any French phrase, English meaning, or keyword (e.g. café, gare, hâte)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Categories ({items.length})</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Register Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Register:</span>
              <select
                value={selectedRegister}
                onChange={(e) => setSelectedRegister(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Registers</option>
                <option value="informal">Informal (Everyday Spoken)</option>
                <option value="neutral">Neutral (Standard)</option>
                <option value="formal">Formal</option>
              </select>
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Level:</span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Levels</option>
                <option value="A1">A1 (Beginner)</option>
                <option value="A2">A2 (Elementary)</option>
                <option value="B1">B1 (Intermediate)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Phrases List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
          <span>{filteredItems.length} expression(s) found</span>
          <span>Click any card to explore full linguistic details & examples</span>
        </div>

        {filteredItems.map((item) => {
          const isExpanded = expandedId === item.id;
          const isInStudyPool = item.status !== 'unintroduced';

          return (
            <div
              key={item.id}
              className={`bg-white border rounded-2xl transition-all overflow-hidden ${
                isExpanded ? 'border-indigo-400 shadow-sm' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header row */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer select-none"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{item.french}</h3>
                    <AudioButton text={item.french} size="sm" />
                    <span className="text-xs font-mono text-slate-400">{item.pronunciation}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.register === 'informal'
                          ? 'bg-amber-50 text-amber-800'
                          : item.register === 'formal'
                          ? 'bg-purple-50 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.register}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {item.difficulty}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-indigo-700">{item.english}</p>
                  <p className="text-xs text-slate-500">{item.category}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStarWord(item.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      item.isStarred ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400'
                    }`}
                    title="Toggle star / favorite"
                  >
                    <Star size={18} fill={item.isStarred ? 'currentColor' : 'none'} />
                  </button>

                  {/* Add to Study Pool button if unintroduced */}
                  {!isInStudyPool ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        reintroduceWord(item.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                      title="Add to daily study pool"
                    >
                      <PlusCircle size={14} /> Add to Study
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      <Check size={12} /> In Study Pool
                    </span>
                  )}

                  <div className="p-1 text-slate-400">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3.5 text-xs animate-in fade-in">
                  {/* Grammatical info */}
                  <div className="flex flex-wrap items-center gap-3 text-slate-600">
                    <span>
                      <strong>Part of Speech:</strong> {item.partOfSpeech}
                    </span>
                    {item.gender !== 'unspecified' && (
                      <span>
                        <strong>Gender:</strong> {item.gender}
                      </span>
                    )}
                    {item.plural && (
                      <span>
                        <strong>Plural:</strong> {item.plural}
                      </span>
                    )}
                  </div>

                  {/* Literal meaning if present */}
                  {item.literalMeaning && (
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                      <strong>Literal word-for-word:</strong> « {item.literalMeaning} »
                      <span className="block text-slate-500 mt-0.5">
                        Do not translate word-for-word! In natural French, this expression means: "{item.english}".
                      </span>
                    </div>
                  )}

                  {/* Context of usage */}
                  <div>
                    <strong className="text-slate-700 block mb-1">When to use in daily life:</strong>
                    <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                      {item.context}
                    </p>
                  </div>

                  {/* Cultural note if present */}
                  {item.culturalNotes && (
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 leading-relaxed">
                      💡 <strong>Cultural Note:</strong> {item.culturalNotes}
                    </div>
                  )}

                  {/* Example */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-700">Authentic French Example:</strong>
                      <AudioButton text={item.exampleFr} size="sm" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">"{item.exampleFr}"</p>
                    <p className="text-slate-500 italic">"{item.exampleEn}"</p>
                  </div>

                  {/* Collocations */}
                  {item.collocations && item.collocations.length > 0 && (
                    <div>
                      <strong className="text-slate-700 block mb-1">Common Collocations & Related Expressions:</strong>
                      <div className="flex flex-wrap gap-1.5">
                        {item.collocations.map((col) => (
                          <span
                            key={col}
                            className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 font-medium"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
