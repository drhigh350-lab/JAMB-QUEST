import { readFile, writeFile } from "node:fs/promises";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";
import { withUseOfEnglishInstruction } from "../shared/useOfEnglishInstructions";

const ANSWER_FILE = "/home/ubuntu/upload/UoE_Batch1_Q1-100.md";
const SOURCE_STAGE_FILE = "/home/ubuntu/jamb-import-staging/jamb_questions_only_pdf_unkeyed_stage.json";
const MODEL_BANK_FILE = "/home/ubuntu/jamb-import-staging/model_bank_for_duplicate_audit.json";
const STAGED_PATH = "/home/ubuntu/jamb-import-staging/pdf_owner_uoe_001_to_100_answer_matched_eligible.json";
const REPORT_PATH = "/home/ubuntu/jamb-quiz-game/reports/pdf_owner_uoe_001_to_100_answer_match_audit.json";

type SourceRecord = {
  externalId: string;
  sourceSubject: string;
  sourceQuestionNumber: number;
  sourceCategory: string;
  questionText: string;
  options: string[];
  answerStatus: "awaiting_owner_answer_batch";
  explanationStatus: "awaiting_owner_answer_batch";
  releaseStatus: "staged_not_playable";
  sourceFile: string;
};

type ParsedAnswer = {
  number: number;
  answerLetter: string;
  answerText: string;
  explanation: string;
};

type Hold = {
  externalId: string;
  questionNumber: number;
  reason: string;
};

type EligibleRecord = {
  externalId: string;
  subject: "Use of English";
  topic: string;
  difficulty: "medium";
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  sourceLabel: string;
  permissionNote: string;
};

function clean(value: string) {
  return value.replace(/\r/g, "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
}

function normalise(value: string) {
  return clean(value).toLowerCase().replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, " ").trim();
}

function fingerprint(question: string, options: string[]) {
  return `${normalise(question)}\u0000${options.map(normalise).join("\u0001")}`;
}

