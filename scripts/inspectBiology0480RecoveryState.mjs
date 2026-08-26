import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, topic, sourceId, diagramUrl, explanationStatus
     FROM questionItems
     WHERE externalId = ?
     LIMIT 1`,
    ["biology_0480"],
  );
  if (rows.length !== 1) throw new Error("Expected exactly one protected biology_0480 record.");
  console.log(JSON.stringify({ scope: "Read-only protected-state inspection; no learner or database content changed.", record: rows[0] }, null, 2));
} finally {
  await connection.end();
}
