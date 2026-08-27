import { readFileSync } from "node:fs";
const data = JSON.parse(readFileSync("/tmp/first-owner-image-candidates.json", "utf8"));
for (const group of data) {
  console.log(`\n### ${group.label}`);
  for (const row of group.matches.slice(0, 20)) {
    console.log(JSON.stringify({ id: row.id, externalId: row.externalId, subject: row.subject, questionText: row.questionText, optionsJson: row.optionsJson, answerIndex: row.answerIndex, topic: row.topic, explanationStatus: row.explanationStatus, diagramUrl: row.diagramUrl }));
  }
}
