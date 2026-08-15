import { readFile, writeFile } from "node:fs/promises";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

type Subject = "Biology" | "Chemistry" | "Physics";
type Incoming = {
  subject: Subject;
  sourceFile: string;
  questionNo: number;
  question: string;
  options: string[];
  answerIndex: number;
  topic: string;
  explanation: string;
};
type Existing = { subject: string; question: string; origin: string };

const inputFiles: Array<{ subject: Subject; path: string }> = [
  { subject: "Physics", path: "/home/ubuntu/upload/physics_100.md" },
  { subject: "Biology", path: "/home/ubuntu/upload/biology_100.md" },
  { subject: "Chemistry", path: "/home/ubuntu/upload/chemistry_100.md" },
];
const outputPath = "/home/ubuntu/jamb-quiz-game/reports/owner_batches_aug15_duplicate_audit.json";
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
const tokens = (value: string) => new Set(value.toLowerCase().match(/[a-z0-9]+/g) ?? []);
const tokenOverlap = (left: string, right: string) => {
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  if (leftTokens.size < 8 || rightTokens.size < 8) return 0;
  let shared = 0;
  for (const token of leftTokens) if (rightTokens.has(token)) shared += 1;
  return shared / Math.max(leftTokens.size, rightTokens.size);
};
const clean = (value: string) => value.replace(/\*+/g, "").trim();

function parseOptions(line: string) {
  return [...line.matchAll(/(?:^|\s)([A-E])[.)]\s*(.*?)(?=\s+[A-E][.)]\s*|$)/gi)]
    .map((match) => ({ letter: match[1].toUpperCase(), value: clean(match[2]) }))
    .filter((item) => item.value.length > 0);
}

function parseBatch(text: string, subject: Subject, sourceFile: string) {
  const sections = [...text.matchAll(/\*\*Q(\d+)(?:[–-]\d+)?\.[^*]*\*\*\s*([\s\S]*?)(?=\n\*\*Q\d+(?:[–-]\d+)?\.|$)/g)];
  const parsedByQuestionNo = new Map<number, Incoming>();
  const ambiguousDuplicateNumbers = new Set<number>();
  const holds: Array<{ sourceFile: string; questionNo: number; reason: string }> = [];
  const encounteredIds = new Set<number>();

  for (const section of sections) {
    const questionNo = Number(section[1]);
    const heading = section[0].split(/\r?\n/, 1)[0] ?? "";
    const body = section[2].trim();
    const answerMatch = body.match(/\*\*Answer:\s*([A-E])[.)]?[^\n]*\*\*/i);
    if (!answerMatch) continue;
    const answerLetter = answerMatch[1].toUpperCase();
    const beforeAnswer = body.slice(0, answerMatch.index).trim();
    const lines = beforeAnswer.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const optionLineIndex = lines.findIndex((line) => /(?:^|\s)A[.)]\s+/i.test(line));
    if (optionLineIndex < 0) {
      holds.push({ sourceFile, questionNo, reason: "no parsable option line" });
      continue;
    }
    const question = lines.slice(0, optionLineIndex).filter((line) => !/^\[.*\]$/.test(line)).join(" ").trim();
    const options = parseOptions(lines.slice(optionLineIndex).join(" "));
    const answerIndex = options.findIndex((option) => option.letter === answerLetter);
    if (question.length < 8) holds.push({ sourceFile, questionNo, reason: "missing or too-short question" });
    else if (options.length < 4 || options.length > 5) holds.push({ sourceFile, questionNo, reason: `requires four or five options; found ${options.length}` });
    else if (answerIndex < 0) holds.push({ sourceFile, questionNo, reason: "answer letter is not present in parsed options" });
    else {
      const record: Incoming = {
        subject,
        sourceFile,
        questionNo,
        question,
        options: options.map((option) => option.value),
        answerIndex,
        topic: heading.match(/\[Topic:\s*([^\]]+)/i)?.[1]?.trim() ?? "Owner-supplied pending topic map",
        explanation: body.slice((answerMatch.index ?? 0) + answerMatch[0].length).replace(/^\*+|\*+$/g, "").trim(),
      };
      const earlier = parsedByQuestionNo.get(questionNo);
      if (ambiguousDuplicateNumbers.has(questionNo)) {
        holds.push({ sourceFile, questionNo, reason: "repeated question number remains held pending a single confirmed final version" });
      } else if (earlier && !/corrected/i.test(heading)) {
        parsedByQuestionNo.delete(questionNo);
        ambiguousDuplicateNumbers.add(questionNo);
        holds.push({ sourceFile, questionNo, reason: "conflicting repeated question number; both versions held pending a confirmed final version" });
      } else {
        if (earlier) holds.push({ sourceFile, questionNo, reason: "earlier version superseded by the explicitly corrected card" });
        parsedByQuestionNo.set(questionNo, record);
      }
    }
  }
  return { parsed: [...parsedByQuestionNo.values()], holds, detectedHeadings: sections.length };
}

