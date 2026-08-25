import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const outputPath = path.join(projectRoot, "reports", "explicit_diagram_asset_holds_20260825.json");
const diagramReference = "(?:\\[(?:diagram|refers to .*diagram)\\b|diagram\\s+(?:above|below|shown|illustrated)|illustration\\s+(?:above|below|shown)|figure\\s+(?:above|below|shown)|\\b(?:use|from)\\s+the\\s+diagram\\b|\\b(?:structure|compound|graph)\\s+above\\b|\\bgraph\\s+shown\\b|\\brate\\s+of\\s+reaction\\s+diagram\\b)";
const textualStructureEvidence = "(?:\\[structure\\]|(?:\\bCH\\d*|\\bH\\d*C)\\s*(?:[-–—=]|\\()|C\\(=O\\)|CH\\(OH\\))";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  // This mirrors server/db.ts: normaliseQuestionStem(), then requiresDiagramAsset().
  // It is read-only and classifies only current active, approved source records.
  const [rows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.diagramUrl,
           qs.id AS sourceId, qs.slug AS sourceSlug, qs.label AS sourceLabel
    FROM questionItems qi
    JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE qs.isActive = 1
      AND qi.explanationStatus = 'approved'
      AND qi.diagramUrl IS NULL
      AND REGEXP_LIKE(REGEXP_REPLACE(qi.questionText, '^\\s*\\[diagram question\\]\\s*', ''), ?, 'i')
      AND NOT REGEXP_LIKE(REGEXP_REPLACE(qi.questionText, '^\\s*\\[diagram question\\]\\s*', ''), ?, 'i')
    ORDER BY qi.subject, qi.externalId, qi.id
  `, [diagramReference, textualStructureEvidence]);

  const holds = rows.map((row) => ({
    ...row,
    disposition: "hold_missing_original",
    learnerEligibility: "excluded by toPlayableAuthorisedQuestion until a source-backed original visual is linked",
    reason: "The protected stem explicitly depends on a diagram after normalisation, but no linked original learner asset exists. No semantic reconstruction or AI-generated visual is permitted.",
  }));
  const output = {
    generatedAt: new Date().toISOString(),
    scope: "Read-only audit of active approved records that the production learner-eligibility guard excludes because an explicit visual reference has no linked original diagram asset.",
    totalHeld: holds.length,
    bySubject: holds.reduce((counts, row) => ({ ...counts, [row.subject]: (counts[row.subject] ?? 0) + 1 }), {}),
    holds,
  };
  await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, totalHeld: output.totalHeld, bySubject: output.bySubject }, null, 2));
} finally {
  await connection.end();
}
