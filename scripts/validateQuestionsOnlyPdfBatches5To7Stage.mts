import { readFile } from "node:fs/promises";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const STAGED_PATH = "/home/ubuntu/jamb-import-staging/pdf_owner_batches_5_to_7_answer_matched_eligible.json";
const expected = new Map([
  ["Owner PDF answer-matched Biology 151–250 · 23 Aug 2026", 98],
  ["Owner PDF answer-matched Chemistry 1–100 · 23 Aug 2026", 94],
  ["Owner PDF answer-matched Chemistry 101–200 · 23 Aug 2026", 95],
]);

type Candidate = { externalId: string; sourceLabel: string; subject: string; question: string; options: string[]; answerIndex: number; explanation: string };
const learnerText = (value: string) => value
  .replace(/\^\s*\{?\s*\+\s*([0-9]+)\s*\}?/g, (_, digits) => [...digits].map((digit: string) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(digit)]).join(""))
  .replace(/\^\s*\{?\s*-\s*([0-9]+)\s*\}?/g, (_, digits) => "⁻" + [...digits].map((digit: string) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(digit)]).join(""))
  .replace(/\^\s*\{?\s*([0-9]+)\s*\}?/g, (_, digits) => [...digits].map((digit: string) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(digit)]).join(""))
  .replace(/_\s*\{?\s*([0-9]+)\s*\}?/g, (_, digits) => [...digits].map((digit: string) => "₀₁₂₃₄₅₆₇₈₉"[Number(digit)]).join(""));
const normalise = (value: string) => learnerText(value).toLowerCase().replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (digit) => String("⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(digit))).replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (digit) => String("₀₁₂₃₄₅₆₇₈₉".indexOf(digit))).replace(/⁻/g, "-").replace(/[^a-z0-9]+/g, " ").trim();
const fingerprint = (question: string, options: string[]) => `${normalise(question)}||${options.map(normalise).join("||")}`;

const staged = JSON.parse(await readFile(STAGED_PATH, "utf8")) as Candidate[];
if (staged.length !== 287 || new Set(staged.map((record) => record.externalId)).size !== 287) throw new Error("Expected exactly 287 unique eligible records after the documented 13 holds.");
for (const [sourceLabel, count] of expected) {
  if (staged.filter((record) => record.sourceLabel === sourceLabel).length !== count) throw new Error(`Unexpected staged count for ${sourceLabel}.`);
}
if (staged.some((record) => !expected.has(record.sourceLabel) || record.options.length < 4 || record.options.length > 5 || record.answerIndex < 0 || record.answerIndex >= record.options.length)) throw new Error("Staged payload contains an invalid record shape.");

const db = await getDb();
if (!db) throw new Error("Database unavailable for unified duplicate validation.");
const ledger = await db.select({ externalId: questionItems.externalId, questionText: questionItems.questionText, optionsJson: questionItems.optionsJson }).from(questionItems);
const ledgerIds = new Set(ledger.map((record) => record.externalId.toLowerCase()));
const ledgerFingerprints = new Set(ledger.map((record) => fingerprint(record.questionText, JSON.parse(record.optionsJson))));

const response = await fetch("http://localhost:3000/manus-storage/jamb_high_yield_practice_bank_1000_model_v5_explanations_reviewed_688e6cd1.json");
if (!response.ok) throw new Error(`Managed model asset returned HTTP ${response.status}.`);
const modelPayload = await response.json() as { questions?: Array<{ id: string; question: string; options: string[] }> };
if (!Array.isArray(modelPayload.questions) || modelPayload.questions.length !== 1000) throw new Error("Managed model asset did not return the protected 1,000-record bank.");
const modelIds = new Set(modelPayload.questions.map((record) => record.id.toLowerCase()));
const modelFingerprints = new Set(modelPayload.questions.map((record) => fingerprint(record.question, record.options)));

const duplicates = staged.filter((record) => ledgerIds.has(record.externalId.toLowerCase()) || ledgerFingerprints.has(fingerprint(record.question, record.options)) || modelIds.has(record.externalId.toLowerCase()) || modelFingerprints.has(fingerprint(record.question, record.options)));
if (duplicates.length) throw new Error(`Unified duplicate hold: ${JSON.stringify(duplicates.map((record) => record.externalId))}`);
console.log(JSON.stringify({ validatedCount: staged.length, sourceGroups: [...expected.entries()].map(([sourceLabel, count]) => ({ sourceLabel, count })), managedModelCount: modelPayload.questions.length, authorisedLedgerCount: ledger.length, duplicateCount: 0 }, null, 2));
process.exit(0);
