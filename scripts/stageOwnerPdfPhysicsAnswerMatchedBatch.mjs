import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { and, eq } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { inferVerifiedTopic } from "../shared/topicInference";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";

const uploads = "/home/ubuntu/upload";
const textPath = "/home/ubuntu/jamb-intake-tmp/jamb_questions_only.txt";
const outputPath = resolve("reports", "owner_pdf_physics_1_250_staged_20260825.json");
const modelBankUrl = "https://3000-iobewn6v6k0sqroneio5d-c3a4c244.us4.manus.computer/manus-storage/jamb_high_yield_practice_bank_1000_model_v5_explanations_reviewed_688e6cd1.json";

function normalize(value) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (character) => ({ "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" })[character] ?? character)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function equivalentAnswerText(left, right) {
  const compact = (value) => value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (character) => ({ "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" })[character] ?? character)
    .replace(/[^a-z0-9]+/g, "");
  return compact(left) === compact(right);
}

function resolvePhysicsTopic(sourceTopic, question) {
  const direct = resolveSyllabusTopic("Physics", sourceTopic);
  if (direct) return direct;
  const text = question.toLowerCase();
  if (/scalar quantity|vector quantity|dimension of|si unit|least count|prefix kilo/.test(text)) return "Measurements and units";
  if (/distance-time|velocity-time|newton.?s first law|momentum|impulse|centripetal|projectile|accelerates|average speed/.test(text)) return "Motion";
  if (/weight|satellite|astronaut.*moon|gravity/.test(text)) return "Gravitational field";
  if (/efficiency of a machine|machine takes .*input.*useful output/.test(text)) return "Machines";
  if (/hooke|force-extension|spring/.test(text)) return "Elasticity";
  if (/pressure is|knife.*pressure/.test(text)) return "Pressure";
  if (/liquid pressure|pressure at a depth|upthrust|floating body|relative density|fully immersed/.test(text)) return "Liquids at rest";
  if (/^density is$|occupies .*m3.*density/.test(text)) return "Structure of matter and kinetic theory";
  if (/echo|sound is|pitch of/.test(text)) return "Propagation of sound";
  if (/reflection|incident ray/.test(text)) return "Reflection";
  if (/refractive index|total internal reflection/.test(text)) return "Refraction";
  if (/capacitance|capacitor/.test(text)) return "Capacitors";
  if (/soft iron core/.test(text)) return "Magnets and magnetic fields";
  if (/alternating current|ac supply/.test(text)) return "AC circuits";
  if (/alpha particle|gamma radiation|radioactive|nuclear|nucleus of an atom|beta-minus/.test(text)) return "Modern physics";
  return resolveSyllabusTopic("Physics", inferVerifiedTopic("Physics", question) ?? "");
}

function parseAnswerEntries(text, min, max) {
  const heading = /^\*\*(\d+)\.\s+([A-D])\s+—\s+(.+?)\*\*(?:\s+—\s*(.*))?$/gm;
  const matches = [...text.matchAll(heading)];
  return new Map(matches.flatMap((match, index) => {
    const number = Number(match[1]);
    if (number < min || number > max) return [];
    const nextStart = matches[index + 1]?.index ?? text.length;
    const body = text.slice((match.index ?? 0) + match[0].length, nextStart).trim();
    return [[number, {
      key: match[2],
      answerText: match[3].trim(),
      explanation: [match[4]?.trim(), body].filter(Boolean).join("\n").trim(),
    }]];
  }));
}

function parsePdfPhysics(text) {
  const section = text.slice(text.indexOf("\nPhysics\n") + "\nPhysics\n".length).replace(/\f/g, "\n");
  const heading = /(?:^|\n)(\d+)\. ([^\n]+)\n/g;
  const matches = [...section.matchAll(heading)];
  return matches.flatMap((match, index) => {
    const number = Number(match[1]);
    if (number < 1 || number > 250) return [];
    const nextStart = matches[index + 1]?.index ?? section.length;
    const lines = section.slice((match.index ?? 0) + match[0].length, nextStart)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const optionStart = lines.findIndex((line) => /^A\.\s+/.test(line));
    if (optionStart < 1) return [[number, { number, sourceTopic: match[2].trim(), parseError: "missing question/options boundary" }]];
    const question = lines.slice(0, optionStart).join(" ").trim();
    const options = [];
    let current = null;
    for (const line of lines.slice(optionStart)) {
      const option = line.match(/^([A-D])\.\s+(.+)$/);
      if (option) {
        current = option[1].charCodeAt(0) - 65;
        options[current] = option[2].trim();
      } else if (current !== null) {
        options[current] = `${options[current]} ${line}`.trim();
      }
    }
    return [[number, { number, sourceTopic: match[2].trim(), question, options }]];
  });
}

const [rawPdfText, batch8, batch9, batch10] = await Promise.all([
  readFile(textPath, "utf8"),
  readFile(resolve(uploads, "Batch8_Chem201-250_Phys1-50.md"), "utf8"),
  readFile(resolve(uploads, "Physics_Batch9_Q51-150.md"), "utf8"),
  readFile(resolve(uploads, "Physics_Batch10_Q151-250_FINAL.md"), "utf8"),
]);

