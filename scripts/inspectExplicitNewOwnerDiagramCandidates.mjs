import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "explicit_new_owner_diagram_candidates_20260826.json");
const groups = [
  { key: "vertebral", match: "(LOWER(qi.questionText) REGEXP 'vertebr|spinal') AND (LOWER(qi.questionText) REGEXP 'diagram|labelled|labeled')" },
  { key: "skin", match: "(LOWER(qi.questionText) REGEXP 'mammalian skin|skin cross|sweat gland|arrector|sebaceous') AND (LOWER(qi.questionText) REGEXP 'diagram|labelled|labeled')" },
  { key: "potato_osmosis", match: "LOWER(qi.questionText) REGEXP 'potato|salt solution|osmosis set'" },
  { key: "flower", match: "(LOWER(qi.questionText) REGEXP 'flower|petal|anther|stigma|ovary') AND (LOWER(qi.questionText) REGEXP 'diagram|labelled|labeled')" },
];
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const results = [];
  for (const group of groups) {
    const [rows] = await connection.execute(`
      SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson,
        qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl,
        qs.id AS sourceId, qs.label AS sourceLabel, qs.isActive AS sourceActive
      FROM questionItems qi
      INNER JOIN questionSources qs ON qs.id = qi.sourceId
      WHERE ${group.match}
      ORDER BY qi.id
    `);
    results.push({
      key: group.key,
      candidates: rows.map((row) => ({
        ...row,
        questionText: String(row.questionText ?? "").replace(/\s+/g, " ").trim(),
        options: JSON.parse(row.optionsJson),
        storedAnswer: JSON.parse(row.optionsJson)[row.answerIndex] ?? null,
      })),
    });
  }
  const report = {
    generatedAt: new Date().toISOString(),
    mode: "Read-only explicit-visual candidate search. Candidates need a record-by-record match to the owner image label geometry and stored answer before any mapping can occur.",
    results,
  };
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, results: results.map((group) => ({ key: group.key, count: group.candidates.length, candidates: group.candidates.map(({ id, externalId, subject, topic, questionText, options, answerIndex, storedAnswer, diagramUrl, explanationStatus, sourceLabel }) => ({ id, externalId, subject, topic, questionText, options, answerIndex, storedAnswer, diagramUrl, explanationStatus, sourceLabel })) })) }, null, 2));
} finally {
  await connection.end();
}
