import mysql from "mysql2/promise";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [sources] = await connection.execute(`SELECT id, label FROM questionSources WHERE label LIKE '%Lekki Headmaster%'`);
  const results = [];
  for (const source of sources) {
    const [counts] = await connection.execute(`SELECT COUNT(*) AS count FROM questionItems WHERE sourceId = ?`, [source.id]);
    results.push({ ...source, questionCount: counts[0]?.count ?? null });
  }
  console.log(JSON.stringify(results, null, 2));
} finally { await connection.end(); }
