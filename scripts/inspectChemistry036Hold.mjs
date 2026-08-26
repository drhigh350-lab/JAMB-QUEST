import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson,
      qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl,
      qi.sourceId, qs.label AS sourceLabel, qs.isActive AS sourceActive
    FROM questionItems qi
    INNER JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE qi.externalId = ?
  `, ["supplied-keyed-2021-chemistry-036"]);
  const report = { generatedAt: new Date().toISOString(), readOnly: true, records: rows };
  await fs.writeFile("/home/ubuntu/jamb-quiz-game/reports/chemistry_036_hold_inspection_20260826.json", `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await connection.end();
}
