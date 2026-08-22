import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const INPUT_FILES = [
  "/home/ubuntu/upload/pasted_content.txt",
  "/home/ubuntu/upload/pasted_content_2.txt",
  "/home/ubuntu/upload/pasted_content_3.txt",
  "/home/ubuntu/upload/pasted_content_4.txt",
  "/home/ubuntu/upload/pasted_content_5.txt",
] as const;

const STAGING_DIR = "/home/ubuntu/jamb-import-staging";
const REPORT_PATH = "/home/ubuntu/jamb-quiz-game/reports/owner_english_pasted_batch_audit.json";
const STAGED_PATH = join(STAGING_DIR, "owner_english_pasted_batch_20260822_eligible.json");
const MODEL_BANK_URL = "https://jambquiz-kmqgtf9m.manus.space/manus-storage/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v3_rectified_167c6b81.json";

type ParsedQuestion = {
  number: number;
  category: string;
  rawStem: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  topic: string;
  sourceFile: string;
};

type Hold = { externalId: string; questionNumber: number; reason: string; question: string };

const comprehensionPassageA = "Read the passage and answer the question. Many students believe that success in an examination depends mainly on intelligence. While intelligence is useful, it is not the only factor that determines performance. A student who understands difficult ideas but never studies consistently may perform worse than another student with average ability who follows a careful study plan. Effective preparation involves more than reading for several hours without a clear purpose. A serious candidate identifies the topics to be studied, divides them into manageable portions, and revises them regularly. Practice tests are also important because they reveal areas of weakness and teach candidates how to manage time. However, merely checking the correct answers is not enough. Students should understand why an answer is correct and why the other options are wrong. Rest and proper organization also contribute to academic success. A tired student may spend many hours with a book but remember very little. Short, focused study sessions, combined with sufficient sleep, are often more productive than irregular all-night reading. Success, therefore, is usually the result of disciplined effort, useful feedback, and a willingness to improve.";

const libraryReadingText = "Read the passage and answer the question. In many communities, public libraries are regarded as quiet buildings filled with old books. This perception has caused some people to underestimate their importance. A modern library, however, is more than a room where books are stored. It is a centre for learning, research, digital access, and community development. For students, a library provides resources that may not be available at home. Some students cannot afford textbooks, internet subscriptions, or a suitable place to study. A well-managed library can reduce these disadvantages by providing books, computers, electricity, and a peaceful environment. It can also organize reading programmes that help young people develop the habit of learning independently. The usefulness of a library depends greatly on how it is managed. Books must be properly catalogued so that users can find them easily. Materials should be updated regularly because information changes rapidly, especially in science and technology. Librarians also need to guide users on how to identify reliable information and avoid misleading material found online. Despite these benefits, many libraries face inadequate funding. Some lack current books, functional computers, or sufficient staff. In other cases, the available facilities are poorly maintained. Governments, schools, private organizations, and community members can all contribute to improving libraries. Investing in libraries is not merely spending money on buildings; it is investing in informed citizens and a more capable society.";

const clozePrompts: Record<number, string> = {
  81: "A good leader does not merely give instructions. He listens to the people he leads and tries to understand their ______.",
  82: "When difficulties arise, a good leader does not search for someone to ______; instead, he examines the situation carefully and looks for a practical solution.",
  83: "When difficulties arise, a good leader examines the situation carefully and looks for a practical ______.",
  84: "Such a leader is willing to accept ______ when he makes a mistake.",
  85: "He also encourages his team to work with ______ because cooperation usually produces better results than individual effort.",
  86: "A leader must be firm, but firmness should not be confused with ______.",
  87: "People are more likely to respect a leader who is fair and ______ in his dealings.",
  88: "A leader should be able to communicate his ideas ______, since unclear instructions can lead to unnecessary misunderstandings.",
  89: "Unclear instructions can lead to unnecessary ______.",
  90: "Effective leadership requires patience, responsibility, and a genuine ______ to the welfare of others.",
};

function clean(value: string) {
  return value.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
}