const parsedBatches = await Promise.all(inputFiles.map(async ({ subject, path }) => {
  const text = await readFile(path, "utf8");
  return parseBatch(text, subject, path.split("/").pop() ?? path);
}));
const incoming = parsedBatches.flatMap((batch) => batch.parsed);
const structuralHolds = parsedBatches.flatMap((batch) => batch.holds);

const db = await getDb();
if (!db) throw new Error("Database is unavailable for duplicate comparison.");
const storedRows = await db.select({ subject: questionItems.subject, question: questionItems.questionText }).from(questionItems);
const bankUrl = new URL("/manus-storage/jamb_high_yield_practice_bank_1000_natural_explanations_817e6822.json", process.env.JAMB_QUEST_URL ?? "http://localhost:3000");
const modelResponse = await fetch(bankUrl);
if (!modelResponse.ok) throw new Error(`Unable to load active model bank: ${modelResponse.status}`);
const modelPayload = await modelResponse.json() as { questions?: Array<{ subject?: string; question?: string }> };
const existing: Existing[] = [
  ...storedRows.map((row) => ({ subject: row.subject, question: row.question, origin: "stored-authorised" })),
  ...(modelPayload.questions ?? []).filter((row): row is { subject: string; question: string } => typeof row.subject === "string" && typeof row.question === "string").map((row) => ({ ...row, origin: "active-model-bank" })),
];
const exactExisting = new Map(existing.map((row) => [`${row.subject}:${normalise(row.question)}`, row]));
const accepted: Incoming[] = [];
const exactDuplicates: Array<{ subject: Subject; questionNo: number; sourceFile: string; origin: string }> = [];
const nearDuplicates: Array<{ subject: Subject; questionNo: number; sourceFile: string; origin: string; similarity: number }> = [];
const batchDuplicates: Array<{ subject: Subject; questionNo: number; sourceFile: string; matchesQuestionNo: number; matchesSourceFile: string }> = [];
const seenIncoming = new Map<string, Incoming>();

for (const record of incoming) {
  const fingerprint = `${record.subject}:${normalise(record.question)}`;
  const previous = seenIncoming.get(fingerprint);
  if (previous) {
    batchDuplicates.push({ subject: record.subject, questionNo: record.questionNo, sourceFile: record.sourceFile, matchesQuestionNo: previous.questionNo, matchesSourceFile: previous.sourceFile });
    continue;
  }
  seenIncoming.set(fingerprint, record);
  const exact = exactExisting.get(fingerprint);
  if (exact) {
    exactDuplicates.push({ subject: record.subject, questionNo: record.questionNo, sourceFile: record.sourceFile, origin: exact.origin });
    continue;
  }
  let closest: Existing | undefined;
  let similarity = 0;
  for (const candidate of existing) {
    if (candidate.subject !== record.subject) continue;
    const currentSimilarity = tokenOverlap(record.question, candidate.question);
    if (currentSimilarity > similarity) {
      similarity = currentSimilarity;
      closest = candidate;
    }
  }
  if (closest && similarity >= 0.88) {
    nearDuplicates.push({ subject: record.subject, questionNo: record.questionNo, sourceFile: record.sourceFile, origin: closest.origin, similarity: Number(similarity.toFixed(3)) });
    continue;
  }
  accepted.push(record);
}

const report = {
  inputFiles: inputFiles.map((entry) => entry.path.split("/").pop()),
  sourceHeadingsDetected: parsedBatches.map((batch) => batch.detectedHeadings),
  parsedCandidateCount: incoming.length,
  structuralHolds,
  exactDuplicates,
  nearDuplicates,
  batchDuplicates,
  safeUniqueRecords: accepted,
  summary: {
    storedAuthorisedCompared: storedRows.length,
    modelBankCompared: (modelPayload.questions ?? []).length,
    structuralHolds: structuralHolds.length,
    exactDuplicates: exactDuplicates.length,
    nearDuplicates: nearDuplicates.length,
    batchDuplicates: batchDuplicates.length,
    safeUniqueCandidates: accepted.length,
  },
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary, null, 2));
process.exit(0);
