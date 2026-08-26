import mysql from "mysql2/promise";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, questionText, optionsJson, answerIndex, explanation, topic, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE subject = 'Biology' AND ((optionsJson LIKE '%stomach%' AND (questionText LIKE '%part labelled%' OR questionText LIKE '%label%')) OR (optionsJson LIKE '%pituitary%' AND (questionText LIKE '%label%' OR questionText LIKE '%gland%'))) ORDER BY id`);
  console.log(JSON.stringify(rows, null, 2));
} finally { await connection.end(); }
