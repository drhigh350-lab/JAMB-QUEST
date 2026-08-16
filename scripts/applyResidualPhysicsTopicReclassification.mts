import { and, eq, inArray } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const report = JSON.parse(await readFile("reports/residual_physics_topic_reclassification.json", "utf8")) as { results: Array<{ id: number; topic: string | null; confidence: string; reason: string }> };
const eligible = report.results.filter((result) => result.topic && (result.confidence === "high" || result.confidence === "medium"));
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const ids = eligible.map((result) => result.id);
const rows = ids.length ? await db.select({ id: questionItems.id, subject: questionItems.subject, topic: questionItems.topic, status: questionItems.explanationStatus }).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(and(inArray(questionItems.id, ids), eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "needs_review"), eq(questionItems.subject, "Physics"))) : [];
const current = new Map(rows.map((row) => [row.id, row]));
const receipt: Array<{ id: number; from: string; to: string; confidence: string; status: string; reason: string }> = [];
for (const result of eligible) {
  const row = current.get(result.id);
  if (!row) {
    receipt.push({ id: result.id, from: "missing", to: result.topic!, confidence: result.confidence, status: "skipped", reason: "not an active Physics needs-review row" });
    continue;
  }
  await db.update(questionItems).set({ topic: result.topic! }).where(and(eq(questionItems.id, result.id), eq(questionItems.subject, "Physics"), eq(questionItems.explanationStatus, "needs_review")));
  receipt.push({ id: result.id, from: row.topic, to: result.topic!, confidence: result.confidence, status: "updated", reason: result.reason });
}
const output = { input: report.results.length, eligible: eligible.length, updated: receipt.filter((row) => row.status === "updated").length, skipped: receipt.filter((row) => row.status === "skipped").length, receipt };
await writeFile("reports/residual_physics_topic_reclassification_receipt.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({ input: output.input, eligible: output.eligible, updated: output.updated, skipped: output.skipped }, null, 2));
