import React, { useState } from 'react';
import { useVocab } from '../context/VocabContext';
import {
  Flame,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Upload,
  RotateCcw,
  FastForward,
  Award,
  AlertTriangle,
  Sliders,
  Sparkles,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    items,
    activeItems,
    dueItems,
    masteredItems,
    strugglingItems,
    settings,
    stats,
    mistakes,
    updateSettings,
    advanceSimulatedDate,
    resetSimulatedDate,
    exportDataAsJson,
    exportDataAsCsv,
    importDataFromJson,
    resetToInitialData,
  } = useVocab();

  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Repeated mistakes calculation
  const topRepeatedMistakes = mistakes
    .filter((m) => !m.resolved)
    .sort((a, b) => b.repeatedCount - a.repeatedCount)
    .slice(0, 4);

  // File import handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataFromJson(content);
      if (res.success) {
        setImportStatus('Sauvegarde restaurée avec succès !');
      } else {
        setImportStatus(`Erreur d'import : ${res.error}`);
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  const learningCount = activeItems.length - masteredItems.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          Dashboard & Progress Metrics
        </span>
        <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
          Your French Learning Journey
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Track your spaced retention rate, study streaks, and manage cumulative schedule rules.
        </p>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Streak */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Current Streak</span>
            <Flame size={22} className="text-amber-500 animate-pulse" />
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            {stats.currentStreak}
          </span>
          <span className="text-xs text-slate-500 font-medium block mt-1">
            consecutive days • Record: {stats.longestStreak}d
          </span>
        </div>

        {/* Total Words Introduced */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Words Introduced</span>
            <BookOpen size={22} className="text-indigo-500" />
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            {activeItems.length}
          </span>
          <span className="text-xs text-slate-500 font-medium block mt-1">
            of {items.length} in library
          </span>
        </div>

        {/* Due items */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Due for Review</span>
            <Clock size={22} className="text-blue-500" />
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            {dueItems.length}
          </span>
          <span className="text-xs text-slate-500 font-medium block mt-1">
            due today ({settings.currentSimulatedDate})
          </span>
        </div>

        {/* Overall Accuracy */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Recall Accuracy</span>
            <CheckCircle2 size={22} className="text-emerald-500" />
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600">
            {stats.recallAccuracy}%
          </span>
          <span className="text-xs text-slate-500 font-medium block mt-1">
            {stats.sessionsCompleted} sessions completed
          </span>
        </div>
      </div>

      {/* Vocabulary Mastery Breakdown (Strict & Explicit Criteria) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Vocabulary Acquisition Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Explicit Criteria: A word is counted as <strong>Mastered</strong> only after at least 4 consecutive successful recalls and a spaced interval of 21+ days.
            </p>
          </div>
          <Award size={24} className="text-indigo-600" />
        </div>

        {/* Progress Bar of active vocabulary */}
        <div className="space-y-2">
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex">
            <div
              style={{
                width: `${activeItems.length > 0 ? (masteredItems.length / activeItems.length) * 100 : 0}%`,
              }}
              className="bg-emerald-500 h-full transition-all"
              title="Mastered"
            />
            <div
              style={{
                width: `${
                  activeItems.length > 0
                    ? ((learningCount - strugglingItems.length) / activeItems.length) * 100
                    : 0
                }%`,
              }}
              className="bg-indigo-500 h-full transition-all"
              title="Learning in Progress"
            />
            <div
              style={{
                width: `${activeItems.length > 0 ? (strugglingItems.length / activeItems.length) * 100 : 0}%`,
              }}
              className="bg-rose-500 h-full transition-all"
              title="Needs Work"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="block font-extrabold text-emerald-700 text-lg">
                {masteredItems.length}
              </span>
              <span className="font-semibold text-emerald-900">Mastered Expressions</span>
              <span className="block text-[10px] text-emerald-600 mt-0.5">Interval &ge; 21 days</span>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <span className="block font-extrabold text-indigo-700 text-lg">
                {Math.max(0, learningCount - strugglingItems.length)}
              </span>
              <span className="font-semibold text-indigo-900">Learning in Progress</span>
              <span className="block text-[10px] text-indigo-600 mt-0.5">Intervals 1 to 14 days</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
              <span className="block font-extrabold text-rose-700 text-lg">
                {strugglingItems.length}
              </span>
              <span className="font-semibold text-rose-900">Needs Practice</span>
              <span className="block text-[10px] text-rose-600 mt-0.5">Frequent recent lapses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Study Activity and Retention Trends */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Weekly Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar size={16} className="text-indigo-600" /> Weekly Activity Calendar
            </h4>
            <span className="text-xs text-slate-500 font-medium">Last 7 days</span>
          </div>

          {/* Bar Chart Mockup with real days */}
          <div className="flex items-end justify-between h-32 pt-4 px-2 border-b border-slate-100">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
              const heights = [60, 85, 45, 90, 75, 100, 30];
              const h = heights[idx];
              const isToday = idx === 6;
              return (
                <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    style={{ height: `${h}%` }}
                    className={`w-6 sm:w-8 rounded-t-lg transition-all ${
                      isToday ? 'bg-indigo-600' : 'bg-indigo-200 hover:bg-indigo-300'
                    }`}
                  />
                  <span className={`text-[11px] font-medium ${isToday ? 'font-bold text-indigo-600' : 'text-slate-500'}`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 text-center">
            {settings.sundayConsolidation
              ? 'Sunday configured for consolidation & freeform dialogue.'
              : 'New words introduced 7 days a week.'}
          </p>
        </div>

        {/* Top Repeated Mistakes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-rose-600" /> Most Frequent Mistakes
            </h4>
            <span className="text-xs text-rose-600 font-semibold">{topRepeatedMistakes.length} targeted words</span>
          </div>

          {topRepeatedMistakes.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 space-y-1">
              <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
              <p className="font-semibold text-slate-700">No frequent mistakes</p>
              <p>Your recall accuracy is excellent.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topRepeatedMistakes.map((mis) => (
                <div
                  key={mis.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{mis.french}</span>
                    <span className="text-slate-500 block text-[11px]">{mis.english}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                    {mis.repeatedCount}x missed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings & Daily Progression Rules */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2">
          <Sliders size={20} className="text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-900">
            Settings & Cumulative Rules
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          {/* Daily target count */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Daily Target for New Words:
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => updateSettings({ dailyTarget: count })}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    settings.dailyTarget === count
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {count} word{count > 1 ? 's' : ''} / day
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Recommended: 1 to 2 words per day for deep, long-term mastery.
            </p>
          </div>

          {/* Sunday consolidation mode */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Sunday Consolidation Mode:
            </label>
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <span className="font-semibold text-slate-800 block text-xs">
                  Reserve Sunday for consolidation
                </span>
                <span className="text-[11px] text-slate-500">
                  {settings.sundayConsolidation
                    ? 'No new words on Sunday; mixed review, roleplay dialogues, and assessment only.'
                    : 'New words continue to be introduced on Sundays.'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.sundayConsolidation}
                onChange={(e) => updateSettings({ sundayConsolidation: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Simulator / Time Travel Testing Controls (Crucial for testing daily progression!) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FastForward size={20} className="text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Spaced Repetition & Time Simulator
            </h3>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-amber-300 border border-slate-700">
            Simulated date: {settings.currentSimulatedDate}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          To test how your spaced repetition review schedule and cumulative daily introductions evolve over time, use these quick-advance buttons:
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            onClick={() => advanceSimulatedDate(1)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FastForward size={14} /> Advance 1 Day (+1d)
          </button>
          <button
            onClick={() => advanceSimulatedDate(3)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            Advance 3 Days (+3d)
          </button>
          <button
            onClick={resetSimulatedDate}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
          >
            <RotateCcw size={12} /> Reset to Today
          </button>
        </div>
      </div>

      {/* Data Backup & Export / Import */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Data Backup & Export / Import
        </h3>
        <p className="text-xs text-slate-500">
          All your learning records, review history, and notes remain in your browser. You can export or restore anytime.
        </p>

        {importStatus && (
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportDataAsJson}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} /> Export Backup (JSON)
          </button>

          <button
            onClick={exportDataAsCsv}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} /> Export Vocabulary (CSV)
          </button>

          <label className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload size={14} /> Import Backup (JSON)
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset all data and restart your learning progress?')) {
                resetToInitialData();
              }
            }}
            className="px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer ml-auto"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
};
