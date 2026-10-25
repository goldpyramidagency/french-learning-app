import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  VocabItem,
  UserSettings,
  MistakeEntry,
  DailySessionState,
  StudyStats,
  RecallRating,
  SessionStage,
} from '../types';
import { INITIAL_VOCABULARY } from '../data/seedVocabulary';
import {
  calculateNextReview,
  isDue,
  formatDate,
  addDays,
  reintroduceItem as srsReintroduceItem,
} from '../utils/srs';

const STORAGE_KEYS = {
  VOCAB: 'parler_french_vocab_v1',
  SETTINGS: 'parler_french_settings_v1',
  MISTAKES: 'parler_french_mistakes_v1',
  STATS: 'parler_french_stats_v1',
  DAILY_SESSION: 'parler_french_daily_session_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  dailyTarget: 1,
  sundayConsolidation: true,
  audioAutoplay: false,
  voiceSpeed: 0.9,
  currentSimulatedDate: formatDate(new Date()),
  completedDates: [],
};

const DEFAULT_STATS: StudyStats = {
  currentStreak: 3,
  longestStreak: 5,
  totalStudyTimeSeconds: 1840,
  sessionsCompleted: 4,
  totalWordsIntroduced: 3,
  recallAccuracy: 92,
};

interface VocabContextType {
  items: VocabItem[];
  settings: UserSettings;
  mistakes: MistakeEntry[];
  stats: StudyStats;
  dailySession: DailySessionState | null;
  dueItems: VocabItem[];
  activeItems: VocabItem[];
  masteredItems: VocabItem[];
  strugglingItems: VocabItem[];
  unintroducedItems: VocabItem[];
  todaysNewWord: VocabItem | null;
  // Actions
  recordReview: (
    itemId: string,
    rating: RecallRating,
    exerciseType?: string,
    userResponse?: string,
    correctResponse?: string
  ) => void;
  introduceNextDailyItems: (count?: number, force?: boolean) => VocabItem[];
  reintroduceWord: (itemId: string) => void;
  toggleSuspendWord: (itemId: string) => void;
  toggleStarWord: (itemId: string) => void;
  updateWordNotes: (itemId: string, notes: string) => void;
  toggleFlagGrammar: (itemId: string) => void;
  addCustomWord: (item: Omit<VocabItem, 'id' | 'status' | 'introducedDate' | 'lastReviewedDate' | 'nextReviewDate' | 'repetitionCount' | 'intervalDays' | 'easeFactor' | 'successfulAttempts' | 'failedAttempts' | 'reviewHistory'>) => VocabItem;
  resolveMistake: (mistakeId: string) => void;
  deleteMistake: (mistakeId: string) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  advanceSimulatedDate: (days?: number) => void;
  resetSimulatedDate: () => void;
  startDailySession: () => DailySessionState;
  advanceSessionStage: (stage: SessionStage) => void;
  completeDailySession: () => void;
  resetToInitialData: () => void;
  exportDataAsJson: () => void;
  exportDataAsCsv: () => void;
  importDataFromJson: (jsonStr: string) => { success: boolean; error?: string };
}

const VocabContext = createContext<VocabContextType | undefined>(undefined);

