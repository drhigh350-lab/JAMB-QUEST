import mysql from "mysql2/promise";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [target] = await connection.execute(`SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanationStatus, sourceId, diagramUrl FROM questionItems WHERE externalId = ?`, ["kairo-csv-chemistry_1ea741"]);
  const [refs] = await connection.execute(`SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = 'questionItems'`);
  console.log(JSON.stringify({ target, refs }, null, 2));
} finally { await connection.end(); }
