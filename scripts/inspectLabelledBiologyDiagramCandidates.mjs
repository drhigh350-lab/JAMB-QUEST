import mysql from "mysql2/promise";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, questionText, optionsJson, answerIndex, topic, explanationStatus, diagramUrl FROM questionItems WHERE subject = 'Biology' AND (questionText LIKE '%part labelled II%' OR questionText LIKE '%labelled II%' OR questionText LIKE '%label II%') AND (questionText LIKE '%responsible%' OR questionText LIKE '%stomach%' OR questionText LIKE '%gland%' OR questionText LIKE '%uterus%' OR questionText LIKE '%pituitary%') ORDER BY id`);
  console.log(JSON.stringify(rows, null, 2));
} finally { await connection.end(); }
