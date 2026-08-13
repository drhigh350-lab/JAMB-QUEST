/* Field Notes Arcade: progress is a quiet paper ledger in local storage, never a blocking login wall. */

import type { AnswerRecord, BankQuestion, RoundConfig, StoredProgress } from "./types";

const STORAGE_KEY = "jamb-quest-progress-v1";

const EMPTY_PROGRESS: StoredProgress = {
  totalAnswered: 0,
  totalCorrect: 0,
  bestScore: 0,
  lastScore: 0,
  roundsPlayed: 0,
  wrongIds: [],
  subjectBest: {},
};

export function getProgress(): StoredProgress {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;
    return { ...EMPTY_PROGRESS, ...JSON.parse(raw) } as StoredProgress;
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(progress: StoredProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function recordRound(
  progress: StoredProgress,
  config: RoundConfig,
  questions: BankQuestion[],
  answers: Record<string, AnswerRecord>,
  score: number,
): StoredProgress {
  const roundAnswers = questions.map((question) => answers[question.id]).filter(Boolean);
  const correct = roundAnswers.filter((answer) => answer.correct).length;
  const newWrongIds = questions.filter((question) => answers[question.id] && !answers[question.id].correct).map((question) => question.id);
  const subjectBest = { ...progress.subjectBest };
  if (config.subject !== "Full JAMB Mock") {
    subjectBest[config.subject] = Math.max(subjectBest[config.subject] ?? 0, score);
  }
  return {
    totalAnswered: progress.totalAnswered + roundAnswers.length,
    totalCorrect: progress.totalCorrect + correct,
    bestScore: Math.max(progress.bestScore, score),
    lastScore: score,
    roundsPlayed: progress.roundsPlayed + 1,
    wrongIds: Array.from(new Set([...progress.wrongIds, ...newWrongIds])).slice(-80),
    subjectBest,
  };
}
