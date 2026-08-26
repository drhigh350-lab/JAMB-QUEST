import mysql from "mysql2/promise";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE externalId LIKE 'OWNER-%DIAGRAM-%' OR externalId LIKE 'owner-%diagram-%' ORDER BY subject, externalId`);
  for (const row of rows) console.log(JSON.stringify(row));
  console.error(`COUNT=${rows.length}`);
} finally { await connection.end(); }
