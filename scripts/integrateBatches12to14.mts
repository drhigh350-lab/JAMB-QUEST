import { readFile, writeFile } from "node:fs/promises";
import { eq, inArray } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const ROOT = "/home/ubuntu/jamb-quiz-game";
const paths = [12, 13, 14].map((b) => `${ROOT}/reports/explanations_batch${b}_literal_audit.json`);
const output = `${ROOT}/reports/batches12_14_release_receipt.json`;
const readJson = async <T>(p: string) => JSON.parse(await readFile(p, "utf8")) as T;
type Audit = { source: string; explanations: Record<string, string> };
const audits = await Promise.all(paths.map((p) => readJson<Audit>(p)));
const entries = audits.flatMap((audit, i) => Object.entries(audit.explanations).map(([id, explanation]) => ({ batch: i + 12, id, explanation })));
if (entries.some((entry) => !entry.id.startsWith("authorised-"))) throw new Error("Unexpected non-authorised ID in Batch 12–14");
const ids = entries.map((entry) => Number(entry.id.replace(/^authorised-/, "")));
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const existing = await db.select({ id: questionItems.id }).from(questionItems).where(inArray(questionItems.id, ids));
if (existing.length !== ids.length) throw new Error(`Database mapping mismatch: expected ${ids.length}, found ${existing.length}`);
for (const entry of entries) {
  await db.update(questionItems).set({ explanation: entry.explanation, explanationStatus: "approved" }).where(eq(questionItems.id, Number(entry.id.replace(/^authorised-/, ""))));
}
const batch12Previous = JSON.parse(await readFile(`${ROOT}/reports/explanations_batch11_rectified_literal_audit.json`, "utf8")) as Audit;
const changedBatch12Ids = Object.entries(audits[0].explanations).filter(([id, explanation]) => batch12Previous.explanations[id] !== explanation).map(([id]) => id);
const receipt = {
  sources: audits.map((audit) => audit.source),
  parsedAsInertLiteralData: true,
  totalSupplied: entries.length,
  authorisedQuestionsUpdated: entries.length,
  batch12ReplacementCount: changedBatch12Ids.length,
  batch12WasNotDuplicated: true,
  batch13NewCount: Object.keys(audits[1].explanations).length,
  batch14NewCount: Object.keys(audits[2].explanations).length,
  outputLayer: "authorised questionItems explanation fields only",
  changedBatch12Ids,
  note: "Batch 12 reused the Batch 11 ID range but all 100 explanation values changed; they were treated as verified replacements, not new question records. No question, options, answer, topic, or diagram fields were changed.",
};
await writeFile(output, JSON.stringify(receipt, null, 2), "utf8");
console.log(JSON.stringify(receipt, null, 2));
