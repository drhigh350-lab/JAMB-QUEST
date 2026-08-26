import mysql from "mysql2/promise";
const ids = [1050171, 1050122, 1170009, 1170007, 1170002, 1050117];
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, explanationStatus, diagramUrl FROM questionItems WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY id`, ids);
  console.log(JSON.stringify(rows, null, 2));
} finally { await connection.end(); }
