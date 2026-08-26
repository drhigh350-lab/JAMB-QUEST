import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const externalIds = ["kairo-csv-chemistry_2bdf6a", "supplied-keyed-2021-chemistry-036"];
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const placeholders = externalIds.map(() => "?").join(",");
  const [rows] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanation, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE externalId IN (${placeholders}) ORDER BY FIELD(externalId, ${placeholders})`, [...externalIds, ...externalIds]);
  const reportPath = "/home/ubuntu/jamb-quiz-game/reports/nitrogen_picture_move_inspection_20260826.json";
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), readOnly: true, records: rows }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, records: rows }, null, 2));
} finally {
  await connection.end();
}
