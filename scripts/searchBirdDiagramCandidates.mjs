import mysql from "mysql2/promise";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, questionText, topic, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE subject = 'Biology' AND (questionText LIKE '%bird%' OR questionText LIKE '%beak%' OR questionText LIKE '%label%' OR questionText LIKE '%feeding%' OR questionText LIKE '%diagram%') ORDER BY id`);
  console.log(JSON.stringify(rows, null, 2));
} finally { await connection.end(); }
