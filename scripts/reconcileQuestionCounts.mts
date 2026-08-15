import { and, eq } from "drizzle-orm";
import { writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb, getPlayableAuthorisedQuestions } from "../server/db";

const db = await getDb();
if (!db) throw new Error("Database is unavailable.");
const rows = await db.select({
  questionId: questionItems.id,
  subject: questionItems.subject,
  topic: questionItems.topic,
  explanationStatus: questionItems.explanationStatus,
  sourceId: questionSources.id,
  sourceLabel: questionSources.label,
  sourceType: questionSources.sourceType,
  isActive: questionSources.isActive,
}).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id));
const playable = await getPlayableAuthorisedQuestions();
const active = rows.filter((row) => row.isActive === 1);
const approved = active.filter((row) => row.explanationStatus === "approved");
const bySource = Object.entries(active.reduce<Record<string, { stored: number; approved: number }>>((out, row) => {
  const item = out[row.sourceLabel] ?? { stored: 0, approved: 0 };
  item.stored += 1;
  if (row.explanationStatus === "approved") item.approved += 1;
  out[row.sourceLabel] = item;
  return out;
}, {})).map(([sourceLabel, counts]) => ({ sourceLabel, ...counts }));
const report = {
  generatedAt: new Date().toISOString(),
  modelBankExpected: 1000,
  authorisedStoredAllSources: rows.length,
  authorisedActiveStored: active.length,
  authorisedActiveApproved: approved.length,
  authorisedQualityGatedPlayable: playable.length,
  expectedCombinedIfAllApproved: 1000 + approved.length,
  expectedCombinedQualityGated: 1000 + playable.length,
  bySource,
};
await writeFile("/home/ubuntu/jamb-quiz-game/reports/question_count_reconciliation.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
