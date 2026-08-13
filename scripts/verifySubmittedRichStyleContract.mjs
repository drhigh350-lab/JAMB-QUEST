import { readFile } from "node:fs/promises";

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Usage: node scripts/verifySubmittedRichStyleContract.mjs <style-conditioned-enrichment-output-json>");
const records = JSON.parse(await readFile(inputPath, "utf8"));
const approved = records.filter((record) => record.quality_gate && !record.needs_review);
const banned = ["this question tests your understanding", "revisit", "before moving to the next question", "read the key wording", "owner-provided", "verification pending"];
const failures = approved.flatMap((record) => {
  const joined = record.lines.join(" ").toLowerCase();
  const firstLine = record.lines[0]?.toLowerCase() ?? "";
  const questionTerms = String(record.question).toLowerCase().match(/[a-z]{4,}/g) ?? [];
  const reasons = [];
  if (record.style_reference_used !== true) reasons.push("submitted style reference was not applied");
  if (!Array.isArray(record.lines) || record.lines.length !== 6) reasons.push("requires exactly six generated lines");
  if (joined.split(/\s+/).filter(Boolean).length < 75) reasons.push("requires at least 75 words");
  if (firstLine.startsWith("answer:") || firstLine.startsWith("correct answer")) reasons.push("must begin concept-first rather than with a generic answer cue");
  if (banned.some((phrase) => joined.includes(phrase))) reasons.push("contains generic or provenance wording");
  if (!questionTerms.some((term) => joined.includes(term))) reasons.push("does not connect back to the question concept");
  return reasons.length ? [{ id: record.id, reasons }] : [];
});
if (failures.length) throw new Error(`Submitted rich style contract failed for ${failures.length} records: ${JSON.stringify(failures.slice(0, 5))}`);
console.log(JSON.stringify({ verified: true, total: records.length, approved: approved.length, modelHeldForReview: records.length - approved.length, styleReferenceApplied: approved.every((record) => record.style_reference_used === true) }, null, 2));
