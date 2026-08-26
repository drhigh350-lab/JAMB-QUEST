import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, questionText, optionsJson, answerIndex, explanation, topic, explanationStatus, diagramUrl
     FROM questionItems
     WHERE subject = 'Physics'
       AND diagramUrl IS NOT NULL
       AND (topic LIKE '%Gas%' OR questionText LIKE '%graph%' OR questionText LIKE '%curve%' OR questionText LIKE '%pressure%')
     ORDER BY id`,
  );
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await connection.end();
}
