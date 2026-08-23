import type { Subject } from "./types";

export const REVISION_RETURN_QUEUE_KEY = "jambQuest.revisionReturnQueue.v1";
const VERSION = 1;
const SUBJECTS: Subject[] = ["Use of English", "Biology", "Chemistry", "Physics"];
export type RevisionReturnItem = { id: string; createdAt: number; dueAt: number; subject: Subject; topic: string; questionIds: string[]; reason: "syllabus-quiz" };
export type RevisionReturnQueue = { version: number; items: RevisionReturnItem[] };
const empty = (): RevisionReturnQueue => ({ version: VERSION, items: [] });
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const safeTime = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : null;

export function parseRevisionReturnQueue(raw: string | null | undefined): RevisionReturnQueue {
  if (!raw) return empty();
  try {
    const source = JSON.parse(raw);
    if (!isObject(source) || source.version !== VERSION || !Array.isArray(source.items)) return empty();
    const items = source.items.slice(0, 60).flatMap((value) => {
      if (!isObject(value) || typeof value.id !== "string" || !SUBJECTS.includes(value.subject as Subject) || typeof value.topic !== "string") return [];
      const createdAt = safeTime(value.createdAt); const dueAt = safeTime(value.dueAt);
      const questionIds = Array.isArray(value.questionIds) ? Array.from(new Set(value.questionIds.filter((id): id is string => typeof id === "string" && id.length > 0).slice(0, 8))) : [];
      if (!createdAt || !dueAt || !questionIds.length || value.reason !== "syllabus-quiz") return [];
      return [{ id: value.id.slice(0, 96), createdAt, dueAt, subject: value.subject as Subject, topic: value.topic.trim().slice(0, 160), questionIds, reason: "syllabus-quiz" as const }];
    });
    return { version: VERSION, items: items.sort((left, right) => left.dueAt - right.dueAt) };
  } catch { return empty(); }
}

export function readRevisionReturnQueue(storage: Pick<Storage, "getItem"> = window.localStorage) { try { return parseRevisionReturnQueue(storage.getItem(REVISION_RETURN_QUEUE_KEY)); } catch { return empty(); } }
export function writeRevisionReturnQueue(queue: RevisionReturnQueue, storage: Pick<Storage, "setItem"> = window.localStorage) { try { storage.setItem(REVISION_RETURN_QUEUE_KEY, JSON.stringify(queue)); } catch { /* optional local feature */ } }
export function scheduleRevisionReturn(queue: RevisionReturnQueue, input: Omit<RevisionReturnItem, "id" | "createdAt" | "dueAt">, days: number, now = Date.now()) {
  const safeDays = [1, 3, 7].includes(days) ? days : 3;
  const dueAt = now + safeDays * 86_400_000;
  const same = queue.items.find((item) => item.subject === input.subject && item.topic === input.topic && item.reason === input.reason && item.questionIds.join("|") === input.questionIds.join("|"));
  const nextItem: RevisionReturnItem = same ? { ...same, dueAt } : { ...input, id: `return-${now}-${Math.random().toString(36).slice(2, 8)}`, createdAt: now, dueAt };
  return { version: VERSION, items: [...queue.items.filter((item) => item.id !== nextItem.id), nextItem].sort((left, right) => left.dueAt - right.dueAt).slice(0, 60) };
}
export function removeRevisionReturn(queue: RevisionReturnQueue, id: string) { return { version: VERSION, items: queue.items.filter((item) => item.id !== id) }; }
export function snoozeRevisionReturn(queue: RevisionReturnQueue, id: string, days: number, now = Date.now()) { return { version: VERSION, items: queue.items.map((item) => item.id === id ? { ...item, dueAt: now + (days === 1 || days === 7 ? days : 3) * 86_400_000 } : item).sort((left, right) => left.dueAt - right.dueAt) }; }
export function returnDueLabel(dueAt: number, now = Date.now()) { const days = Math.ceil((dueAt - now) / 86_400_000); return days <= 0 ? "Due now" : days === 1 ? "Due tomorrow" : `Due in ${days} days`; }
