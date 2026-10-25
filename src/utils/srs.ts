import { VocabItem, RecallRating, ReviewRecord } from '../types';

/**
 * Add days to a YYYY-MM-DD date string
 */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculate difference in days between two YYYY-MM-DD date strings
 */
export function daysBetween(dateA: string, dateB: string): number {
  const [y1, m1, d1] = dateA.split('-').map(Number);
  const [y2, m2, d2] = dateB.split('-').map(Number);
  const t1 = new Date(y1, m1 - 1, d1).getTime();
  const t2 = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

/**
 * Check if a vocabulary item is due for review on or before targetDate
 */
export function isDue(item: VocabItem, targetDate: string): boolean {
  if (item.status === 'unintroduced' || item.status === 'suspended') {
    return false;
  }
  if (!item.nextReviewDate) {
    return true;
  }
  return item.nextReviewDate <= targetDate;
}

/**
 * Explicit definition of "Mastered":
 * Requires at least 4 successful consecutive reviews AND interval >= 21 days
 * AND an overall accuracy of at least 80%.
 */
export function isMastered(item: VocabItem): boolean {
  const total = item.successfulAttempts + item.failedAttempts;
  const accuracy = total > 0 ? item.successfulAttempts / total : 0;
  return item.repetitionCount >= 4 && item.intervalDays >= 21 && accuracy >= 0.8;
}

/**
 * Check if an item is struggling / needs reinforcement
 */
export function isStruggling(item: VocabItem): boolean {
  if (item.status === 'unintroduced' || item.status === 'suspended') return false;
  if (item.failedAttempts >= 2 && item.successfulAttempts <= item.failedAttempts) return true;
  
  // Last two reviews were failures
  if (item.reviewHistory.length >= 2) {
    const lastTwo = item.reviewHistory.slice(-2);
    if (lastTwo.every((r) => !r.wasCorrect || r.rating === 'again')) {
      return true;
    }
  }
  return false;
}

/**
 * SM-2 Spaced Repetition Scheduling Algorithm
 */
export function calculateNextReview(
  item: VocabItem,
  rating: RecallRating,
  currentDate: string,
  exerciseType: string = 'review'
): {
  nextReviewDate: string;
  intervalDays: number;
  repetitionCount: number;
  easeFactor: number;
  reviewRecord: ReviewRecord;
  status: VocabItem['status'];
  isStrugglingItem: boolean;
} {
  let repetitions = item.repetitionCount;
  let interval = item.intervalDays;
  let easeFactor = item.easeFactor || 2.5;
  const wasCorrect = rating !== 'again';

  if (rating === 'again') {
    // Failure to recall: reset repetitions, review tomorrow, decrease ease factor
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (rating === 'hard') {
    // Recalled with significant difficulty
    repetitions = repetitions === 0 ? 1 : repetitions;
    interval = Math.max(1, Math.round(interval * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (rating === 'good') {
    // Recalled correctly
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 3;
    } else {
      interval = Math.max(1, Math.round(interval * easeFactor));
    }
    repetitions += 1;
    // Standard SM-2 EF formula for quality = 4
    easeFactor = Math.max(1.3, easeFactor + 0.05);
  } else if (rating === 'easy') {
    // Recalled immediately
    if (repetitions === 0) {
      interval = 2;
    } else if (repetitions === 1) {
      interval = 5;
    } else {
      interval = Math.max(1, Math.round(interval * easeFactor * 1.3));
    }
    repetitions += 1;
    easeFactor = Math.min(3.0, easeFactor + 0.15);
  }

  const nextReviewDate = addDays(currentDate, interval);

  const reviewRecord: ReviewRecord = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    date: currentDate,
    rating,
    exerciseType,
    wasCorrect,
    intervalDaysAfter: interval,
  };

  // Determine updated status
  const tempItem: VocabItem = {
    ...item,
    repetitionCount: repetitions,
    intervalDays: interval,
    successfulAttempts: item.successfulAttempts + (wasCorrect ? 1 : 0),
    failedAttempts: item.failedAttempts + (wasCorrect ? 0 : 1),
    reviewHistory: [...item.reviewHistory, reviewRecord],
  };

  let newStatus: VocabItem['status'] = 'learning';
  if (isMastered(tempItem)) {
    newStatus = 'mastered';
  }

  const struggling = isStruggling(tempItem);

  return {
    nextReviewDate,
    intervalDays: interval,
    repetitionCount: repetitions,
    easeFactor: Number(easeFactor.toFixed(2)),
    reviewRecord,
    status: newStatus,
    isStrugglingItem: struggling,
  };
}

/**
 * Reintroduce an item deliberately as a new learning cycle
 */
export function reintroduceItem(item: VocabItem, currentDate: string): Partial<VocabItem> {
  return {
    status: 'learning',
    introducedDate: currentDate,
    nextReviewDate: addDays(currentDate, 1),
    repetitionCount: 0,
    intervalDays: 1,
    easeFactor: 2.5,
    isStruggling: false,
  };
}

/**
 * Format interval into human readable French
 */
export function formatInterval(days: number): string {
  if (days <= 1) return 'demain';
  if (days < 7) return `dans ${days} jours`;
  if (days === 7) return 'dans 1 semaine';
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return `dans ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
  const months = Math.round(days / 30);
  return `dans ${months} mois`;
}
