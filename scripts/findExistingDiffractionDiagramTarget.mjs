import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, questionText, optionsJson, answerIndex, explanationStatus, topic, sourceId, diagramUrl
     FROM questionItems
     WHERE subject = 'Physics'
       AND (diagramUrl LIKE '%diffraction%' OR externalId LIKE '%diffraction%' OR questionText LIKE '%diffract%')
     ORDER BY id`,
  );
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await connection.end();
}
