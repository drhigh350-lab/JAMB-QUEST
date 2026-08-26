import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [oxygen] = await connection.execute(
    `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanationStatus, diagramUrl
     FROM questionItems
     WHERE questionText LIKE '%volume of oxygen%'
        OR questionText LIKE '%volume of O%'
        OR questionText LIKE '%oxygen produced%'
        OR questionText LIKE '%oxygen used%'
     ORDER BY id`,
  );
  const [pressure] = await connection.execute(
    `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanationStatus, diagramUrl
     FROM questionItems
     WHERE subject = 'Physics'
       AND optionsJson LIKE '%"K"%'
       AND optionsJson LIKE '%"L"%'
       AND optionsJson LIKE '%"M"%'
       AND optionsJson LIKE '%"N"%'
     ORDER BY id`,
  );
  console.log(JSON.stringify({ oxygen, pressure }, null, 2));
} finally {
  await connection.end();
}
