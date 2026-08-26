import mysql from "mysql2/promise";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, topic, explanationStatus, diagramUrl FROM questionItems WHERE (subject = 'Biology' AND (questionText LIKE '%digestive%' OR questionText LIKE '%stomach%' OR questionText LIKE '%endocrine%' OR questionText LIKE '%pituitary%' OR questionText LIKE '%gland%')) OR (subject = 'Chemistry' AND (questionText LIKE '%energy profile%' OR questionText LIKE '%activation energy%' OR questionText LIKE '%activated complex%')) ORDER BY subject, id`);
  console.log(JSON.stringify(rows, null, 2));
} finally { await connection.end(); }
