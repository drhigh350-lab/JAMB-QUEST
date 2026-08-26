import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, topic, explanationStatus, diagramUrl
     FROM questionItems
     WHERE topic LIKE '%Photosynthesis%' OR topic LIKE '%Gas law%' OR topic LIKE '%Gas Law%'
     ORDER BY subject, id`,
  );
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await connection.end();
}
