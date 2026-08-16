import { and, eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

type RawRecord = {
  subject: SyllabusSubject;
  year: string;
  sourceQuestionNumber: number;
  question: string;
  options: string[];
  answerLetter: string;
  tag: string;
  explanation: string;
  questionFile: string;
  answerFile: string;
};

type StagedRecord = {
  externalId: string;
  subject: SyllabusSubject;
  topic: string;
  difficulty: "medium";
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  sourceLabel: string;
  permissionNote: string;
};

const inputPath = "/home/ubuntu/jamb-import-staging/supplied_answer_key_pairs_aug16.json";
const stagePath = "/home/ubuntu/jamb-import-staging/supplied_answer_key_pairs_aug16_staged.json";
const reportPath = "/home/ubuntu/jamb-quiz-game/reports/supplied_answer_key_pair_stage_audit.json";
const modelPath = "/home/ubuntu/jamb-import-staging/model_bank_for_duplicate_audit.json";
const sourceLabel = "JAMB Quest · supplied keyed answer pairs · August 2026";
const permissionNote = "Owner-supplied keyed question and answer scripts received for direct JAMB Quest intake. The supplied answer letters and explanations are retained; official-topic mapping, full-bank duplicate prevention, option integrity, and answer-index checks are applied before gameplay release.";
const subjectSlug: Record<SyllabusSubject, string> = { "Use of English": "english", Biology: "biology", Chemistry: "chemistry", Physics: "physics" };

function normaliseStem(value: string) {
  return value
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseOption(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function resolveTag(subject: SyllabusSubject, tag: string, question: string) {
  const direct = resolveSyllabusTopic(subject, tag);
  if (direct) return direct;
  const combined = resolveSyllabusTopic(subject, `${tag} ${question}`);
  if (combined) return combined;
  const value = `${tag} ${question}`.toLowerCase();
  if (subject === "Biology") {
    if (/digest|enzyme|food|alimentary|nutrition/.test(value)) return "Nutrition and digestion";
    if (/osmosis|cell|stoma|plant physiology/.test(value)) return /stoma|plant/.test(value) ? "Plant and mammal structure" : "Living organisms and organization";
    if (/reproduction|egg|embry|lactation|hormone/.test(value)) return /hormone|lactation/.test(value) ? "Coordination and control" : "Reproduction";
    if (/vertebra|joint|skeleton|movement/.test(value)) return "Support and movement";
    if (/respir|alveol|gas exchange/.test(value)) return "Respiration";
    if (/nerv|neuron|eye|sensory/.test(value)) return "Coordination and control";
    if (/plant|germination|flower|leaf|root|stem/.test(value)) return "Plant and mammal structure";
    if (/insect|fung|mammal|organism|classification/.test(value)) return "Evolution and classification";
  }
  if (subject === "Chemistry") {
    if (/periodic|entropy|atomic|electron/.test(value)) return "Atomic structure and bonding";
    if (/electrolysis|electrode/.test(value)) return "Electrolysis";
    if (/equilibrium|le chatelier/.test(value)) return "Chemical equilibria";
    if (/oxidation|redox|reduction/.test(value)) return "Oxidation and reduction";
    if (/gas|mole|kinetic/.test(value)) return "Kinetic theory of matter and gases";
    if (/acid|base|salt|ph /.test(value)) return "Acids, bases and salts";
    if (/organic|hydrocarbon|alcohol|ester/.test(value)) return "Organic compounds";
    if (/rate|catalyst/.test(value)) return "Rates of reaction";
    if (/heat|enthalpy|energy/.test(value)) return "Energy changes";
  }
  if (subject === "Use of English") {
    if (/comprehension|passage|vocabulary|inference|reference/.test(value)) return "Comprehension passages";
    if (/cloze/.test(value)) return "Cloze passages";
    if (/synonym/.test(value)) return "Synonyms";
    if (/antonym/.test(value)) return "Antonyms";
    if (/stress/.test(value)) return /emphatic/.test(value) ? "Emphatic stress" : "Word stress";
    if (/consonant/.test(value)) return "Consonants";
    if (/vowel/.test(value)) return "Vowels";
    if (/idiom|figurative|ordinary/.test(value)) return "Ordinary, figurative and idiomatic usage";
    if (/grammar|tense|agreement|verb/.test(value)) return "Tense, aspect, number and agreement";
  }
  return null;
}

const raw = JSON.parse(await readFile(inputPath, "utf8")) as { records: RawRecord[] };
const model = JSON.parse(await readFile(modelPath, "utf8")) as { questions?: Array<{ id?: string; subject?: string; question?: string }> };
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const authorised = await db
  .select({ subject: questionItems.subject, question: questionItems.questionText, id: questionItems.externalId })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.isActive, 1), eq(questionSources.sourceType, "authorised")));
