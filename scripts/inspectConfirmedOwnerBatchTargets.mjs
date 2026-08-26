import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const reportPath = path.join("/home/ubuntu/jamb-quiz-game", "reports", "confirmed_owner_batch_targets_20260826.json");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson, qi.answerIndex,
      qi.explanation, qi.explanationStatus, qi.diagramUrl, qi.sourceId, qs.label AS sourceLabel, qs.isActive AS sourceActive
    FROM questionItems qi INNER JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE qi.id IN (660007, 750005, 750006)
       OR qi.diagramUrl = '/manus-storage/owner-bio-diagram-2025-001_7a12c1dc.png'
    ORDER BY qi.id
  `);
  const records = rows.map((row) => {
    const options = JSON.parse(row.optionsJson);
    return { ...row, options, savedAnswer: options[row.answerIndex] ?? null };
  });
  const report = { generatedAt: new Date().toISOString(), mode: "Read-only target check. No question, image, answer, or source was changed.", records };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, records: records.map(({ id, externalId, subject, questionText, diagramUrl, sourceLabel, savedAnswer }) => ({ id, externalId, subject, questionText, diagramUrl, sourceLabel, savedAnswer })) }, null, 2));
} finally {
  await connection.end();
}