function normalise(value: string) {
  return clean(value).toLowerCase().replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, " ").trim();
}

function fingerprint(question: string, options: string[]) {
  const stem = question.includes("Question:") ? question.split("Question:").at(-1)! : question;
  return `${normalise(stem)}\u0000${options.map(normalise).join("\u0001")}`;
}

function compactExplanation(value: string) {
  const sentences = clean(value).split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  return sentences.slice(0, 4).join(" ");
}

function topicFor(number: number, category: string, rawStem: string) {
  if ((number >= 76 && number <= 80) || (number >= 101 && number <= 110)) return "Comprehension passages";
  if (number >= 81 && number <= 90) return "Cloze passages";
  const value = `${category} ${rawStem}`.toLowerCase();
  if (value.includes("vowel")) return "Vowels";
  if (value.includes("consonant")) return "Consonants";
  if (value.includes("rhyme") || value.includes("homonym") || value.includes("homophone")) return "Rhymes and homophones";
  if (value.includes("word stress")) return "Word stress";
  if (value.includes("emphatic stress")) return "Emphatic stress";
  if (value.includes("synonym") || value.includes("vocabulary")) return "Synonyms";
  if (value.includes("antonym")) return "Antonyms";
  if (value.includes("punctuation") || value.includes("spelling")) return "Mechanics";
  if (value.includes("idiom") || value.includes("sentence interpretation") || value.includes("figurative")) return "Ordinary, figurative and idiomatic usage";
  if (value.includes("passive") || value.includes("reported speech") || value.includes("conditional") || value.includes("infinitive") || value.includes("gerund")) return "Clause and sentence patterns";
  if (value.includes("preposition") || value.includes("conjunction") || value.includes("word class")) return "Word classes";
  return "Tense, aspect, number and agreement";
}

function addContext(number: number, stem: string) {
  if (number >= 76 && number <= 80) return `${comprehensionPassageA}\n\nQuestion: ${stem}`;
  if (number >= 101 && number <= 110) return `${libraryReadingText}\n\nQuestion: ${stem}`;
  return clozePrompts[number] ?? stem;
}

