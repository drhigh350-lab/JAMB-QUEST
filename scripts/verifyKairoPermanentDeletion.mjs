import mysql from "mysql2/promise";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [removed] = await connection.execute(`SELECT id, externalId FROM questionItems WHERE id = ? OR externalId = ?`, [1050117, "kairo-csv-chemistry_1ea741"]);
  const [lekki] = await connection.execute(`SELECT COUNT(*) AS count FROM questionItems WHERE sourceId = ?`, [12330000]);
  console.log(JSON.stringify({ removed, lekkiHeadmasterCount: lekki[0]?.count ?? null }, null, 2));
} finally { await connection.end(); }
