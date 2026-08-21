import { readFile, writeFile } from "node:fs/promises";
import { eq, inArray } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const ROOT = "/home/ubuntu/jamb-quiz-game";
const INPUT_BANK = "/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v2.json";
const OUTPUT_BANK = "/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v3_rectified.json";
const GATE = `${ROOT}/reports/rectified_batches_gate_audit.json`;
const REPORT = `${ROOT}/reports/rectified_batches_release_receipt.json`;
const batches = [8, 9, 10, 11].map((batch) => `${ROOT}/reports/explanations_batch${batch}_rectified_literal_audit.json`);

type Gate = { duplicateIds: string[]; missingModelIds: string[]; missingAuthorisedIds: string[]; genericIds: string[]; rawMarkupIds: string[] };
type Audit = { source: string; explanations: Record<string, string> };
type Question = { id?: string; record_id?: string; explanation?: string; [key: string]: unknown };
const readJson = async <T>(path: string) => JSON.parse(await readFile(path, "utf8")) as T;
const gate = await readJson<Gate>(GATE);
if (gate.duplicateIds.length || gate.missingModelIds.length || gate.missingAuthorisedIds.length || gate.rawMarkupIds.length) throw new Error("Rectified batch gate has unresolved structural failures");
const audits = await Promise.all(batches.map((path) => readJson<Audit>(path)));
const explanations = Object.assign({}, ...audits.map((audit) => audit.explanations));
const held = new Set(gate.genericIds);
const eligible = Object.entries(explanations).filter(([id]) => !held.has(id));
const model = await readJson<Record<string, unknown>>(INPUT_BANK);
const questions = (model.questions ?? model.items ?? model.records) as Question[] | undefined;
if (!questions) throw new Error("Model-bank question array not found");
const byId = new Map(questions.map((question) => [String(question.id ?? question.record_id), question]));
const modelEligible = eligible.filter(([id]) => id.startsWith("PHY-"));
for (const [id, explanation] of modelEligible) {
  const question = byId.get(id);
  if (!question) throw new Error(`Model question missing: ${id}`);
  question.explanation = explanation;
}
await writeFile(OUTPUT_BANK, JSON.stringify(model, null, 2), "utf8");
const authorisedEligible = eligible.filter(([id]) => id.startsWith("authorised-"));
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const authorisedIds = authorisedEligible.map(([id]) => Number(id.replace(/^authorised-/, "")));
const existing = await db.select({ id: questionItems.id }).from(questionItems).where(inArray(questionItems.id, authorisedIds));
if (existing.length !== authorisedIds.length) throw new Error(`Authorised database mapping changed: expected ${authorisedIds.length}, found ${existing.length}`);
for (const [id, explanation] of authorisedEligible) {
  const numericId = Number(id.replace(/^authorised-/, ""));
  await db.update(questionItems).set({ explanation, explanationStatus: "approved" }).where(eq(questionItems.id, numericId));
}
const receipt = {
  sources: audits.map((audit) => audit.source),
  parsedAsInertLiteralData: true,
  totalSupplied: Object.keys(explanations).length,
  released: eligible.length,
  held: held.size,
  modelQuestionsUpdated: modelEligible.length,
  authorisedQuestionsUpdated: authorisedEligible.length,
  heldIds: [...held],
  outputBank: OUTPUT_BANK,
  warning: "Twenty-nine Batch 8 Physics explanations remain held because rectified text still contains the blocked generic-template language; existing released values were not overwritten for those IDs.",
};
await writeFile(REPORT, JSON.stringify(receipt, null, 2), "utf8");
console.log(JSON.stringify(receipt, null, 2));
