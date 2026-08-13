import { readFile, writeFile } from "node:fs/promises";

const staging = JSON.parse(await readFile("/home/ubuntu/jamb_question_bank/lekki_headmaster/lekki-headmaster-staging.json", "utf8"));
const normalise = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const results = staging.accepted.map((record) => {
  const selected = record.options[record.answer.key];
  const keyText = record.answer.answerText;
  const selectedNorm = normalise(selected);
  const keyNorm = normalise(keyText);
  const exact = selectedNorm === keyNorm;
  const compatible = exact || (selectedNorm.length > 10 && (selectedNorm.includes(keyNorm) || keyNorm.includes(selectedNorm)));
  return { externalId: record.externalId, chapter: record.chapter, questionOrdinal: record.questionOrdinal, key: record.answer.key, selected, answerText: keyText, status: compatible ? "aligned" : "mismatch", exact };
});
const aligned = results.filter((result) => result.status === "aligned");
const mismatches = results.filter((result) => result.status === "mismatch");
await writeFile("/home/ubuntu/jamb_question_bank/lekki_headmaster/lekki-key-validation.json", `${JSON.stringify({ total: results.length, aligned: aligned.length, mismatches: mismatches.length, results }, null, 2)}\n`);
console.log(JSON.stringify({ total: results.length, aligned: aligned.length, mismatches: mismatches.length, mismatchSample: mismatches.slice(0, 12) }, null, 2));
if (mismatches.length) process.exitCode = 2;
