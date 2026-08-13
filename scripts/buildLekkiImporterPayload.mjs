import { readFile, writeFile } from "node:fs/promises";

const staging = JSON.parse(await readFile("/home/ubuntu/jamb_question_bank/lekki_headmaster/lekki-headmaster-staging.json", "utf8"));
const questions = staging.accepted.map((record) => ({
  externalId: record.externalId,
  subject: "Use of English",
  topic: "The Lekki Headmaster",
  difficulty: "medium",
  question: record.stem,
  options: [record.options.A, record.options.B, record.options.C, record.options.D],
  answerIndex: ["A", "B", "C", "D"].indexOf(record.answer.key),
  explanation: "Verification pending: this authorised novel study question has a source answer key, but its OCR extraction and answer alignment still require review before it is presented as verified exam content.",
}));
const payload = questions.map((question) => ({
  ...question,
  sourceLabel: "The Lekki Headmaster — DailyEd Likely UTME Questions · Verification Pending",
  permissionNote: "Owner-authorised Drive study material. The PDF states that it is independently developed, is not affiliated with JAMB, and does not guarantee appearance in UTME. Novel provenance: The Lekki Headmaster."
}));
await writeFile("/home/ubuntu/jamb-quiz-game/lekki-headmaster-import-payload.json", `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ payloadRecords: payload.length, sourceLabel: payload[0]?.sourceLabel, chapters: [...new Set(staging.accepted.map((record) => record.chapter))] }, null, 2));