function hasUnsafeMarkup(value: string) {
  return /```|!\[[^\]]*\]\([^)]*\)|<\/?[a-z][^>]*>|\$\$|\\(?:frac|text|begin|end|sqrt)\b/i.test(value);
}

function compactExplanation(value: string) {
  const sentences = clean(value).split(/(?<=[.!?])\s+(?=[A-Z“])/).filter(Boolean);
  return sentences.slice(0, 2).join(" ");
}

function topicFor(category: string) {
  const value = normalise(category);
  const mappings: Array<[RegExp, string]> = [
    [/synonym/, "Synonyms"],
    [/antonym/, "Antonyms"],
    [/sentence meaning|sentence interpretation|lexis/, "Sentence meaning"],
    [/cloze|completion/, "Cloze passages"],
    [/comprehension|passage/, "Comprehension passages"],
    [/summary/, "Summary"],
    [/punctuation|spelling|mechanic/, "Mechanics"],
    [/idiom|figurative|ordinary usage/, "Ordinary, figurative and idiomatic usage"],
    [/vowel/, "Vowels"],
    [/consonant/, "Consonants"],
    [/rhyme|homophone/, "Rhymes and homophones"],
    [/word stress/, "Word stress"],
    [/emphatic stress/, "Emphatic stress"],
    [/clause|sentence pattern|voice|reported speech/, "Clause and sentence patterns"],
    [/word class|preposition|pronoun|conjunction|determiner/, "Word classes"],
    [/tense|agreement|number|aspect|grammar/, "Tense, aspect, number and agreement"],
  ];
  const match = mappings.find(([pattern]) => pattern.test(value));
  return match ? resolveSyllabusTopic("Use of English", match[1]) : null;
}

function parseAnswerFile(markdown: string) {
  const headings = [...markdown.matchAll(/^\*\*(\d+)\.\s*([A-E])\s*[—-]\s*(.+?)\*\*\s*$/gm)];
  const parsed: ParsedAnswer[] = [];
  const malformed: Array<{ number: number; reason: string }> = [];
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const number = Number(heading[1]);
    const answerLetter = heading[2].toUpperCase();
    const answerText = clean(heading[3]);
    const block = markdown.slice((heading.index ?? 0) + heading[0].length, headings[index + 1]?.index ?? markdown.length);
    const explanation = clean(block);
    if (!Number.isInteger(number) || !explanation) {
      malformed.push({ number, reason: "Malformed answer source: a numbered answer heading or its explanation is missing." });
      continue;
    }
    parsed.push({ number, answerLetter, answerText, explanation });
  }
  return { parsed, malformed, headingCount: headings.length };
}

function sourceModelRecords(model: unknown): Array<{ subject?: string; question?: string; questionText?: string; options?: unknown }> {
  if (Array.isArray(model)) return model as Array<{ subject?: string; question?: string; questionText?: string; options?: unknown }>;
  if (model && typeof model === "object") {
    const object = model as { questions?: unknown; data?: unknown };
    if (Array.isArray(object.questions)) return object.questions as Array<{ subject?: string; question?: string; questionText?: string; options?: unknown }>;
    if (Array.isArray(object.data)) return object.data as Array<{ subject?: string; question?: string; questionText?: string; options?: unknown }>;
  }
  return [];
}

const [answerMarkdown, sourceStageRaw, modelRaw] = await Promise.all([
  readFile(ANSWER_FILE, "utf8"),
  readFile(SOURCE_STAGE_FILE, "utf8"),
  readFile(MODEL_BANK_FILE, "utf8"),
]);
const sourceStage = JSON.parse(sourceStageRaw) as SourceRecord[];
const answerSource = parseAnswerFile(answerMarkdown);
const batchAnswers = answerSource.parsed.filter((record) => record.number >= 1 && record.number <= 100);
const sourceRecords = sourceStage.filter((record) => record.sourceSubject === "Use of English" && record.sourceQuestionNumber >= 1 && record.sourceQuestionNumber <= 100);
const sourceByNumber = new Map(sourceRecords.map((record) => [record.sourceQuestionNumber, record]));
const answersByNumber = new Map<number, ParsedAnswer>();
const holds: Hold[] = [];

for (const record of batchAnswers) {
  if (answersByNumber.has(record.number)) {
    holds.push({ externalId: `PDF-OWNER-20260822-ENG-${String(record.number).padStart(3, "0")}`, questionNumber: record.number, reason: "Answer-batch hold: duplicate numbered answer entry in the owner Markdown source." });
  }
  answersByNumber.set(record.number, record);
}

for (const malformed of answerSource.malformed) {
  if (malformed.number >= 1 && malformed.number <= 100) holds.push({ externalId: `PDF-OWNER-20260822-ENG-${String(malformed.number).padStart(3, "0")}`, questionNumber: malformed.number, reason: malformed.reason });
}

const model = sourceModelRecords(JSON.parse(modelRaw));
const modelFingerprints = new Set(model.flatMap((record) => {
  const question = record.question ?? record.questionText;
  return typeof question === "string" && Array.isArray(record.options) && record.options.every((option) => typeof option === "string")
    ? [fingerprint(question, record.options as string[])]
    : [];
}));
const db = await getDb();
if (!db) throw new Error("Database unavailable for duplicate screening.");
const ledger = await db.select({ externalId: questionItems.externalId, questionText: questionItems.questionText, optionsJson: questionItems.optionsJson }).from(questionItems);
const ledgerExternalIds = new Set(ledger.map((record) => record.externalId.toLowerCase()));
const ledgerFingerprints = new Set(ledger.flatMap((record) => {
  try {
    const options = JSON.parse(record.optionsJson) as unknown;
    return Array.isArray(options) && options.every((option) => typeof option === "string") ? [fingerprint(record.questionText, options)] : [];
  } catch {
    return [];
  }
}));

const eligible: EligibleRecord[] = [];
for (let number = 1; number <= 100; number += 1) {
  const source = sourceByNumber.get(number);
  const answer = answersByNumber.get(number);
  const externalId = source?.externalId ?? `PDF-OWNER-20260822-ENG-${String(number).padStart(3, "0")}`;
  if (!source) {
    holds.push({ externalId, questionNumber: number, reason: "Source-match hold: no staged Use of English PDF question exists for this number." });
    continue;
  }
  if (!answer) {
    holds.push({ externalId, questionNumber: number, reason: "Source-match hold: the owner Markdown batch has no answer-and-explanation entry for this staged question." });
    continue;
  }
  if (source.answerStatus !== "awaiting_owner_answer_batch" || source.explanationStatus !== "awaiting_owner_answer_batch" || source.releaseStatus !== "staged_not_playable") {
    holds.push({ externalId, questionNumber: number, reason: "Source-state hold: the staged PDF record is not in the expected unkeyed, non-playable state." });
    continue;
  }
  const answerIndex = "ABCDE".indexOf(answer.answerLetter);
  if (answerIndex < 0 || answerIndex >= source.options.length) {
    holds.push({ externalId, questionNumber: number, reason: "Answer-key hold: the supplied answer letter does not target a staged source option." });
    continue;
  }
  if (normalise(source.options[answerIndex]) !== normalise(answer.answerText)) {
    holds.push({ externalId, questionNumber: number, reason: "Answer-key hold: the supplied answer text does not match the staged option at the supplied answer letter." });
    continue;
  }
  const embeddedKey = answer.explanation.match(/(?:correct\s+answer|answer)\s*(?:is|:)\s*\*?([A-E])\b/i)?.[1]?.toUpperCase();
  if (embeddedKey && embeddedKey !== answer.answerLetter) {
    holds.push({ externalId, questionNumber: number, reason: "Answer-key hold: the explanation states a different answer letter from the supplied answer heading." });
    continue;
  }
  const topic = topicFor(source.sourceCategory);
  if (!topic) {
    holds.push({ externalId, questionNumber: number, reason: "Syllabus hold: the staged source category cannot be resolved to an exact official Use of English syllabus area." });
    continue;
  }
  const distinctOptions = new Set(source.options.map(normalise));
  if (source.options.length < 4 || source.options.length > 5 || distinctOptions.size !== source.options.length || source.options.some((option) => !clean(option))) {
    holds.push({ externalId, questionNumber: number, reason: "Option-integrity hold: the staged source does not contain four or five distinct, non-empty options." });
    continue;
  }
  if (source.questionText.length < 8 || hasUnsafeMarkup(source.questionText) || source.options.some(hasUnsafeMarkup) || hasUnsafeMarkup(answer.explanation)) {
    holds.push({ externalId, questionNumber: number, reason: "Formatting hold: raw markup, raw LaTeX, or incomplete learner text was found in the matched source." });
    continue;
  }
  const explanation = compactExplanation(answer.explanation);
  if (!explanation || explanation.split(/\r?\n/).filter(Boolean).length > 5) {
    holds.push({ externalId, questionNumber: number, reason: "Explanation hold: the supplied explanation cannot be retained in the compact learner format." });
    continue;
  }
  const question = withUseOfEnglishInstruction(topic, source.questionText).questionText;
  const sourceFingerprint = fingerprint(source.questionText, source.options);
  const renderedFingerprint = fingerprint(question, source.options);
  if (ledgerExternalIds.has(externalId.toLowerCase())) {
    holds.push({ externalId, questionNumber: number, reason: "Duplicate hold: the staged external identifier already exists in the authorised ledger." });
    continue;
  }
  if (modelFingerprints.has(sourceFingerprint) || modelFingerprints.has(renderedFingerprint) || ledgerFingerprints.has(sourceFingerprint) || ledgerFingerprints.has(renderedFingerprint)) {
    holds.push({ externalId, questionNumber: number, reason: "Duplicate hold: the full normalized question-and-option fingerprint already exists in the model bank or authorised ledger." });
    continue;
  }
  eligible.push({
    externalId,
    subject: "Use of English",
    topic,
    difficulty: "medium",
    question,
    options: source.options.map(clean),
    answerIndex,
    explanation,
    sourceLabel: "Owner PDF answer-matched Use of English 1–100 · 22 Aug 2026",
    permissionNote: "Owner-supplied answer-and-explanation batch matched deterministically to owner-supplied PDF questions. Source question wording, answer key, and explanation remain attributable to the owner-supplied materials.",
  });
}

const report = {
  sourceFile: "jamb_questions_only.pdf",
  answerFile: "UoE_Batch1_Q1-100.md",
  declaredRange: "Use of English 1–100",
  answerHeadingCount: answerSource.headingCount,
  parsedAnswerCount: batchAnswers.length,
  stagedSourceCount: sourceRecords.length,
  modelBankCandidateCount: modelFingerprints.size,
  authorisedLedgerCandidateCount: ledgerFingerprints.size,
  eligibleCount: eligible.length,
  heldCount: holds.length,
  held: holds.sort((a, b) => a.questionNumber - b.questionNumber || a.reason.localeCompare(b.reason)),
  stagedPath: STAGED_PATH,
  releasePolicy: "This audit stages eligible records only. It does not import, approve, or expose any record to learner gameplay.",
};

await writeFile(STAGED_PATH, `${JSON.stringify(eligible, null, 2)}\n`);
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(0);
