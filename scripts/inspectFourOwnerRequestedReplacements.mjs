import mysql from "mysql2/promise";

const externalIds = [
  "OWNER-BIO-DIAGRAM-2025-004",
  "OWNER-BIO-DIAGRAM-2025-003",
  "kairo-csv-chemistry_ea3781",
  "kairo-csv-chemistry_bcfca8",
];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, explanationStatus, topic, sourceId, diagramUrl
     FROM questionItems WHERE externalId IN (${externalIds.map(() => "?").join(",")}) ORDER BY id`,
    externalIds,
  );
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await connection.end();
}