const fingerprints = new Map<string, { bank: "model" | "authorised"; id: string }>();
for (const item of model.questions ?? []) {
  if (item.subject && item.question && item.subject in subjectSlug) fingerprints.set(`${item.subject}:${normaliseStem(item.question)}`, { bank: "model", id: item.id ?? "model-question" });
}
for (const item of authorised) {
  if (item.subject in subjectSlug) fingerprints.set(`${item.subject}:${normaliseStem(item.question)}`, { bank: "authorised", id: item.id });
}
const seen = new Set<string>();
const staged: StagedRecord[] = [];
const duplicates: Array<{ externalId: string; bank: string; matchingId: string }> = [];
const holds: Array<{ externalId: string; subject: SyllabusSubject; sourceQuestionNumber: number; reason: string }> = [];
for (const record of raw.records) {
  const externalId = `supplied-keyed-${record.year}-${subjectSlug[record.subject]}-${String(record.sourceQuestionNumber).padStart(3, "0")}`;
  const fingerprint = `${record.subject}:${normaliseStem(record.question)}`;
  if (seen.has(fingerprint)) {
    duplicates.push({ externalId, bank: "same supplied intake", matchingId: "earlier record" });
    continue;
  }
  seen.add(fingerprint);
  const existing = fingerprints.get(fingerprint);
  if (existing) {
    duplicates.push({ externalId, bank: existing.bank, matchingId: existing.id });
    continue;
  }
  const topic = resolveTag(record.subject, record.tag, record.question);
  const answerIndex = record.answerLetter.charCodeAt(0) - 65;
  const optionKeys = record.options.map(normaliseOption);
  if (!topic) holds.push({ externalId, subject: record.subject, sourceQuestionNumber: record.sourceQuestionNumber, reason: "no safe official syllabus mapping" });
  else if (!record.question || record.options.length < 4 || record.options.length > 5) holds.push({ externalId, subject: record.subject, sourceQuestionNumber: record.sourceQuestionNumber, reason: "incomplete question or option count" });
  else if (new Set(optionKeys).size !== optionKeys.length) holds.push({ externalId, subject: record.subject, sourceQuestionNumber: record.sourceQuestionNumber, reason: "duplicate option text" });
  else if (answerIndex < 0 || answerIndex >= record.options.length) holds.push({ externalId, subject: record.subject, sourceQuestionNumber: record.sourceQuestionNumber, reason: "answer key cannot be aligned to options" });
  else if (!record.explanation) holds.push({ externalId, subject: record.subject, sourceQuestionNumber: record.sourceQuestionNumber, reason: "missing supplied explanation" });
  else staged.push({ externalId, subject: record.subject, topic, difficulty: "medium", question: record.question, options: record.options, answerIndex, explanation: record.explanation, sourceLabel, permissionNote });
}
const report = { parsedRecords: raw.records.length, releaseReady: staged.length, duplicates, holds, bySubject: Object.fromEntries(Object.keys(subjectSlug).map((subject) => [subject, staged.filter((item) => item.subject === subject).length])) };
await writeFile(stagePath, `${JSON.stringify(staged, null, 2)}\n`);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ parsedRecords: report.parsedRecords, releaseReady: report.releaseReady, duplicates: duplicates.length, holds: holds.length, bySubject: report.bySubject }, null, 2));
