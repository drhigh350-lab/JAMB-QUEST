import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson,
      qi.answerIndex, qi.explanationStatus, qi.diagramUrl, qi.sourceId,
      qs.label AS sourceLabel, qs.isActive AS sourceActive
    FROM questionItems qi
    INNER JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE qi.externalId IN ('kairo-csv-chemistry_1ea741')
       OR qi.diagramUrl IN (
         '/manus-storage/jamb-quest-chemistry-organic-structure_OLD.png',
         '/manus-storage/jamb-quest-chemistry-energy-profile_OLD.png',
         '/manus-storage/chemistry-organic-structure-original_fa400ff1.png',
         '/manus-storage/chemistry-energy-profile-original_3e1f7670.png'
       )
       OR qi.questionText LIKE '%Choose the correct option from the structure above%'
       OR qi.questionText LIKE '%activation energy%'
       OR qi.diagramUrl LIKE '%chemistry%organic%'
       OR qi.diagramUrl LIKE '%chemistry%energy%'
    ORDER BY qi.id
  `);
  const report = { generatedAt: new Date().toISOString(), readOnly: true, records: rows };
  const reportPath = '/home/ubuntu/jamb-quiz-game/reports/latest_chemistry_rollback_targets_20260826.json';
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, records: rows.map(({ id, externalId, subject, topic, questionText, explanationStatus, diagramUrl, sourceLabel }) => ({ id, externalId, subject, topic, questionText, explanationStatus, diagramUrl, sourceLabel })) }, null, 2));
} finally {
  await connection.end();
}
