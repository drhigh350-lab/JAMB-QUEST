import type { BankQuestion, Subject } from "./types";

export const ARCADE_PROFILE_KEY = "jambQuest.gameArcade.v1";
export const ARCADE_PROFILE_VERSION = 2;
export const ARCADE_SUBJECTS: Subject[] = ["Use of English", "Biology", "Chemistry", "Physics"];

export type ExpeditionArcadeState = { stamps: Record<string, number>; routes: string[]; recentQuestionIds: string[] };
export type PresidentsDeskArcadeState = { treasury: number; confidence: number; insight: number; terms: number; projects: Record<"education" | "health" | "energy" | "innovation", number>; recentQuestionIds: string[] };
export type ArchiveBlueprintId = "balanced" | "mastery" | "repair";
export type GreatArchiveArcadeState = { tiles: Record<string, number>; blueprints: Record<ArchiveBlueprintId, number>; restoredWings: string[]; recentQuestionIds: string[] };
export type GameArcadeProfile = { version: number; displayName: string; expedition: ExpeditionArcadeState; presidentsDesk: PresidentsDeskArcadeState; greatArchive: GreatArchiveArcadeState };

export const emptyArcadeProfile = (): GameArcadeProfile => ({
  version: ARCADE_PROFILE_VERSION,
  displayName: "",
  expedition: { stamps: {}, routes: [], recentQuestionIds: [] },
  presidentsDesk: { treasury: 120, confidence: 6, insight: 0, terms: 0, projects: { education: 0, health: 0, energy: 0, innovation: 0 }, recentQuestionIds: [] },
  greatArchive: { tiles: {}, blueprints: { balanced: 0, mastery: 0, repair: 0 }, restoredWings: [], recentQuestionIds: [] },
});

const whole = (value: unknown, fallback: number, maximum: number) => typeof value === "number" && Number.isFinite(value) ? Math.min(maximum, Math.max(0, Math.floor(value))) : fallback;
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
export const cleanArcadeDisplayName = (value: unknown) => typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 24) : "";
const recentIds = (value: unknown) => Array.isArray(value) ? Array.from(new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0).slice(-120))) : [];

export function parseArcadeProfile(raw: string | null | undefined): GameArcadeProfile {
  if (!raw) return emptyArcadeProfile();
  try {
    const source = object(JSON.parse(raw));
    if (source.version !== 1 && source.version !== ARCADE_PROFILE_VERSION) return emptyArcadeProfile();
    const defaults = emptyArcadeProfile();
    const expedition = object(source.expedition);
    const desk = object(source.presidentsDesk);
    const archive = object(source.greatArchive);
    const sourceStamps = object(expedition.stamps);
    const stamps = Object.fromEntries(ARCADE_SUBJECTS.map((subject) => [subject, whole(sourceStamps[subject], 0, 999999)]));
    const routes = Array.isArray(expedition.routes) ? Array.from(new Set(expedition.routes.filter((route): route is string => typeof route === "string" && route.length > 0).slice(0, 500))) : [];
    return {
      version: ARCADE_PROFILE_VERSION,
      displayName: cleanArcadeDisplayName(source.displayName),
      expedition: { stamps, routes, recentQuestionIds: recentIds(expedition.recentQuestionIds) },
      presidentsDesk: {
        treasury: whole(desk.treasury, defaults.presidentsDesk.treasury, 999999),
        confidence: whole(desk.confidence, defaults.presidentsDesk.confidence, 6),
        insight: whole(desk.insight, 0, 999999),
        terms: whole(desk.terms, 0, 999999),
        projects: {
          education: whole(object(desk.projects).education, 0, 12), health: whole(object(desk.projects).health, 0, 12), energy: whole(object(desk.projects).energy, 0, 12), innovation: whole(object(desk.projects).innovation, 0, 12),
        },
        recentQuestionIds: recentIds(desk.recentQuestionIds),
      },
      greatArchive: {
        tiles: Object.fromEntries(Object.entries(object(archive.tiles)).filter(([topic]) => topic.length > 0).slice(0, 1000).map(([topic, count]) => [topic, whole(count, 0, 999999)])),
        blueprints: { balanced: whole(object(archive.blueprints).balanced, 0, 99), mastery: whole(object(archive.blueprints).mastery, 0, 99), repair: whole(object(archive.blueprints).repair, 0, 99) },
        restoredWings: Array.isArray(archive.restoredWings) ? Array.from(new Set(archive.restoredWings.filter((wing): wing is string => typeof wing === "string" && wing.length > 0).slice(0, 200))) : [],
        recentQuestionIds: recentIds(archive.recentQuestionIds),
      },
    };
  } catch { return emptyArcadeProfile(); }
}

export function readArcadeProfile(storage: Pick<Storage, "getItem"> = window.localStorage): GameArcadeProfile {
  try { return parseArcadeProfile(storage.getItem(ARCADE_PROFILE_KEY)); } catch { return emptyArcadeProfile(); }
}

export function writeArcadeProfile(profile: GameArcadeProfile, storage: Pick<Storage, "setItem"> = window.localStorage) {
  try { storage.setItem(ARCADE_PROFILE_KEY, JSON.stringify(profile)); } catch { /* progression remains optional when local storage is unavailable */ }
}

export function selectArcadeQuestions(questions: BankQuestion[], subject: Subject, count: number, priorQuestionIds: string[] = []) {
  const eligible = questions.filter((question) => question.subject === subject);
  const prior = new Set(priorQuestionIds);
  const unseen = eligible.filter((question) => !prior.has(question.id));
  const pool = unseen.length >= count ? unseen : eligible;
  const shuffled = [...pool];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]];
  }
  return shuffled.slice(0, Math.max(0, count));
}
