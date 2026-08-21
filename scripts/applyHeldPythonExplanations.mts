import { readFile, writeFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const ROOT = "/home/ubuntu/jamb-quiz-game";
const MODEL_BANK = "/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v1.json";
const OUTPUT_BANK = "/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v2.json";
const BATCH8 = `${ROOT}/reports/explanations_batch8_literal_audit.json`;
const BATCH9 = `${ROOT}/reports/explanations_batch9_literal_audit.json`;
const COMPAT9 = `${ROOT}/reports/explanations_batch9_compatibility_audit.json`;
const REPORT = `${ROOT}/reports/held_python_explanations_release_receipt.json`;

type LiteralAudit = { source: string; recordCount: number; explanations: Record<string, string> };
type Compatibility = { eligibleModelBankIds: string[]; authorisedIdsHeldPendingVerifiedMapping: string[]; genericTemplateIds: string[] };
type ModelQuestion = { id?: string; record_id?: string; explanation?: string; [key: string]: unknown };

const readJson = async <T>(path: string) => JSON.parse(await readFile(path, "utf8")) as T;
const questionArray = (payload: Record<string, unknown>) => {
  for (const key of ["questions", "items", "records"]) {
    if (Array.isArray(payload[key])) return payload[key] as ModelQuestion[];
  }
  throw new Error("Canonical model-bank question array not found");
};

const batch8 = await readJson<LiteralAudit>(BATCH8);
const batch9 = await readJson<LiteralAudit>(BATCH9);
const compatibility = await readJson<Compatibility>(COMPAT9);

if (batch8.recordCount !== Object.keys(batch8.explanations).length || batch9.recordCount !== Object.keys(batch9.explanations).length) {
  throw new Error("Literal audit count does not match explanation map");
}
const allModelIds = Object.keys(batch8.explanations).concat(compatibility.eligibleModelBankIds);
const modelBank = await readJson<Record<string, unknown>>(MODEL_BANK);
const questions = questionArray(modelBank);
const byId = new Map(questions.map((question) => [String(question.id ?? question.record_id), question]));
const missingModelIds = allModelIds.filter((id) => !byId.has(id));
if (missingModelIds.length) throw new Error(`Model-bank IDs missing: ${missingModelIds.join(", ")}`);
for (const [id, explanation] of Object.entries(batch8.explanations)) byId.get(id)!.explanation = explanation;
for (const id of compatibility.eligibleModelBankIds) byId.get(id)!.explanation = batch9.explanations[id];
await writeFile(OUTPUT_BANK, JSON.stringify(modelBank, null, 2), "utf8");

const authorisedIds = compatibility.authorisedIdsHeldPendingVerifiedMapping.concat(compatibility.genericTemplateIds);
const missingAuthorisedLiterals = authorisedIds.filter((id) => typeof batch9.explanations[id] !== "string");
if (missingAuthorisedLiterals.length) throw new Error(`Authorised explanations missing from literal audit: ${missingAuthorisedLiterals.join(", ")}`);
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const numericIds = authorisedIds.map((id) => Number(id.replace(/^authorised-/, "")));
let updatedAuthorised = 0;
for (const id of numericIds) {
  const key = `authorised-${id}`;
  const explanation = batch9.explanations[key];
  const result = await db.update(questionItems).set({ explanation, explanationStatus: "approved" }).where(eq(questionItems.id, id));
  if (Number(result[0]?.affectedRows ?? 0) !== 1) throw new Error(`Authorised question update did not affect exactly one row: ${key}`);
  updatedAuthorised += 1;
}

const receipt = {
  sources: [batch8.source, batch9.source],
  explicitUserRelease: true,
  uploadedFilesParsedAsInertLiteralData: true,
  modelQuestionsUpdated: Object.keys(batch8.explanations).length + compatibility.eligibleModelBankIds.length,
  batch8ModelQuestionsUpdated: Object.keys(batch8.explanations).length,
  batch9ModelQuestionsUpdated: compatibility.eligibleModelBankIds.length,
  authorisedQuestionsUpdated: updatedAuthorised,
  batch9AuthorisedMappingHeldNowReleased: compatibility.authorisedIdsHeldPendingVerifiedMapping.length,
  batch9GenericTemplateRecordsReleasedByExplicitUserInstruction: compatibility.genericTemplateIds.length,
  outputBank: OUTPUT_BANK,
  warning: "The explicit release includes the 46 records previously flagged for generic-template language; this is recorded for later quality review.",
};
await writeFile(REPORT, JSON.stringify(receipt, null, 2), "utf8");
console.log(JSON.stringify(receipt, null, 2));
