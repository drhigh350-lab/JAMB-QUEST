import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [chemistry] = await connection.execute(
    `SELECT id, externalId, questionText, optionsJson, answerIndex, explanationStatus, diagramUrl
     FROM questionItems
     WHERE subject = 'Chemistry'
       AND (optionsJson LIKE '%2-methylbutane%' OR optionsJson LIKE '%2-methyl butane%' OR optionsJson LIKE '%2-chloro-2-methylbutane%' OR optionsJson LIKE '%2-methylpropan-2-ol%')
     ORDER BY id`,
  );
  const [biology] = await connection.execute(
    `SELECT id, externalId, questionText, optionsJson, answerIndex, explanationStatus, diagramUrl
     FROM questionItems
     WHERE subject = 'Biology'
       AND (questionText LIKE '%part labelled I%' OR questionText LIKE '%part labelled II%')
       AND (optionsJson LIKE '%mitochondrion%' OR optionsJson LIKE '%vacuole%' OR optionsJson LIKE '%nucleus%')
     ORDER BY id`,
  );
  console.log(JSON.stringify({ chemistry, biology }, null, 2));
} finally {
  await connection.end();
}
