import type { BankQuestion, Subject } from "./types";

export const SYLLABUS_JOURNEY_KEY = "jambQuest.syllabusJourney.v1";
const VERSION = 1;
export type SyllabusJourneyEntry = { readAt: number | null; quizAttempts: number; bestScore: number; lastScore: number; recentQuestionIds: string[] };
export type SyllabusJourneyProfile = { version: number; entries: Record<string, SyllabusJourneyEntry> };

const emptyEntry = (): SyllabusJourneyEntry => ({ readAt: null, quizAttempts: 0, bestScore: 0, lastScore: 0, recentQuestionIds: [] });
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const whole = (value: unknown, maximum: number) => typeof value === "number" && Number.isFinite(value) ? Math.min(maximum, Math.max(0, Math.floor(value))) : 0;
export const syllabusJourneyKey = (subject: Subject, topic: string) => `${subject}::${topic}`;

export function parseSyllabusJourney(raw: string | null | undefined): SyllabusJourneyProfile {
  if (!raw) return { version: VERSION, entries: {} };
  try {
    const source = JSON.parse(raw);
    if (!isObject(source) || source.version !== VERSION || !isObject(source.entries)) return { version: VERSION, entries: {} };
    const entries = Object.fromEntries(Object.entries(source.entries).slice(0, 500).flatMap(([key, value]) => {
      if (!isObject(value) || !key.includes("::")) return [];
      const readAt = typeof value.readAt === "number" && Number.isFinite(value.readAt) && value.readAt > 0 ? Math.floor(value.readAt) : null;
      const recentQuestionIds = Array.isArray(value.recentQuestionIds) ? Array.from(new Set(value.recentQuestionIds.filter((id): id is string => typeof id === "string" && id.length > 0).slice(-80))) : [];
      return [[key, { readAt, quizAttempts: whole(value.quizAttempts, 9999), bestScore: whole(value.bestScore, 100), lastScore: whole(value.lastScore, 100), recentQuestionIds }]];
    }));
    return { version: VERSION, entries };
  } catch { return { version: VERSION, entries: {} }; }
}

export function readSyllabusJourney(storage: Pick<Storage, "getItem"> = window.localStorage) {
  try { return parseSyllabusJourney(storage.getItem(SYLLABUS_JOURNEY_KEY)); } catch { return { version: VERSION, entries: {} }; }
}

export function writeSyllabusJourney(profile: SyllabusJourneyProfile, storage: Pick<Storage, "setItem"> = window.localStorage) {
  try { storage.setItem(SYLLABUS_JOURNEY_KEY, JSON.stringify(profile)); } catch { /* the journey stays optional when device storage is unavailable */ }
}

export function entryFor(profile: SyllabusJourneyProfile, subject: Subject, topic: string) {
  return profile.entries[syllabusJourneyKey(subject, topic)] ?? emptyEntry();
}

export function confirmSyllabusRead(profile: SyllabusJourneyProfile, subject: Subject, topic: string) {
  const key = syllabusJourneyKey(subject, topic);
  return { ...profile, entries: { ...profile.entries, [key]: { ...entryFor(profile, subject, topic), readAt: Date.now() } } };
}

export function recordSyllabusQuiz(profile: SyllabusJourneyProfile, subject: Subject, topic: string, score: number, questionIds: string[]) {
  const key = syllabusJourneyKey(subject, topic);
  const previous = entryFor(profile, subject, topic);
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));
  return { ...profile, entries: { ...profile.entries, [key]: { ...previous, quizAttempts: previous.quizAttempts + 1, bestScore: Math.max(previous.bestScore, safeScore), lastScore: safeScore, recentQuestionIds: [...previous.recentQuestionIds, ...questionIds].slice(-80) } } };
}

export function selectSyllabusJourneyQuiz(questions: BankQuestion[], subject: Subject, topic: string, count: number, priorQuestionIds: string[] = []) {
  const eligible = questions.filter((question) => question.subject === subject && question.topic === topic);
  const prior = new Set(priorQuestionIds);
  const unseen = eligible.filter((question) => !prior.has(question.id));
  const pool = unseen.length >= count ? unseen : eligible;
  const shuffled = [...pool];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const next = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[next]] = [shuffled[next], shuffled[index]];
  }
  return shuffled.slice(0, Math.min(Math.max(0, count), shuffled.length));
}
