import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import mysql from "mysql2/promise";
import { inferVerifiedTopic } from "../shared/topicInference.ts";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.execute("SELECT id, subject, questionText FROM questionItems WHERE topic = ? AND explanationStatus = 'approved' ORDER BY subject, id", ["To be tagged during syllabus mapping"]);
await connection.end();

const classified = [];
const unresolved = [];
for (const row of rows) {
  const subject = row.subject;
  const topic = ["Use of English", "Biology", "Chemistry", "Physics"].includes(subject) ? inferVerifiedTopic(subject, row.questionText) : null;
  const record = { id: row.id, subject, questionText: row.questionText, topic };
  if (topic) classified.push(record);
  else unresolved.push(record);
}
const grouped = Object.fromEntries(["Use of English", "Biology", "Chemistry", "Physics"].map((subject) => [subject, {
  classified: classified.filter((record) => record.subject === subject).length,
  unresolved: unresolved.filter((record) => record.subject === subject).length,
  topics: Object.fromEntries(Array.from(new Set(classified.filter((record) => record.subject === subject).map((record) => record.topic))).sort().map((topic) => [topic, classified.filter((record) => record.subject === subject && record.topic === topic).length])),
}]));
const report = { placeholderTopic: "To be tagged during syllabus mapping", total: rows.length, classifiedCount: classified.length, unresolvedCount: unresolved.length, bySubject: grouped, classified, unresolved };
const outputPath = resolve("reports/placeholder_topic_audit.json");
const sqlPath = resolve("reports/placeholder_topic_migration.sql");
const updates = classified.map((record) => `UPDATE questionItems SET topic = ${JSON.stringify(record.topic)} WHERE id = ${Number(record.id)} AND topic = 'To be tagged during syllabus mapping';`).join("\n");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(report, null, 2));
await writeFile(sqlPath, `${updates}\n`);
console.log(JSON.stringify({ outputPath, sqlPath, total: report.total, classifiedCount: report.classifiedCount, unresolvedCount: report.unresolvedCount, bySubject: report.bySubject }, null, 2));
