import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const uploads = "/home/ubuntu/upload";
const outputPath = resolve("reports", "owner_answer_key_batches_8_to_10_reconciliation.json");

const inputs = [
  { fileName: "Batch8_Chem201-250_Phys1-50.md", subject: "Chemistry", min: 201, max: 250, sourceId: 23610001, declaredRepeat: true },
  { fileName: "Batch8_Chem201-250_Phys1-50.md", subject: "Physics", min: 1, max: 50, sourceId: 23520002, declaredRepeat: false },
  { fileName: "Physics_Batch9_Q51-150.md", subject: "Physics", min: 51, max: 150, sourceId: 23520002, declaredRepeat: false },
  { fileName: "Physics_Batch10_Q151-250_FINAL.md", subject: "Physics", min: 151, max: 250, sourceId: 23520002, declaredRepeat: false },
];

function normalize(value) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[²³¹]/g, (character) => ({ "¹": "1", "²": "2", "³": "3" })[character] ?? character)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sourceNumber(externalId) {
  const match = externalId.match(/-(\d{3})$/);
  return match ? Number(match[1]) : null;
}

function parseEntries(text, subject, min, max) {
  const heading = /^\*\*(\d+)\.\s+([A-D])\s+—\s+(.+?)\*\*(?:\s+—\s*(.*))?$/gm;
  const matches = [...text.matchAll(heading)];
  return matches.flatMap((match, index) => {
    const number = Number(match[1]);
    if (number < min || number > max) return [];
    const nextStart = matches[index + 1]?.index ?? text.length;
    const paragraph = text.slice((match.index ?? 0) + match[0].length, nextStart).trim();
    return [{
      subject,
      number,
      key: match[2],
      answerText: match[3].trim(),
      explanation: [match[4]?.trim(), paragraph].filter(Boolean).join("\n").trim(),
    }];
  });
}

const db = await getDb();
if (!db) throw new Error("Database unavailable for source reconciliation");

const sourceRows = new Map();
for (const sourceId of new Set(inputs.map((input) => input.sourceId))) {
  const rows = await db.select({
    id: questionItems.id,
    externalId: questionItems.externalId,
    subject: questionItems.subject,
    questionText: questionItems.questionText,
    optionsJson: questionItems.optionsJson,
    answerIndex: questionItems.answerIndex,
    explanation: questionItems.explanation,
    explanationStatus: questionItems.explanationStatus,
  }).from(questionItems).where(eq(questionItems.sourceId, sourceId));
  sourceRows.set(sourceId, new Map(rows.map((row) => [sourceNumber(row.externalId), row])));
}

const results = [];
for (const input of inputs) {
  const sourceText = await readFile(resolve(uploads, input.fileName), "utf8");
  const entryByNumber = new Map(parseEntries(sourceText, input.subject, input.min, input.max).map((entry) => [entry.number, entry]));
  const source = sourceRows.get(input.sourceId);
  for (let number = input.min; number <= input.max; number += 1) {
    const entry = entryByNumber.get(number);
    const row = source?.get(number);
    let options = [];
    try { options = row ? JSON.parse(row.optionsJson) : []; } catch { options = []; }
    const expectedIndex = entry ? entry.key.charCodeAt(0) - 65 : null;
    const selectedOption = row && Array.isArray(options) ? options[row.answerIndex] : null;
    const answerTextMatches = Boolean(entry && selectedOption && (normalize(selectedOption).includes(normalize(entry.answerText)) || normalize(entry.answerText).includes(normalize(selectedOption))));
    const genericExplanation = Boolean(entry?.explanation && /(the deciding feature here is|this repeats(?: and reinforces)? question|see q\d+ for full reasoning)/i.test(entry.explanation));
    results.push({
      fileName: input.fileName,
      subject: input.subject,
      sourceNumber: number,
      declaredRepeat: input.declaredRepeat,
      sourceExternalId: row?.externalId ?? null,
      sourceFound: Boolean(row),
      answerKeyFound: Boolean(entry),
      keyMatchesProtectedRecord: Boolean(row && entry && row.answerIndex === expectedIndex),
      answerTextMatchesProtectedOption: answerTextMatches,
      existingExplanationStatus: row?.explanationStatus ?? null,
      existingExplanationPresent: Boolean(row?.explanation?.trim()),
      submittedExplanationCharacters: entry?.explanation.length ?? 0,
      submittedExplanationHasCrossReferenceOrTemplateFlag: genericExplanation,
    });
  }
}

const count = (predicate) => results.filter(predicate).length;
const report = {
  generatedAt: new Date().toISOString(),
  scope: "Read-only reconciliation; no question, option, key, topic, eligibility, or explanation field was modified.",
  inputFiles: [...new Set(inputs.map((input) => input.fileName))],
  totals: {
    expectedEntries: results.length,
    sourceFound: count((row) => row.sourceFound),
    answerKeyFound: count((row) => row.answerKeyFound),
    protectedKeyMatches: count((row) => row.keyMatchesProtectedRecord),
    selectedOptionTextMatches: count((row) => row.answerTextMatchesProtectedOption),
    declaredChemistryRepeats: count((row) => row.declaredRepeat),
    explanationTemplateOrCrossReferenceFlags: count((row) => row.submittedExplanationHasCrossReferenceOrTemplateFlag),
  },
  batches: inputs.map((input) => ({
    fileName: input.fileName,
    subject: input.subject,
    expectedRange: `${input.min}–${input.max}`,
    declaredRepeat: input.declaredRepeat,
    rows: results.filter((row) => row.fileName === input.fileName && row.subject === input.subject),
  })),
  holds: results.filter((row) => !row.sourceFound || !row.answerKeyFound || !row.keyMatchesProtectedRecord || !row.answerTextMatchesProtectedOption || row.declaredRepeat || row.submittedExplanationHasCrossReferenceOrTemplateFlag),
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, totals: report.totals, holdCount: report.holds.length }, null, 2));
