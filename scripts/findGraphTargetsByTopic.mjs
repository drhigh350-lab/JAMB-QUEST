import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [biology] = await connection.execute(
    `SELECT id, externalId, questionText, optionsJson, answerIndex, topic, explanationStatus, diagramUrl
     FROM questionItems
     WHERE subject = 'Biology'
       AND questionText LIKE '%graph%'
       AND (topic LIKE '%Respir%' OR topic LIKE '%Nutrition%' OR topic LIKE '%Transport%' OR topic LIKE '%Coordination%')
     ORDER BY id`,
  );
  const [physics] = await connection.execute(
    `SELECT id, externalId, questionText, optionsJson, answerIndex, topic, explanationStatus, diagramUrl
     FROM questionItems
     WHERE subject = 'Physics'
       AND questionText LIKE '%graph%'
       AND topic LIKE '%Gas%'
     ORDER BY id`,
  );
  console.log(JSON.stringify({ biology, physics }, null, 2));
} finally {
  await connection.end();
}