const pdfByNumber = new Map(parsePdfPhysics(rawPdfText));
const answers = new Map([
  ...parseAnswerEntries(batch8, 1, 50),
  ...parseAnswerEntries(batch9, 51, 150),
  ...parseAnswerEntries(batch10, 151, 250),
]);

const db = await getDb();
if (!db) throw new Error("Database unavailable for safe staging");
const modelResponse = await fetch(modelBankUrl);
if (!modelResponse.ok) throw new Error(`Active model-bank asset failed to load (${modelResponse.status})`);
const modelPayload = await modelResponse.json();
const modelQuestions = Array.isArray(modelPayload?.questions) ? modelPayload.questions : [];
const activeRows = await db.select({
  externalId: questionItems.externalId,
  subject: questionItems.subject,
  questionText: questionItems.questionText,
}).from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1)));
const liveFingerprints = new Map(activeRows.map((row) => [`${row.subject}:${normalize(row.questionText)}`, row.externalId]));
const modelFingerprints = new Map(modelQuestions.flatMap((row) => (
  row && typeof row === "object" && typeof row.subject === "string" && typeof row.question === "string" && typeof row.id === "string"
    ? [[`${row.subject}:${normalize(row.question)}`, row.id]]
    : []
)));

const staged = [];
const holds = [];
for (let number = 1; number <= 250; number += 1) {
  const question = pdfByNumber.get(number);
  const answer = answers.get(number);
  if (!question || question.parseError || !answer) {
    holds.push({ sourceNumber: number, reason: question?.parseError ?? "missing raw question or supplied answer entry" });
    continue;
  }
  const answerIndex = answer.key.charCodeAt(0) - 65;
  const selectedOption = question.options[answerIndex] ?? "";
  const keyAndOptionMatch = equivalentAnswerText(selectedOption, answer.answerText);
  const officialTopic = resolvePhysicsTopic(question.sourceTopic, question.question);
  const duplicateOf = liveFingerprints.get(`Physics:${normalize(question.question)}`) ?? null;
  const modelDuplicateOf = modelFingerprints.get(`Physics:${normalize(question.question)}`) ?? null;
  const crossReference = /(?:this repeats(?: and reinforces)? question|established conceptually in question|directly connects? to question)/i.test(answer.explanation);
  const wrapperVariant = /^which option best explains the following/i.test(question.question);
  const missingOption = question.options.length !== 4 || question.options.some((option) => !option);
  const record = {
    externalId: `jamb-questions-only-physics-${String(number).padStart(3, "0")}`,
    sourceNumber: number,
    subject: "Physics",
    sourceTopic: question.sourceTopic,
    topic: officialTopic,
    question: question.question,
    options: question.options,
    answerIndex,
    suppliedAnswerText: answer.answerText,
    explanation: answer.explanation,
    containsCrossReference: crossReference,
    duplicateOf,
    modelDuplicateOf,
  };
  const evidence = { externalId: record.externalId, sourceNumber: number, questionPreview: question.question.slice(0, 180) };
  if (wrapperVariant) holds.push({ ...evidence, reason: "wrapper variant repeats an earlier PDF concept and is not a new learner question" });
  else if (!keyAndOptionMatch) holds.push({ ...evidence, reason: "supplied key/answer text does not match PDF option", selectedOption, suppliedAnswerText: answer.answerText });
  else if (!officialTopic) holds.push({ ...evidence, reason: "no official Physics syllabus mapping", sourceTopic: question.sourceTopic });
  else if (missingOption) holds.push({ ...evidence, reason: "PDF option-shape gate failed" });
  else if (duplicateOf) holds.push({ ...evidence, reason: "duplicate of active authorised record", duplicateOf });
  else if (modelDuplicateOf) holds.push({ ...evidence, reason: "duplicate of active model-bank record", duplicateOf: modelDuplicateOf });
  else staged.push(record);
}

const report = {
  generatedAt: new Date().toISOString(),
  sourceFiles: ["jamb_questions_only.pdf", "Batch8_Chem201-250_Phys1-50.md", "Physics_Batch9_Q51-150.md", "Physics_Batch10_Q151-250_FINAL.md"],
  scope: "Staging only. No database or learner-bank record was altered.",
  totals: {
    expectedPhysicsQuestions: 250,
    parsedPdfQuestions: pdfByNumber.size,
    suppliedAnswerEntries: answers.size,
    activeModelQuestions: modelQuestions.length,
    staged: staged.length,
    held: holds.length,
    holdsByReason: Object.fromEntries(Object.entries(holds.reduce((counts, hold) => ({ ...counts, [hold.reason]: (counts[hold.reason] ?? 0) + 1 }), {})).sort(([a], [b]) => a.localeCompare(b))),
  },
  staged,
  holds,
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, totals: report.totals }, null, 2));
process.exit(0);
