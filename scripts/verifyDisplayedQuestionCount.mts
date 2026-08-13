import { and, eq, sql } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const modelBankUrl = "/manus-storage/jamb_high_yield_practice_bank_1000_biology_batches_1_5_759ba726.json";
const db = await getDb();
if (!db) throw new Error("Managed database is unavailable");
const [{ approvedAuthorisedCount }] = await db.select({ approvedAuthorisedCount: sql<number>`count(*)` })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.isActive, 1), eq(questionSources.sourceType, "authorised"), eq(questionItems.explanationStatus, "approved")));
const response = await fetch(new URL(modelBankUrl, baseUrl), { signal: AbortSignal.timeout(15_000) });
if (!response.ok) throw new Error(`Model bank fetch failed: ${response.status}`);
const payload = await response.json() as { questions?: unknown[] };
const modelCount = Array.isArray(payload.questions) ? payload.questions.length : 0;
if (modelCount !== 1_000) throw new Error(`Expected 1,000 model questions; received ${modelCount}`);
const expectedDisplayedQuestionCount = modelCount + Number(approvedAuthorisedCount);
console.log(JSON.stringify({ verified: true, baseUrl, modelBankUrl, modelCount, approvedAuthorisedCount: Number(approvedAuthorisedCount), expectedDisplayedQuestionCount, visualCheck: "The Practice tab is visually checked separately against expectedDisplayedQuestionCount." }, null, 2));
process.exit(0);
