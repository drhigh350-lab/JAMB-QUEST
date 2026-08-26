import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const exactIds = [
  "owner-chem-diagram-2026-008",
  "owner-chem-diagram-2026-004",
  "owner-chem-diagram-2026-003",
  "owner-chem-diagram-2026-002",
  "owner-chem-diagram-2026-001",
  "owner-bio-diagram-2025-009",
  "owner-bio-diagram-2025-008",
  "owner-bio-diagram-2025-007",
  "owner-bio-diagram-2025-006",
  "owner-bio-diagram-2025-005",
  "owner-bio-diagram-2025-004",
  "owner-bio-diagram-2025-003",
  "owner-bio-diagram-2025-002",
];
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const exactPlaceholders = exactIds.map(() => "?").join(",");
  const [exactRows] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE externalId IN (${exactPlaceholders}) ORDER BY FIELD(externalId, ${exactPlaceholders})`, [...exactIds, ...exactIds]);
  const [clueRows] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE (LOWER(questionText) LIKE '%ideal gas%' OR LOWER(questionText) LIKE '%pressure-volume%' OR LOWER(questionText) LIKE '%energy profile%' OR LOWER(questionText) LIKE '%activation energy%' OR LOWER(questionText) LIKE '%nomenclature%' OR LOWER(questionText) LIKE '%compound%' OR LOWER(questionText) LIKE '%flower%' OR LOWER(questionText) LIKE '%reproductive system%' OR LOWER(questionText) LIKE '%digestive system%' OR LOWER(questionText) LIKE '%cell%' OR LOWER(questionText) LIKE '%membrane%' OR LOWER(questionText) LIKE '%transport%' OR LOWER(questionText) LIKE '%thyroid%' OR LOWER(questionText) LIKE '%endocrine%' OR LOWER(questionText) LIKE '%vertebra%' OR LOWER(questionText) LIKE '%beak%' OR LOWER(questionText) LIKE '%bird%') AND subject IN ('Biology','Chemistry') ORDER BY subject, id`);
  const reportPath = "/home/ubuntu/jamb-quiz-game/reports/owner_fourteen_diagram_match_inspection_20260826.json";
  const report = { generatedAt: new Date().toISOString(), readOnly: true, suppliedImageIds: exactIds, exactOwnerRecords: exactRows, clueCandidates: clueRows };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, exactOwnerRecords: exactRows, clueCandidateCount: clueRows.length, clueCandidates: clueRows }, null, 2));
} finally {
  await connection.end();
}
