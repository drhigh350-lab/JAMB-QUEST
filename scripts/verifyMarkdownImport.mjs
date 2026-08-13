import { readFile } from "node:fs/promises";

const inputs = process.argv.slice(2);
if (!inputs.length) throw new Error("Provide one or more validated JSON payloads.");
const results = [];
for (const input of inputs) {
  const records = JSON.parse(await readFile(input, "utf8"));
  const idsBySource = new Map();
  const questions = new Set();
  const labelsBySubject = new Map();
  for (const record of records) {
    const ids = idsBySource.get(record.sourceLabel) ?? new Set();
    if (ids.has(record.externalId)) throw new Error(`${input}: duplicate externalId ${record.externalId} within ${record.sourceLabel}`);
    ids.add(record.externalId);
    idsBySource.set(record.sourceLabel, ids);
    const fingerprint = `${record.subject}:${record.question.trim().toLowerCase()}`;
    if (questions.has(fingerprint)) throw new Error(`${input}: duplicate question ${record.question}`);
    questions.add(fingerprint);
    const labels = labelsBySubject.get(record.subject) ?? new Set();
    labels.add(record.sourceLabel);
    labelsBySubject.set(record.subject, labels);
    if (!record.permissionNote.includes("Owner-provided")) throw new Error(`${input}: missing owner-provided permission note`);
  }
  const subjectSummary = Object.fromEntries([...labelsBySubject.entries()].map(([subject, labels]) => [subject, { count: records.filter((record) => record.subject === subject).length, labels: [...labels] }]));
  results.push({ input, total: records.length, uniqueExternalIdsWithinSources: [...idsBySource.values()].reduce((total, ids) => total + ids.size, 0), subjectSummary });
}
console.log(JSON.stringify({ verified: true, files: results }, null, 2));
