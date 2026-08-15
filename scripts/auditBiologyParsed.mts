import { readFile, writeFile } from "node:fs/promises";
import { inferVerifiedTopic } from "../shared/topicInference";

const parsed = JSON.parse(await readFile("reports/biology_docx_parsed.json", "utf8")) as { records: Array<{ sourceId: string; sourceNumber: number; questionText: string; options: string[]; answerLetter: string | null; answerText: string | null; explanation: string; rawBlock: string[] }> };
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const seen = new Map<string, string>();
const details = parsed.records.map((record) => {
  const reasons: string[] = [];
  const topic = inferVerifiedTopic("Biology", record.questionText);
  if (!topic || topic === "Unclassified") reasons.push("unmapped-topic");
  if (record.options.length < 4 || record.options.length > 5) reasons.push(`option-count:${record.options.length}`);
  const expected = record.answerLetter ? record.answerLetter.charCodeAt(0) - 65 : -1;
  if (expected < 0 || expected >= record.options.length) reasons.push("answer-index-out-of-range");
  const answerOption = expected >= 0 ? record.options[expected] ?? "" : "";
  if (record.answerText && !normalise(answerOption).includes(normalise(record.answerText))) reasons.push("answer-text-mismatch");
  const explanationLines = record.explanation.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (explanationLines.length > 5) reasons.push(`explanation-lines:${explanationLines.length}`);
  const key = normalise(record.questionText);
  const duplicateOf = seen.get(key);
  if (duplicateOf) reasons.push(`duplicate-of:${duplicateOf}`);
  else seen.set(key, record.sourceId);
  return { sourceId: record.sourceId, sourceNumber: record.sourceNumber, topic, explanationLines: explanationLines.length, optionCount: record.options.length, answerLetter: record.answerLetter, duplicateOf: duplicateOf ?? null, reasons, releaseCandidate: reasons.length === 0 };
});
const report = {
  generatedAt: new Date().toISOString(),
  inputCount: details.length,
  releaseCandidateCount: details.filter((item) => item.releaseCandidate).length,
  heldCount: details.filter((item) => !item.releaseCandidate).length,
  topicCounts: details.reduce<Record<string, number>>((counts, item) => { counts[item.topic] = (counts[item.topic] ?? 0) + 1; return counts; }, {}),
  reasonCounts: details.flatMap((item) => item.reasons.map((reason) => reason.replace(/:.*/, ""))).reduce<Record<string, number>>((counts, reason) => { counts[reason] = (counts[reason] ?? 0) + 1; return counts; }, {}),
  details,
};
await writeFile("reports/biology_quality_audit.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ inputCount: report.inputCount, releaseCandidateCount: report.releaseCandidateCount, heldCount: report.heldCount, reasonCounts: report.reasonCounts, topicCounts: report.topicCounts }, null, 2));
process.exit(0);
