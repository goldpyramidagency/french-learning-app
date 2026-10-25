import React from 'react';
import { useVocab } from '../context/VocabContext';
import {
  Calendar,
  Sparkles,
  Flame,
  Brain,
  BookOpen,
  Bot,
  BookMarked,
  BarChart3,
  FastForward,
} from 'lucide-react';

export type NavTab = 'daily' | 'practice' | 'library' | 'tutor' | 'notebook' | 'dashboard';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { stats, settings, dueItems, advanceSimulatedDate } = useVocab();

  const navItems = [
    { id: 'daily' as NavTab, label: 'Today', icon: Calendar, badge: null },
    {
      id: 'practice' as NavTab,
      label: 'SRS Practice',
      icon: Brain,
      badge: dueItems.length > 0 ? dueItems.length : null,
    },
    { id: 'library' as NavTab, label: 'Phrase Library', icon: BookOpen, badge: null },
    { id: 'tutor' as NavTab, label: 'AI Tutor', icon: Bot, badge: 'AI' },
    { id: 'notebook' as NavTab, label: 'Notebook', icon: BookMarked, badge: null },
    { id: 'dashboard' as NavTab, label: 'Progress', icon: BarChart3, badge: null },
  ];

  return (
    <>
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => onSelectTab('daily')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-black text-xl shadow-xs">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  Parler
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 uppercase tracking-widest border border-indigo-200">
                  French
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Daily vocabulary coach & spaced repetition
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                        item.badge === 'AI'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Status Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Badge */}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs"
              title={`${stats.currentStreak} day learning streak`}
            >
              <Flame size={15} className="text-amber-500 fill-amber-500" />
              <span>{stats.currentStreak}d</span>
            </div>

            {/* Quick Simulate Day +1 */}
            <button
              type="button"
              onClick={() => advanceSimulatedDate(1)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-200/80"
              title={`Simulate next day (current: ${settings.currentSimulatedDate})`}
            >
              <FastForward size={14} className="text-indigo-600" />
              <span className="hidden sm:inline">Day</span> +1
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                {item.badge !== null && (
                  <span className="absolute -top-1 -right-2 px-1 text-[8px] font-extrabold rounded-full bg-indigo-600 text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
