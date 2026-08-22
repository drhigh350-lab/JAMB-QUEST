import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { eq, inArray } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const ROOT = "/home/ubuntu/jamb-quiz-game";
const batches = [15, 16, 17] as const;
const auditPaths = batches.map((batch) => `${ROOT}/reports/explanations_batch${batch}_careful_literal_audit.json`);
const gatePath = `${ROOT}/reports/batches15_17_gate_audit.json`;
const receiptPath = `${ROOT}/reports/batches15_17_release_receipt.json`;

type ParsedBatch = { source: string; explanations: Record<string, string> };
type Gate = { eligibleIds: string[]; heldIds: string[]; genericFindings: Array<{ id: string; batch: number; rule: string }> };

const readJson = async <T>(path: string) => JSON.parse(await readFile(path, "utf8")) as T;
const audits = await Promise.all(auditPaths.map((path) => readJson<ParsedBatch>(path)));
const gate = await readJson<Gate>(gatePath);
const supplied = new Map<string, { batch: number; source: string; explanation: string }>();
for (const [index, audit] of audits.entries()) {
  for (const [id, explanation] of Object.entries(audit.explanations)) {
    if (supplied.has(id)) throw new Error(`Duplicate supplied ID: ${id}`);
    supplied.set(id, { batch: batches[index], source: audit.source, explanation });
  }
}

const eligible = gate.eligibleIds.map((id) => {
  const entry = supplied.get(id);
  if (!entry) throw new Error(`Gate ID is not present in parsed source: ${id}`);
  if (!/^authorised-\d+$/.test(id)) throw new Error(`Unexpected non-authorised ID: ${id}`);
  return { id, numericId: Number(id.replace(/^authorised-/, "")), ...entry };
});
if (eligible.length !== 11) throw new Error(`Expected exactly 11 gate-cleared records, found ${eligible.length}`);

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const existing = await db.select({
  id: questionItems.id,
  questionText: questionItems.questionText,
  optionsJson: questionItems.optionsJson,
  answerIndex: questionItems.answerIndex,
  topic: questionItems.topic,
  diagramUrl: questionItems.diagramUrl,
  explanation: questionItems.explanation,
}).from(questionItems).where(inArray(questionItems.id, eligible.map((entry) => entry.numericId)));
if (existing.length !== eligible.length) throw new Error(`Database mapping mismatch: expected ${eligible.length}, found ${existing.length}`);

for (const entry of eligible) {
  await db.update(questionItems)
    .set({ explanation: entry.explanation, explanationStatus: "approved" })
    .where(eq(questionItems.id, entry.numericId));
}

const receipt = {
  sources: audits.map((audit) => audit.source),
  parsedAsInertLiteralData: true,
  suppliedRecords: supplied.size,
  authorisedQuestionsUpdated: eligible.length,
  heldByQualityGate: gate.heldIds.length,
  heldGenericFindingCount: gate.genericFindings.length,
  updatedRecords: eligible.map(({ id, batch, source, explanation }) => ({
    id,
    batch,
    source,
    explanationSha256: createHash("sha256").update(explanation).digest("hex"),
  })),
  protectedFieldsPreserved: ["questionText", "optionsJson", "answerIndex", "topic", "diagramUrl", "source metadata"],
  updatedFields: ["explanation", "explanationStatus"],
  note: "Only the eleven explanations that passed the Batch 15–17 structural, formatting, non-generic-text, database-mapping, and question-specific answer review gates were released. All other supplied explanations remain held unchanged.",
};
await writeFile(receiptPath, JSON.stringify(receipt, null, 2), "utf8");
console.log(JSON.stringify(receipt, null, 2));
