import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "owner_supplied_cell_diagram_inspection_20260826.json");
const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [rows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson,
      qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl,
      qs.id AS sourceId, qs.label AS sourceLabel, qs.isActive AS sourceActive
    FROM questionItems qi
    INNER JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE qi.subject = 'Biology'
      AND LOWER(qi.questionText) REGEXP 'part[[:space:]]+labelled[[:space:]]+ii[[:space:]]+is[[:space:]]+responsible'
    ORDER BY qi.id
  `);
  const records = rows.map((row) => ({
    ...row,
    options: JSON.parse(row.optionsJson),
    storedAnswer: JSON.parse(row.optionsJson)[row.answerIndex] ?? null,
  }));
  const report = {
    generatedAt: new Date().toISOString(),
    mode: "Read-only inspection. No question, source, diagram, learner eligibility, notification, or Lekki Headmaster record was changed.",
    ownerSuppliedEvidence: {
      imageFile: "/home/ubuntu/upload/361163.png",
      imageDimensions: "1522x1033",
      claimedPrompt: "The part labelled II is responsible for",
      claimedAnswer: "A. respiration",
      claimedVisualMeaning: "Label II points to a mitochondrion.",
    },
    matches: records,
  };
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, matchCount: records.length, matches: records.map(({ id, externalId, questionText, options, answerIndex, diagramUrl, sourceLabel, explanationStatus }) => ({ id, externalId, questionText, options, answerIndex, diagramUrl, sourceLabel, explanationStatus })) }, null, 2));
} finally {
  await connection.end();
}
