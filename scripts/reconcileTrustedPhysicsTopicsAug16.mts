import { and, eq, inArray } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { isOfficialSyllabusTopic } from "../shared/syllabusTopicMap";

type StagedRecord = {
  externalId: string;
  subject: "Physics" | "Use of English";
  topic: string;
  question: string;
};

const physicsLabel = "JAMB Quest Physics Bank · Trusted owner Markdown · August 2026";
const staged = JSON.parse(await readFile("/home/ubuntu/jamb-import-staging/trusted_physics_english_aug16.staged.json", "utf8")) as StagedRecord[];
const expected = new Map(staged.filter((record) => record.subject === "Physics").map((record) => [record.externalId, record]));
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const [source] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, physicsLabel)).limit(1);
if (!source) throw new Error("Trusted Physics source not found");

const stored = await db
  .select({ id: questionItems.id, externalId: questionItems.externalId, subject: questionItems.subject, topic: questionItems.topic, questionText: questionItems.questionText })
  .from(questionItems)
  .where(and(eq(questionItems.sourceId, source.id), inArray(questionItems.externalId, [...expected.keys()])));

const updated: Array<{ externalId: string; from: string; to: string }> = [];
const skipped: Array<{ externalId: string; reason: string }> = [];
for (const row of stored) {
  const record = expected.get(row.externalId);
  if (!record) {
    skipped.push({ externalId: row.externalId, reason: "not present in current staged source" });
    continue;
  }
  if (row.subject !== "Physics" || row.questionText !== record.question) {
    skipped.push({ externalId: row.externalId, reason: "stored record no longer matches staged source" });
    continue;
  }
  if (!isOfficialSyllabusTopic("Physics", record.topic)) {
    skipped.push({ externalId: row.externalId, reason: "staged topic is not an official Physics area" });
    continue;
  }
  if (row.topic === record.topic) continue;
  const result = await db.update(questionItems).set({ topic: record.topic }).where(and(eq(questionItems.id, row.id), eq(questionItems.topic, row.topic)));
  if (result[0].affectedRows !== 1) {
    skipped.push({ externalId: row.externalId, reason: "guarded topic update did not affect one row" });
    continue;
  }
  updated.push({ externalId: row.externalId, from: row.topic, to: record.topic });
}

const receipt = { sourceId: source.id, storedTrustedPhysicsRows: stored.length, updatedCount: updated.length, skipped, updated };
await writeFile("reports/trusted_physics_aug16_topic_reconciliation.json", JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify({ sourceId: receipt.sourceId, storedTrustedPhysicsRows: receipt.storedTrustedPhysicsRows, updatedCount: receipt.updatedCount, skippedCount: receipt.skipped.length }, null, 2));
