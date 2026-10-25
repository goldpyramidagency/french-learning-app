import React, { useState } from 'react';
import { VocabProvider } from './context/VocabContext';
import { Navbar, NavTab } from './components/Navbar';
import { DailySessionView } from './views/DailySessionView';
import { PracticeExercisesView } from './views/PracticeExercisesView';
import { PhraseLibraryView } from './views/PhraseLibraryView';
import { AITutorView } from './views/AITutorView';
import { NotebookView } from './views/NotebookView';
import { DashboardView } from './views/DashboardView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('daily');

  return (
    <VocabProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-16 md:pb-6">
        <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
          {currentTab === 'daily' && (
            <DailySessionView
              onNavigateToExercises={() => setCurrentTab('practice')}
              onNavigateToNotebook={() => setCurrentTab('notebook')}
            />
          )}

          {currentTab === 'practice' && <PracticeExercisesView />}

          {currentTab === 'library' && <PhraseLibraryView />}

          {currentTab === 'tutor' && <AITutorView />}

          {currentTab === 'notebook' && <NotebookView />}

          {currentTab === 'dashboard' && <DashboardView />}
        </main>
      </div>
    </VocabProvider>
  );
}
