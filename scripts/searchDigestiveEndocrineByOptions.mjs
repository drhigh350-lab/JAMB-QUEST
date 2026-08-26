import mysql from "mysql2/promise";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, questionText, optionsJson, answerIndex, topic, explanationStatus, diagramUrl FROM questionItems WHERE subject = 'Biology' AND (optionsJson LIKE '%stomach%' OR optionsJson LIKE '%pituitary%' OR optionsJson LIKE '%uterus%') ORDER BY id`);
  console.log(JSON.stringify(rows, null, 2));
} finally { await connection.end(); }
