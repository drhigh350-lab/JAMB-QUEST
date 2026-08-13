import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const sourcePdf = "/home/ubuntu/jamb_question_bank/new_owner_sources/lekki_headmaster_2026_08_13/THE_LEKKI_HEADMASTER_101_QUESTIONS_COMPEDIUM(1).pdf";
const outputDir = "/home/ubuntu/jamb-import-staging";
const outputFile = path.join(outputDir, "lekki-headmaster-101-compendium-staging.json");
const reportFile = path.join(outputDir, "lekki-headmaster-101-compendium-report.json");
const raw = execFileSync("pdftotext", ["-raw", sourcePdf, "-"], { encoding: "utf8", maxBuffer: 12 * 1024 * 1024 });
const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const chunks = [...raw.matchAll(/(?:^|[\n\f])Question\s+(\d+)\s*\n([\s\S]*?)(?=(?:[\n\f]Question\s+\d+\s*\n)|$)/g)];
const questions = [];
const rejected = [];
for (const chunk of chunks) {
  const number = Number(chunk[1]);
  const body = chunk[2].replace(/^This question is based on Kabir\s+Garba’s The Lekki Headmaster\.\s*/m, "").trim();
  const answerPosition = body.search(/\nAnswer:\s*[A-D]\)/);
  const optionText = answerPosition === -1 ? body : body.slice(0, answerPosition);
  const answerMatch = body.match(/\nAnswer:\s*([A-D])\)\s*([\s\S]*?)(?=\nExplanation:|$)/);
  const explanationMatch = body.match(/\nExplanation:\s*([\s\S]*)$/);
  const optionMatches = [...optionText.matchAll(/(?:^|\n)([A-D])\)\s*([\s\S]*?)(?=\n[A-D]\)|$)/g)];
  const questionText = optionText.slice(0, optionMatches[0]?.index ?? optionText.length).trim().replace(/\s+/g, " ");
  const options = optionMatches.map((match) => match[2].replace(/\s+/g, " ").trim());
  const answerIndex = answerMatch ? answerMatch[1].charCodeAt(0) - 65 : -1;
  const answerText = answerMatch?.[2].replace(/\s+/g, " ").trim() ?? "";
  const explanation = explanationMatch?.[1].replace(/\s+/g, " ").trim() ?? "";
  const aligned = answerIndex >= 0 && options.length === 4 && normalize(options[answerIndex]) === normalize(answerText);
  if (!questionText || !aligned || !explanation) {
    rejected.push({ number, reason: !questionText ? "missing_question" : options.length !== 4 ? "options_not_four" : !answerMatch ? "missing_answer" : !aligned ? "answer_option_mismatch" : "missing_explanation" });
    continue;
  }
  questions.push({ externalId: `lekki-101-${String(number).padStart(3, "0")}`, subject: "Use of English", topic: "The Lekki Headmaster", difficulty: "medium", question: questionText, options, answerIndex, explanation });
}
mkdirSync(outputDir, { recursive: true });
writeFileSync(outputFile, JSON.stringify({ sourcePdf, sourceLabel: "Owner-provided · The Lekki Headmaster 101 Questions Compendium", provenance: "verification-pending", questions }, null, 2));
writeFileSync(reportFile, JSON.stringify({ sourcePdf, questionHeadingsFound: chunks.length, accepted: questions.length, rejectedCount: rejected.length, rejected }, null, 2));
console.log(JSON.stringify({ sourcePdf, questionHeadingsFound: chunks.length, accepted: questions.length, rejectedCount: rejected.length, outputFile, reportFile }, null, 2));