function parseSource(text: string, sourceFile: string): ParsedQuestion[] {
  const matches = [...text.matchAll(/^###[ \t]+(\d+)\.[ \t]*(.*)$/gm)];
  const parsed: ParsedQuestion[] = [];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const number = Number(match[1]);
    const category = clean(match[2]);
    const block = text.slice(match.index! + match[0].length, matches[index + 1]?.index ?? text.length);
    const optionMatches = [...block.matchAll(/^([A-D])\.\s+(.+?)\s*$/gm)];
    const answerMatch = block.match(/\*\*Correct answer:\s*([A-D])(?:\s+—\s*(.*?))?\*\*/i);
    const explanationMatch = block.match(/\*\*Explanation:\*\*\s*([\s\S]*?)(?=\n\s*\*\*\*|$)/i);
    if (optionMatches.length !== 4 || !answerMatch || !explanationMatch) continue;
    const headingQuestion = (number >= 76 && number <= 80) || (number >= 101 && number <= 110) ? category : "";
    const rawStem = headingQuestion || clean(block.slice(0, optionMatches[0].index));
    const options = optionMatches.map((option) => clean(option[2]));
    const answerIndex = "ABCD".indexOf(answerMatch[1].toUpperCase());
    parsed.push({
      number,
      category: category || "Unlabelled question",
      rawStem,
      question: addContext(number, rawStem),
      options,
      answerIndex,
      explanation: compactExplanation(explanationMatch[1]),
      topic: topicFor(number, category, rawStem),
      sourceFile,
    });
  }
  return parsed;
}

const allSources = await Promise.all(INPUT_FILES.map(async (file) => ({ file, text: await readFile(file, "utf8") })));
const parsed = allSources.flatMap(({ file, text }) => parseSource(text, file.split("/").pop()!));
const internalSeen = new Set<string>();
const unique: ParsedQuestion[] = [];
const internalDuplicates: ParsedQuestion[] = [];
for (const question of parsed) {
  const questionFingerprint = fingerprint(question.rawStem, question.options);
  if (internalSeen.has(questionFingerprint)) internalDuplicates.push(question);
  else {
    internalSeen.add(questionFingerprint);
    unique.push(question);
  }
}

const modelResponse = await fetch(MODEL_BANK_URL);
if (!modelResponse.ok) throw new Error(`Managed learner bank could not be read for duplicate screening (${modelResponse.status}).`);
const modelPayload = await modelResponse.json() as { questions?: Array<{ subject?: string; question?: string; options?: string[] }> };
const modelStems = new Set((modelPayload.questions ?? []).filter((question) => question.subject === "Use of English" && typeof question.question === "string" && Array.isArray(question.options)).map((question) => fingerprint(question.question!, question.options!)));
const db = await getDb();
if (!db) throw new Error("Database unavailable for duplicate screening.");
const authorisedRows = await db.select({ id: questionItems.id, questionText: questionItems.questionText, optionsJson: questionItems.optionsJson }).from(questionItems);
const authorisedStems = new Set(authorisedRows.flatMap((question) => {
  try {
    const options = JSON.parse(question.optionsJson) as string[];
    return Array.isArray(options) ? [fingerprint(question.questionText, options)] : [];
  } catch {
    return [];
  }
}));

const holds: Hold[] = [];
const eligible: Array<ParsedQuestion & { externalId: string; difficulty: "easy" | "medium" | "hard"; sourceLabel: string; permissionNote: string }> = [];
for (const question of unique) {
  const externalId = `ENG-OWNER-20260822-${String(question.number).padStart(3, "0")}`;
  if (question.number === 74) {
    holds.push({ externalId, questionNumber: question.number, reason: "Answer-integrity hold: ‘stone’ and ‘gone’ do not rhyme in the standard pronunciation needed for this Oral English item; the supplied key must not be released as correct.", question: question.rawStem });
    continue;
  }
  if (modelStems.has(fingerprint(question.rawStem, question.options)) || authorisedStems.has(fingerprint(question.rawStem, question.options))) {
    holds.push({ externalId, questionNumber: question.number, reason: "Duplicate hold: the normalized question stem already exists in the managed learner bank or authorised question ledger.", question: question.rawStem });
    continue;
  }
  if (question.answerIndex < 0 || question.answerIndex >= question.options.length || !question.options[question.answerIndex]) {
    holds.push({ externalId, questionNumber: question.number, reason: "Answer-integrity hold: the supplied answer letter does not point to a usable option.", question: question.rawStem });
    continue;
  }
  if (!question.explanation || question.explanation.length < 20) {
    holds.push({ externalId, questionNumber: question.number, reason: "Explanation hold: no usable compact, question-specific explanation could be extracted.", question: question.rawStem });
    continue;
  }
  eligible.push({
    ...question,
    externalId,
    difficulty: "medium",
    sourceLabel: "Owner-supplied English practice batch · 22 Aug 2026",
    permissionNote: "Owner-supplied study content. Imported as authorised JAMB Quest practice material; source wording and answer key remain attributable to the owner-supplied batch.",
  });
}

const staged = eligible.map(({ externalId, topic, difficulty, question, options, answerIndex, explanation, sourceLabel, permissionNote }) => ({ externalId, subject: "Use of English", topic, difficulty, question, options, answerIndex, explanation, sourceLabel, permissionNote }));
const report = {
  sourceFiles: INPUT_FILES.map((file) => file.split("/").pop()),
  parsedCount: parsed.length,
  uniqueParsedCount: unique.length,
  internalDuplicateCount: internalDuplicates.length,
  modelBankCandidateCount: modelStems.size,
  authorisedLedgerCandidateCount: authorisedStems.size,
  eligibleCount: eligible.length,
  heldCount: holds.length,
  held: holds,
  internalDuplicates: internalDuplicates.map((question) => ({ questionNumber: question.number, question: question.rawStem })),
  stagedPath: STAGED_PATH,
};
await writeFile(STAGED_PATH, `${JSON.stringify(staged, null, 2)}\n`);
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
