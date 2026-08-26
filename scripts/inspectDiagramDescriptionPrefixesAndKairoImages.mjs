import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "diagram_description_prefix_and_kairo_provenance_20260826.json");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [linkedRows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson,
      qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl, qi.sourceId,
      qs.label AS sourceLabel, qs.isActive AS sourceActive
    FROM questionItems qi
    INNER JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE qi.diagramUrl IS NOT NULL AND TRIM(qi.diagramUrl) <> ''
    ORDER BY qi.id
  `);
  const [kairoRows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.diagramUrl,
      qi.explanationStatus, qi.sourceId, qs.label AS sourceLabel, qs.isActive AS sourceActive
    FROM questionItems qi
    INNER JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE LOWER(qs.label) LIKE '%kairo%' OR LOWER(qi.externalId) LIKE 'kairo%'
    ORDER BY qi.id
  `);
  const report = {
    generatedAt: new Date().toISOString(),
    mode: "Read-only inventory. No question wording, diagram link, answer, or source was changed.",
    visibleDiagramDescriptionPrefixes: linkedRows
      .map((row) => ({
        ...row,
        options: JSON.parse(row.optionsJson),
        savedAnswer: JSON.parse(row.optionsJson)[row.answerIndex] ?? null,
        prefix: row.questionText.match(/^\s*\[DIAGRAM[^\]]*\]\s*/i)?.[0] ?? null,
      }))
      .filter((row) => row.prefix !== null),
    kairoImageRecords: kairoRows.map((row) => ({ ...row, hasDiagram: Boolean(row.diagramUrl) })),
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    reportPath,
    diagramDescriptionPrefixCount: report.visibleDiagramDescriptionPrefixes.length,
    diagramDescriptionPrefixes: report.visibleDiagramDescriptionPrefixes.map(({ id, externalId, subject, questionText, diagramUrl, sourceLabel }) => ({ id, externalId, subject, questionText, diagramUrl, sourceLabel })),
    kairoImageRecords: report.kairoImageRecords,
  }, null, 2));
} finally {
  await connection.end();
}
