import { and, eq, inArray } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

type Classified = { id: number; subject: SyllabusSubject; topic: string | null; confidence: "high" | "medium" | "hold"; reason: string };
const classification = JSON.parse(await readFile("reports/needs_review_official_topic_classification.json", "utf8")) as { results: Classified[] };
const eligible = classification.results.filter((record) => record.topic && (record.confidence === "high" || record.confidence === "medium"));
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const ids = eligible.map((record) => record.id);
const rows = ids.length ? await db.select({ id: questionItems.id, subject: questionItems.subject, topic: questionItems.topic, status: questionItems.explanationStatus, sourceId: questionItems.sourceId })
  .from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(inArray(questionItems.id, ids), eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "needs_review"))) : [];
const current = new Map(rows.map((row) => [row.id, row]));
const receipt: Array<{ id: number; subject: string; from: string; to: string; confidence: string; status: "updated" | "skipped"; reason: string }> = [];
for (const record of eligible) {
  const row = current.get(record.id);
  if (!row || row.subject !== record.subject) {
    receipt.push({ id: record.id, subject: record.subject, from: row?.topic ?? "missing", to: record.topic!, confidence: record.confidence, status: "skipped", reason: "record changed or is no longer an active needs-review row" });
    continue;
  }
  if (!resolveSyllabusTopic(record.subject, record.topic!)) {
    receipt.push({ id: record.id, subject: record.subject, from: row.topic, to: record.topic!, confidence: record.confidence, status: "skipped", reason: "suggested topic failed local official-map validation" });
    continue;
  }
  await db.update(questionItems).set({ topic: record.topic! }).where(eq(questionItems.id, record.id));
  receipt.push({ id: record.id, subject: record.subject, from: row.topic, to: record.topic!, confidence: record.confidence, status: "updated", reason: record.reason });
}
const report = { input: classification.results.length, eligible: eligible.length, updated: receipt.filter((item) => item.status === "updated").length, skipped: receipt.filter((item) => item.status === "skipped").length, receipt };
await writeFile("reports/needs_review_topic_mapping_receipt.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ input: report.input, eligible: report.eligible, updated: report.updated, skipped: report.skipped }, null, 2));
