import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const sourcePdf = "/home/ubuntu/jamb_question_bank/new_owner_sources/lekki_headmaster_2026_08_13/120-POSSIBLEJAMBQUESTIONSONTHELEKKIHEADMASTERNOVEL.pdf";
const outputDir = "/home/ubuntu/jamb-import-staging";
const outputFile = path.join(outputDir, "lekki-headmaster-120-keyed-staging.json");
const reportFile = path.join(outputDir, "lekki-headmaster-120-keyed-report.json");
const raw = execFileSync("pdftotext", ["-raw", sourcePdf, "-"], { encoding: "utf8", maxBuffer: 12 * 1024 * 1024 });
const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const answerStart = raw.search(/(?:^|[\n\f])1\.\s+Correct Option\s+[A-D]\b/m);
if (answerStart < 0) throw new Error("Could not locate the Correct Option answer-key section.");
const questionBlock = raw.slice(0, answerStart);
const answerBlock = raw.slice(answerStart);
const keyMap = new Map([...answerBlock.matchAll(/(?:^|[\n\f])(\d+)\.\s+Correct Option\s+([A-D])\b/g)].map((match) => [Number(match[1]), match[2]]));
const chunks = [...questionBlock.matchAll(/(?:^|[\n\f])(\d+)\.\s+([\s\S]*?)(?=(?:[\n\f]\d+\.\s+)|$)/g)];
const questions = [];
const rejected = [];
for (const chunk of chunks) {
  const number = Number(chunk[1]);
  const body = chunk[2].trim();
  const optionMatches = [...body.matchAll(/(?:^|\n)([A-D])\.\s*([\s\S]*?)(?=\n[A-D]\.\s*|$)/g)];
  const question = body.slice(0, optionMatches[0]?.index ?? body.length).replace(/\s+/g, " ").trim();
  const options = optionMatches.map((match) => match[2].replace(/\s+/g, " ").trim());
  const answerLetter = keyMap.get(number);
  if (!question || options.length !== 4 || !answerLetter) {
    rejected.push({ number, reason: !question ? "missing_question" : options.length !== 4 ? "options_not_four" : "missing_key" });
    continue;
  }
  questions.push({ externalId: `lekki-120-${String(number).padStart(3, "0")}`, subject: "Use of English", topic: "The Lekki Headmaster", difficulty: "medium", question, options, answerIndex: answerLetter.charCodeAt(0) - 65, explanation: `Source key: option ${answerLetter}. Verification pending: the supplied source rationale must be checked before learner release.` });
}
mkdirSync(outputDir, { recursive: true });
writeFileSync(outputFile, JSON.stringify({ sourcePdf, sourceLabel: "Owner-provided · 120 Possible Lekki Headmaster Questions", provenance: "verification-pending", questions }, null, 2));
writeFileSync(reportFile, JSON.stringify({ sourcePdf, questionCandidates: chunks.length, keyCount: keyMap.size, accepted: questions.length, rejectedCount: rejected.length, rejected, keyCoverage: questions.length ? [...new Set(questions.map((item) => item.answerIndex))] : [] }, null, 2));
console.log(JSON.stringify({ sourcePdf, questionCandidates: chunks.length, keyCount: keyMap.size, accepted: questions.length, rejectedCount: rejected.length, outputFile, reportFile }, null, 2));
