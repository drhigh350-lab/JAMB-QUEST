import { and, eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";
import { isOfficialSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

type Mapping = {
  id: number;
  externalId: string;
  subject: string;
  currentTopic: string;
  suggestedTopic: string | null;
  confidence: "high" | "medium" | "hold";
  reason: string;
};

const raw = JSON.parse(await readFile("reports/unmapped_authorised_topic_classification.json", "utf8")) as { records: Mapping[] };
const mappings = raw.records.filter((record) => record.suggestedTopic !== null);
const db = await getDb();
if (!db) throw new Error("Database unavailable");

const applied: Array<Pick<Mapping, "id" | "externalId" | "subject" | "currentTopic" | "suggestedTopic" | "confidence">> = [];
const skipped: Array<Pick<Mapping, "id" | "externalId" | "subject" | "currentTopic" | "suggestedTopic" | "confidence"> & { reason: string }> = [];

for (const mapping of mappings) {
  if (!isOfficialSyllabusTopic(mapping.subject as SyllabusSubject, mapping.suggestedTopic!)) {
    skipped.push({ ...mapping, reason: "suggested topic is not official for subject" });
    continue;
  }
  const current = await db
    .select({ id: questionItems.id, subject: questionItems.subject, topic: questionItems.topic })
    .from(questionItems)
    .where(eq(questionItems.id, mapping.id))
    .limit(1);
  const row = current[0];
  if (!row) {
    skipped.push({ ...mapping, reason: "row no longer exists" });
    continue;
  }
  if (row.subject !== mapping.subject || row.topic !== mapping.currentTopic) {
    skipped.push({ ...mapping, reason: "stored subject or topic changed since classification" });
    continue;
  }
  const update = await db
    .update(questionItems)
    .set({ topic: mapping.suggestedTopic! })
    .where(and(eq(questionItems.id, mapping.id), eq(questionItems.subject, mapping.subject), eq(questionItems.topic, mapping.currentTopic)));
  if (update[0].affectedRows !== 1) {
    skipped.push({ ...mapping, reason: "guarded update did not affect exactly one row" });
    continue;
  }
  applied.push({
    id: mapping.id,
    externalId: mapping.externalId,
    subject: mapping.subject,
    currentTopic: mapping.currentTopic,
    suggestedTopic: mapping.suggestedTopic,
    confidence: mapping.confidence,
  });
}

const receipt = {
  inputMappings: mappings.length,
  applied: applied.length,
  skipped: skipped.length,
  bySubject: Object.fromEntries([...new Set(applied.map((record) => record.subject))].sort().map((subject) => [subject, applied.filter((record) => record.subject === subject).length])),
  byConfidence: Object.fromEntries(["high", "medium"].map((confidence) => [confidence, applied.filter((record) => record.confidence === confidence).length])),
  applied,
  skipped,
};
await writeFile("reports/unmapped_authorised_topic_mapping_receipt.json", JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify({
  inputMappings: receipt.inputMappings,
  applied: receipt.applied,
  skipped: receipt.skipped,
  bySubject: receipt.bySubject,
  byConfidence: receipt.byConfidence,
}, null, 2));