export const VocabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Vocabulary Items State
  const [items, setItems] = useState<VocabItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VOCAB);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load vocab from storage', e);
    }
    return INITIAL_VOCABULARY;
  });

  // 2. Settings State
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  // 3. Mistakes State
  const [mistakes, setMistakes] = useState<MistakeEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MISTAKES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load mistakes', e);
    }
    return [];
  });

  // 4. Stats State
  const [stats, setStats] = useState<StudyStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load stats', e);
    }
    return DEFAULT_STATS;
  });

  // 5. Daily Session State
  const [dailySession, setDailySession] = useState<DailySessionState | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAILY_SESSION);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load daily session', e);
    }
    return null;
  });

  // Persist items
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOCAB, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save vocab', e);
    }
  }, [items]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [settings]);

  // Persist mistakes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(mistakes));
    } catch (e) {
      console.error('Failed to save mistakes', e);
    }
  }, [mistakes]);

  // Persist stats
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to save stats', e);
    }
  }, [stats]);

  // Persist daily session
  useEffect(() => {
    try {
      if (dailySession) {
        localStorage.setItem(STORAGE_KEYS.DAILY_SESSION, JSON.stringify(dailySession));
      } else {
        localStorage.removeItem(STORAGE_KEYS.DAILY_SESSION);
      }
    } catch (e) {
      console.error('Failed to save daily session', e);
    }
  }, [dailySession]);

  // Derived collections
  const activeItems = useMemo(
    () => items.filter((item) => item.status !== 'unintroduced' && item.status !== 'suspended'),
    [items]
  );

  const dueItems = useMemo(
    () => items.filter((item) => isDue(item, settings.currentSimulatedDate)),
    [items, settings.currentSimulatedDate]
  );

  const masteredItems = useMemo(
    () => items.filter((item) => item.status === 'mastered'),
    [items]
  );

  const strugglingItems = useMemo(
    () => items.filter((item) => item.isStruggling && item.status !== 'suspended'),
    [items]
  );

  const unintroducedItems = useMemo(
    () => items.filter((item) => item.status === 'unintroduced'),
    [items]
  );

  // New word introduced today (or pending introduction)
  const todaysNewWord = useMemo(() => {
    // Check if an item was introduced on the current simulated date
    const introducedToday = items.find((i) => i.introducedDate === settings.currentSimulatedDate);
    if (introducedToday) return introducedToday;

    // Otherwise, peek at the next unintroduced item
    return unintroducedItems[0] || null;
  }, [items, settings.currentSimulatedDate, unintroducedItems]);

  // Introduce next daily items
  const introduceNextDailyItems = useCallback(
    (count?: number, force: boolean = false): VocabItem[] => {
      const targetCount = count ?? settings.dailyTarget;
      
      // Check Sunday rule
      const dateObj = new Date(settings.currentSimulatedDate);
      const isSunday = dateObj.getDay() === 0;
      if (isSunday && settings.sundayConsolidation && !force) {
        return [];
      }

      // Find already introduced today
      const alreadyIntroducedToday = items.filter(
        (i) => i.introducedDate === settings.currentSimulatedDate
      );
      if (alreadyIntroducedToday.length >= targetCount && !force) {
        return alreadyIntroducedToday;
      }

      const needed = Math.max(0, targetCount - alreadyIntroducedToday.length);
      const available = items.filter((i) => i.status === 'unintroduced');
      const candidates = available.slice(0, needed);

      if (candidates.length === 0) return alreadyIntroducedToday;

      setItems((prev) =>
        prev.map((item) => {
          if (candidates.some((c) => c.id === item.id)) {
            return {
              ...item,
              status: 'introduced',
              introducedDate: settings.currentSimulatedDate,
              nextReviewDate: settings.currentSimulatedDate, // Due today for immediate reinforcement
              intervalDays: 1,
              repetitionCount: 0,
              easeFactor: 2.5,
            };
          }
          return item;
        })
      );

      setStats((prev) => ({
        ...prev,
        totalWordsIntroduced: prev.totalWordsIntroduced + candidates.length,
      }));

      return [...alreadyIntroducedToday, ...candidates];
    },
    [items, settings.currentSimulatedDate, settings.dailyTarget, settings.sundayConsolidation]
  );

  // Record an SRS review
  const recordReview = useCallback(
    (
      itemId: string,
      rating: RecallRating,
      exerciseType: string = 'review',
      userResponse?: string,
      correctResponse?: string
    ) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const wasCorrect = rating !== 'again';
      const result = calculateNextReview(
        item,
        rating,
        settings.currentSimulatedDate,
        exerciseType
      );

      // Update the item
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== itemId) return it;
          return {
            ...it,
            status: result.status,
            repetitionCount: result.repetitionCount,
            intervalDays: result.intervalDays,
            easeFactor: result.easeFactor,
            nextReviewDate: result.nextReviewDate,
            lastReviewedDate: settings.currentSimulatedDate,
            successfulAttempts: it.successfulAttempts + (wasCorrect ? 1 : 0),
            failedAttempts: it.failedAttempts + (wasCorrect ? 0 : 1),
            reviewHistory: [...it.reviewHistory, result.reviewRecord],
            isStruggling: result.isStrugglingItem,
          };
        })
      );

      // If failed, record or update in Mistakes Notebook
      if (!wasCorrect) {
        setMistakes((prev) => {
          const existing = prev.find((m) => m.vocabId === itemId && !m.resolved);
          if (existing) {
            return prev.map((m) =>
              m.id === existing.id
                ? {
                    ...m,
                    repeatedCount: m.repeatedCount + 1,
                    userResponse: userResponse || m.userResponse,
                    date: settings.currentSimulatedDate,
                  }
                : m
            );
          } else {
            const newMistake: MistakeEntry = {
              id: `mistake-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              vocabId: itemId,
              french: item.french,
              english: item.english,
              userResponse: userResponse || '(Recall failure)',
              correctResponse: correctResponse || item.french,
              date: settings.currentSimulatedDate,
              explanation: `Review flagged as "${rating}". Practice the gender and expression usage in everyday French.`,
              repeatedCount: 1,
              resolved: false,
            };
            return [newMistake, ...prev];
          }
        });
      }

      // Update study stats
      setStats((prev) => {
        const totalReviews = prev.sessionsCompleted * 10 + 1;
        const totalCorrect = Math.round((prev.recallAccuracy / 100) * (totalReviews - 1)) + (wasCorrect ? 1 : 0);
        const newAccuracy = Math.min(100, Math.max(0, Math.round((totalCorrect / totalReviews) * 100)));
        return {
          ...prev,
          recallAccuracy: newAccuracy,
        };
      });

      // Update daily session state if active
      if (dailySession) {
        setDailySession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            reviewedWordIds: Array.from(new Set([...prev.reviewedWordIds, itemId])),
            correctCount: prev.correctCount + (wasCorrect ? 1 : 0),
            incorrectCount: prev.incorrectCount + (wasCorrect ? 0 : 1),
          };
        });
      }
    },
    [items, settings.currentSimulatedDate, dailySession]
  );

  // Reintroduce a word
  const reintroduceWord = useCallback(
    (itemId: string) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== itemId) return it;
          return {
            ...it,
            ...srsReintroduceItem(it, settings.currentSimulatedDate),
          };
        })
      );
    },
    [settings.currentSimulatedDate]
  );

  // Toggle suspend
  const toggleSuspendWord = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          status: it.status === 'suspended' ? 'learning' : 'suspended',
        };
      })
    );
  }, []);

  // Toggle star
  const toggleStarWord = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          isStarred: !it.isStarred,
        };
      })
    );
  }, []);

  // Update notes
  const updateWordNotes = useCallback((itemId: string, notes: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return { ...it, userNotes: notes };
      })
    );
  }, []);

  // Toggle flag grammar
  const toggleFlagGrammar = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return { ...it, flaggedGrammar: !it.flaggedGrammar };
      })
    );
  }, []);

  // Add custom word
  const addCustomWord = useCallback(
    (customData: Omit<VocabItem, 'id' | 'status' | 'introducedDate' | 'lastReviewedDate' | 'nextReviewDate' | 'repetitionCount' | 'intervalDays' | 'easeFactor' | 'successfulAttempts' | 'failedAttempts' | 'reviewHistory'>) => {
      const newItem: VocabItem = {
        ...customData,
        id: `custom-${Date.now()}`,
        status: 'introduced',
        introducedDate: settings.currentSimulatedDate,
        lastReviewedDate: null,
        nextReviewDate: settings.currentSimulatedDate,
        repetitionCount: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        successfulAttempts: 0,
        failedAttempts: 0,
        reviewHistory: [],
        isCustom: true,
      };

      setItems((prev) => [newItem, ...prev]);
      setStats((prev) => ({
        ...prev,
        totalWordsIntroduced: prev.totalWordsIntroduced + 1,
      }));
      return newItem;
    },
    [settings.currentSimulatedDate]
  );

  // Resolve mistake
  const resolveMistake = useCallback((mistakeId: string) => {
    setMistakes((prev) =>
      prev.map((m) => (m.id === mistakeId ? { ...m, resolved: true } : m))
    );
  }, []);

  // Delete mistake
  const deleteMistake = useCallback((mistakeId: string) => {
    setMistakes((prev) => prev.filter((m) => m.id !== mistakeId));
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Advance simulated date
  const advanceSimulatedDate = useCallback((days: number = 1) => {
    setSettings((prev) => {
      const nextDate = addDays(prev.currentSimulatedDate, days);
      return {
        ...prev,
        currentSimulatedDate: nextDate,
      };
    });
    // Clear daily session for new day
    setDailySession(null);
  }, []);

  // Reset simulated date to actual today
  const resetSimulatedDate = useCallback(() => {
    const today = formatDate(new Date());
    setSettings((prev) => ({
      ...prev,
      currentSimulatedDate: today,
    }));
    setDailySession(null);
  }, []);

  // Start daily session
  const startDailySession = useCallback((): DailySessionState => {
    // Check if one exists for current simulated date
    if (dailySession && dailySession.date === settings.currentSimulatedDate) {
      return dailySession;
    }

    // Auto introduce daily words if not introduced yet
    const newWords = introduceNextDailyItems(settings.dailyTarget);
    const newWordIds = newWords.map((w) => w.id);

    const newSession: DailySessionState = {
      date: settings.currentSimulatedDate,
      completed: false,
      stage: 'quick_review',
      stageIndex: 0,
      newWordIds,
      reviewedWordIds: [],
      correctCount: 0,
      incorrectCount: 0,
      startTime: Date.now(),
      timeSpentSeconds: 0,
    };

    setDailySession(newSession);
    return newSession;
  }, [dailySession, settings.currentSimulatedDate, settings.dailyTarget, introduceNextDailyItems]);

  // Advance stage
  const advanceSessionStage = useCallback((stage: SessionStage) => {
    setDailySession((prev) => {
      if (!prev) return null;
      const stageOrder: SessionStage[] = [
        'quick_review',
        'new_word',
        'comprehension',
        'active_recall',
        'sentence_production',
        'cumulative_practice',
        'conversation',
        'summary',
      ];
      const nextIndex = stageOrder.indexOf(stage);
      return {
        ...prev,
        stage,
        stageIndex: nextIndex >= 0 ? nextIndex : prev.stageIndex + 1,
      };
    });
  }, []);

  // Complete daily session
  const completeDailySession = useCallback(() => {
    setDailySession((prev) => {
      if (!prev) return null;
      const elapsed = Math.round((Date.now() - prev.startTime) / 1000);
      return {
        ...prev,
        completed: true,
        stage: 'summary',
        stageIndex: 7,
        timeSpentSeconds: elapsed,
      };
    });

    // Update streak and completion dates
    setSettings((prev) => {
      if (prev.completedDates.includes(prev.currentSimulatedDate)) return prev;
      return {
        ...prev,
        completedDates: [...prev.completedDates, prev.currentSimulatedDate],
      };
    });

    setStats((prev) => {
      const newStreak = prev.currentStreak + 1;
      return {
        ...prev,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        sessionsCompleted: prev.sessionsCompleted + 1,
        totalStudyTimeSeconds: prev.totalStudyTimeSeconds + 600,
      };
    });
  }, []);

  // Reset to initial demo data
  const resetToInitialData = useCallback(() => {
    localStorage.clear();
    setItems(INITIAL_VOCABULARY);
    setSettings(DEFAULT_SETTINGS);
    setMistakes([]);
    setStats(DEFAULT_STATS);
    setDailySession(null);
  }, []);

  // Export as JSON
  const exportDataAsJson = useCallback(() => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      items,
      settings,
      mistakes,
      stats,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parler-french-backup-${settings.currentSimulatedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items, settings, mistakes, stats]);

  // Export as CSV
  const exportDataAsCsv = useCallback(() => {
    const headers = [
      'French',
      'English',
      'Part of Speech',
      'Gender',
      'Register',
      'Difficulty',
      'Category',
      'Status',
      'Interval (Days)',
      'Success Attempts',
      'Failed Attempts',
      'Next Review',
    ];
    const rows = items.map((i) => [
      `"${i.french.replace(/"/g, '""')}"`,
      `"${i.english.replace(/"/g, '""')}"`,
      `"${i.partOfSpeech}"`,
      `"${i.gender}"`,
      `"${i.register}"`,
      `"${i.difficulty}"`,
      `"${i.category}"`,
      `"${i.status}"`,
      i.intervalDays,
      i.successfulAttempts,
      i.failedAttempts,
      `"${i.nextReviewDate || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parler-french-vocab-${settings.currentSimulatedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items, settings.currentSimulatedDate]);

  // Import JSON
  const importDataFromJson = useCallback((jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data.items)) {
        return { success: false, error: 'Invalid backup file: "items" array missing.' };
      }
      setItems(data.items);
      if (data.settings) setSettings(data.settings);
      if (data.mistakes) setMistakes(data.mistakes);
      if (data.stats) setStats(data.stats);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to parse JSON backup.' };
    }
  }, []);

  return (
    <VocabContext.Provider
      value={{
        items,
        settings,
        mistakes,
        stats,
        dailySession,
        dueItems,
        activeItems,
        masteredItems,
        strugglingItems,
        unintroducedItems,
        todaysNewWord,
        recordReview,
        introduceNextDailyItems,
        reintroduceWord,
        toggleSuspendWord,
        toggleStarWord,
        updateWordNotes,
        toggleFlagGrammar,
        addCustomWord,
        resolveMistake,
        deleteMistake,
        updateSettings,
        advanceSimulatedDate,
        resetSimulatedDate,
        startDailySession,
        advanceSessionStage,
        completeDailySession,
        resetToInitialData,
        exportDataAsJson,
        exportDataAsCsv,
        importDataFromJson,
      }}
    >
      {children}
    </VocabContext.Provider>
  );
};

export const useVocab = () => {
  const context = useContext(VocabContext);
  if (!context) {
    throw new Error('useVocab must be used within a VocabProvider');
  }
  return context;
};
