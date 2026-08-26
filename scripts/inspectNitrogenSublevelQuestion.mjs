import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson,
      qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl, qi.sourceId,
      qs.label AS sourceLabel
    FROM questionItems qi
    INNER JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE qi.subject = 'Chemistry'
      AND (LOWER(qi.questionText) LIKE '%nitrogen%'
        OR LOWER(qi.questionText) LIKE '%sublevel%'
        OR LOWER(qi.questionText) LIKE '%orbital%')
    ORDER BY qi.id
  `);
  const reportPath = '/home/ubuntu/jamb-quiz-game/reports/nitrogen_sublevel_question_inspection_20260826.json';
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), readOnly: true, records: rows }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, records: rows.map(({ id, externalId, topic, questionText, optionsJson, answerIndex, explanationStatus, diagramUrl, sourceLabel }) => ({ id, externalId, topic, questionText, optionsJson, answerIndex, explanationStatus, diagramUrl, sourceLabel })) }, null, 2));
} finally {
  await connection.end();
}
