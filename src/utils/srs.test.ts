/**
 * Automated Verification Suite for SM-2 Review Scheduler & Vocabulary Accumulation
 * Tests core spaced repetition rules, ratings, mastery criteria, and reintroduction.
 */

import {
  calculateNextReview,
  isDue,
  isMastered,
  isStruggling,
  reintroduceItem,
  addDays,
} from './srs.ts';
import { VocabItem } from '../types';

function createMockItem(overrides: Partial<VocabItem> = {}): VocabItem {
  return {
    id: 'test-1',
    french: 'avoir hâte de',
    english: 'to look forward to',
    partOfSpeech: 'expression',
    gender: 'feminine',
    plural: null,
    pronunciation: '/a.vwaʁ ɑt də/',
    exampleFr: 'J\'ai hâte de te voir.',
    exampleEn: 'I look forward to seeing you.',
    context: 'Everyday anticipation.',
    register: 'neutral',
    collocations: [],
    difficulty: 'A2',
    category: 'Émotions & Réactions',
    status: 'learning',
    introducedDate: '2026-10-20',
    lastReviewedDate: '2026-10-20',
    nextReviewDate: '2026-10-21',
    repetitionCount: 1,
    intervalDays: 1,
    easeFactor: 2.5,
    successfulAttempts: 1,
    failedAttempts: 0,
    reviewHistory: [],
    ...overrides,
  };
}

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    console.error(`❌ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

console.log('--- RUNNING SPACING REPETITION SCHEDULER TESTS ---');

// 1. Test "Again" rating resets repetition count to 0 and schedules next review for tomorrow (interval = 1)
{
  const item = createMockItem({ repetitionCount: 3, intervalDays: 10, easeFactor: 2.5 });
  const res = calculateNextReview(item, 'again', '2026-10-25');
  assert(res.repetitionCount === 0, 'Rating "again" resets repetitions to 0');
  assert(res.intervalDays === 1, 'Rating "again" sets interval to 1 day');
  assert(res.nextReviewDate === '2026-10-26', 'Rating "again" schedules review for tomorrow');
  assert(res.easeFactor < 2.5, 'Rating "again" reduces ease factor');
}

// 2. Test "Good" rating increases interval and repetition count
{
  const item = createMockItem({ repetitionCount: 1, intervalDays: 1, easeFactor: 2.5 });
  const res = calculateNextReview(item, 'good', '2026-10-25');
  assert(res.repetitionCount === 2, 'Rating "good" increments repetition count to 2');
  assert(res.intervalDays === 3, 'Second successful review sets interval to 3 days');
  assert(res.nextReviewDate === '2026-10-28', 'Next review correctly scheduled +3 days');
}

// 3. Test "Easy" rating applies bonus factor
{
  const item = createMockItem({ repetitionCount: 2, intervalDays: 6, easeFactor: 2.5 });
  const res = calculateNextReview(item, 'easy', '2026-10-25');
  assert(res.repetitionCount === 3, 'Rating "easy" increments repetition count');
  assert(res.intervalDays > 6 * 2.5, 'Rating "easy" multiplies interval by easeFactor and easy bonus');
  assert(res.easeFactor > 2.5, 'Rating "easy" increases ease factor');
}

// 4. Test "Due" evaluation logic
{
  const itemDue = createMockItem({ nextReviewDate: '2026-10-25' });
  const itemNotDue = createMockItem({ nextReviewDate: '2026-10-28' });
  const itemUnintroduced = createMockItem({ status: 'unintroduced', nextReviewDate: null });

  assert(isDue(itemDue, '2026-10-25') === true, 'Item with review date <= today is due');
  assert(isDue(itemNotDue, '2026-10-25') === false, 'Item with review date in future is not due');
  assert(isDue(itemUnintroduced, '2026-10-25') === false, 'Unintroduced item is never due');
}

// 5. Test explicit Mastery criteria
{
  const notMastered1 = createMockItem({ repetitionCount: 2, intervalDays: 14 });
  const notMastered2 = createMockItem({ repetitionCount: 4, intervalDays: 10 }); // interval too short
  const masteredItem = createMockItem({
    repetitionCount: 4,
    intervalDays: 24,
    successfulAttempts: 5,
    failedAttempts: 0,
  });

  assert(isMastered(notMastered1) === false, 'Item with only 2 repetitions is not mastered');
  assert(isMastered(notMastered2) === false, 'Item with interval < 21 days is not mastered');
  assert(isMastered(masteredItem) === true, 'Item with >=4 repetitions and interval >=21 days is mastered');
}

// 6. Test Struggling detection
{
  const healthyItem = createMockItem({ successfulAttempts: 5, failedAttempts: 0 });
  const strugglingItem = createMockItem({ successfulAttempts: 1, failedAttempts: 3 });

  assert(isStruggling(healthyItem) === false, 'Healthy item is not flagged as struggling');
  assert(isStruggling(strugglingItem) === true, 'Item with failedAttempts > successfulAttempts is struggling');
}

// 7. Test Deliberate Reintroduction
{
  const forgottenItem = createMockItem({
    status: 'learning',
    repetitionCount: 4,
    intervalDays: 30,
    isStruggling: true,
  });
  const reintro = reintroduceItem(forgottenItem, '2026-10-25');
  assert(reintro.repetitionCount === 0, 'Reintroduced item resets repetition count');
  assert(reintro.intervalDays === 1, 'Reintroduced item resets interval to 1');
  assert(reintro.nextReviewDate === '2026-10-26', 'Reintroduced item scheduled for tomorrow');
  assert(reintro.isStruggling === false, 'Reintroduced item clears struggling flag');
}

console.log(`\nResults: ${passed} / ${total} tests passed.`);
if (passed === total) {
  console.log('🎉 All scheduler tests passed successfully!');
}
