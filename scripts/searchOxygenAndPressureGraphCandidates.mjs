import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, topic, explanationStatus, diagramUrl
     FROM questionItems
     WHERE questionText LIKE '%oxygen%'
        OR questionText LIKE '%O2%'
        OR questionText LIKE '%pressure-volume%'
        OR questionText LIKE '%pressure volume%'
        OR questionText LIKE '%PV%'
        OR questionText LIKE '%Boyle%'
     ORDER BY subject, id`,
  );
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await connection.end();
}
