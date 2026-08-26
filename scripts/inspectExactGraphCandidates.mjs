import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [oxygen] = await connection.execute(
    `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, topic, explanationStatus, diagramUrl
     FROM questionItems
     WHERE subject = 'Biology' AND questionText LIKE '%oxygen%' AND diagramUrl IS NOT NULL
     ORDER BY id`,
  );
  const [pressure] = await connection.execute(
    `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, topic, explanationStatus, diagramUrl
     FROM questionItems
     WHERE subject = 'Physics' AND (questionText LIKE '%pressure%' OR questionText LIKE '%Boyle%' OR topic LIKE '%Gas%')
     ORDER BY id`,
  );
  console.log(JSON.stringify({ oxygen, pressure }, null, 2));
} finally {
  await connection.end();
}
