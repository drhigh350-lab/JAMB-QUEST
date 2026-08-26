import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, questionText, optionsJson, answerIndex, explanation, topic, explanationStatus, diagramUrl
     FROM questionItems
     WHERE subject = 'Physics'
       AND optionsJson LIKE '%K%'
       AND optionsJson LIKE '%L%'
       AND optionsJson LIKE '%M%'
       AND optionsJson LIKE '%N%'
     ORDER BY id`,
  );
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await connection.end();
}
