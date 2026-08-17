import fs from "node:fs";

const input = process.argv[2] ?? "/tmp/authorised-playable-live.json";
const output = process.argv[3] ?? "reports/live_diagram_reference_audit_aug17.json";
const payload = JSON.parse(fs.readFileSync(input, "utf8"));
const questions = payload?.[0]?.result?.data?.json ?? [];
const referencePattern = /\b(diagram|figure|graph|chart|illustration|shown above|shown below|structure above|compound above)\b/i;
const referenced = questions.filter((question) => referencePattern.test(String(question.question ?? "")));
const withAsset = referenced.filter((question) => typeof question.diagram_url === "string" && question.diagram_url.length > 0);
const missingAsset = referenced.filter((question) => !question.diagram_url);
const bySubject = Object.fromEntries(["Use of English", "Biology", "Chemistry", "Physics"].map((subject) => [subject, {
  total: referenced.filter((question) => question.subject === subject).length,
  withAsset: withAsset.filter((question) => question.subject === subject).length,
  missingAsset: missingAsset.filter((question) => question.subject === subject).length,
}]));
const report = {
  generatedAt: new Date().toISOString(),
  source: input,
  totalQuestions: questions.length,
  diagramReferenceCount: referenced.length,
  diagramReferenceWithAssetCount: withAsset.length,
  diagramReferenceMissingAssetCount: missingAsset.length,
  bySubject,
  withAssetRecords: withAsset.map(({ id, subject, topic, question, diagram_url }) => ({ id, subject, topic, question, diagram_url })),
  missingAssetRecords: missingAsset.map(({ id, subject, topic, question, answer_index }) => ({ id, subject, topic, question, answer_index })),
};
fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ output, totalQuestions: report.totalQuestions, diagramReferenceCount: report.diagramReferenceCount, withAsset: report.diagramReferenceWithAssetCount, missingAsset: report.diagramReferenceMissingAssetCount, bySubject }, null, 2));
