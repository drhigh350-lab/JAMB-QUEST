import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "new_owner_diagram_candidate_search_20260826.json");
const searches = [
  { key: "vertebral_column", visibleSubject: "vertebral column with bracketed regions", terms: ["vertebral", "vertebra", "vertebral column", "spinal column"] },
  { key: "skin_section", visibleSubject: "skin cross-section with labels I–IV", terms: ["skin", "sweat gland", "sebaceous", "arrector"] },
  { key: "potato_osmosis", visibleSubject: "potato cup in salt solution and water", terms: ["potato", "salt solution", "osmosis"] },
  { key: "flower_section", visibleSubject: "flower cross-section with labels I–IV", terms: ["flower", "petal", "anther", "stigma", "ovary"] },
];
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const results = [];
  for (const search of searches) {
    const clause = search.terms.map(() => "LOWER(qi.questionText) LIKE ?").join(" OR ");
    const params = search.terms.map((term) => `%${term.toLowerCase()}%`);
    const [rows] = await connection.execute(`
      SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson,
        qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl,
        qs.id AS sourceId, qs.label AS sourceLabel, qs.isActive AS sourceActive
      FROM questionItems qi
      INNER JOIN questionSources qs ON qs.id = qi.sourceId
      WHERE (${clause})
      ORDER BY qi.subject, qi.id
    `, params);
    results.push({
      ...search,
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
    mode: "Read-only candidate search. The owner supplied images but no question IDs or wording; results are candidates only and no diagram URL may be changed from this report alone.",
    ownerFiles: [
      { file: "ChatGPTImageAug26,2026,12_40_22PM.png", visiblePattern: "vertebral column, two region brackets" },
      { file: "ChatGPTImageAug26,2026,12_38_46PM.png", visiblePattern: "skin cross-section, labels I–IV" },
      { file: "ChatGPTImageAug26,2026,12_37_43PM.png", visiblePattern: "potato osmosis setup, salt solution and water" },
      { file: "ChatGPTImageAug26,2026,12_36_24PM.png", visiblePattern: "vertebral column, four region brackets" },
      { file: "ChatGPTImageAug26,2026,12_29_32PM.png", visiblePattern: "flower cross-section, labels I–IV" },
    ],
    results,
  };
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, candidates: results.map((result) => ({ key: result.key, count: result.candidates.length, candidates: result.candidates.map(({ id, externalId, subject, topic, questionText, options, answerIndex, diagramUrl, sourceLabel, explanationStatus }) => ({ id, externalId, subject, topic, questionText, options, answerIndex, diagramUrl, sourceLabel, explanationStatus })) })) }, null, 2));
} finally {
  await connection.end();
}
