import mysql from "mysql2/promise";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const ids = [1350649, 1350755, 1350805, 1350839, 1350647, 1170009];
  const [rows] = await connection.execute(`SELECT id, externalId, questionText, optionsJson, answerIndex, explanation, topic, explanationStatus, diagramUrl FROM questionItems WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY id`, ids);
  console.log(JSON.stringify(rows, null, 2));
} finally { await connection.end(); }
