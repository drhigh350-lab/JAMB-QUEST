import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, questionText, optionsJson, answerIndex, explanation, explanationStatus, topic, sourceId, diagramUrl
     FROM questionItems
     WHERE subject = 'Physics'
       AND (questionText LIKE '%slit%' OR questionText LIKE '%opening%' OR questionText LIKE '%obstacle%' OR questionText LIKE '%barrier%' OR questionText LIKE '%wavefront%' OR questionText LIKE '%bend%')
     ORDER BY id`,
  );
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await connection.end();
}
