import mysql from "mysql2/promise";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, questionText, optionsJson, answerIndex, explanation, topic, explanationStatus, diagramUrl FROM questionItems WHERE subject = 'Biology' AND (questionText REGEXP 'label(l)?ed (II|I)|stomach|digestive system|endocrine|pituitary|gland') ORDER BY id`);
  console.log(JSON.stringify(rows, null, 2));
} finally { await connection.end(); }
