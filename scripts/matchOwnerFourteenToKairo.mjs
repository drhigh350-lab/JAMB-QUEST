import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const normalize = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const tokens = (value) => new Set(normalize(value).split(/\s+/).filter((token) => token.length > 2));
const overlap = (a, b) => { const left = tokens(a); const right = tokens(b); const intersection = [...left].filter((token) => right.has(token)).length; const union = new Set([...left, ...right]).size; return union ? intersection / union : 0; };
try {
  const [owners] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE externalId IN ('OWNER-CHEM-DIAGRAM-2026-001','OWNER-CHEM-DIAGRAM-2026-002','OWNER-CHEM-DIAGRAM-2026-003','OWNER-CHEM-DIAGRAM-2026-004','OWNER-CHEM-DIAGRAM-2026-008','OWNER-BIO-DIAGRAM-2025-002','OWNER-BIO-DIAGRAM-2025-003','OWNER-BIO-DIAGRAM-2025-004','OWNER-BIO-DIAGRAM-2025-005','OWNER-BIO-DIAGRAM-2025-006','OWNER-BIO-DIAGRAM-2025-007','OWNER-BIO-DIAGRAM-2025-008','OWNER-BIO-DIAGRAM-2025-009') ORDER BY externalId`);
  const [kairo] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE externalId LIKE 'kairo-csv-%' AND subject IN ('Biology','Chemistry')`);
  const matches = owners.map((owner) => ({ owner, candidates: kairo.map((candidate) => ({ candidate, score: overlap(`${owner.questionText} ${owner.optionsJson}`, `${candidate.questionText} ${candidate.optionsJson}`), answerSame: owner.answerIndex === candidate.answerIndex })).sort((a, b) => b.score - a.score).slice(0, 5) }));
  const idealGas = kairo.filter((row) => row.externalId === 'kairo-csv-chemistry_ea3781');
  const reportPath = "/home/ubuntu/jamb-quiz-game/reports/owner_fourteen_to_kairo_match_candidates_20260826.json";
  const report = { generatedAt: new Date().toISOString(), readOnly: true, matches, manuallyIdentifiedImage: { file: "chemistry-ideal-gas-schoolngr-original_002271ae.png", candidate: idealGas } };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  for (const match of matches) console.log(JSON.stringify({ owner: match.owner.externalId, topCandidates: match.candidates.map(({ candidate, score, answerSame }) => ({ externalId: candidate.externalId, id: candidate.id, questionText: candidate.questionText, score, answerSame, diagramUrl: candidate.diagramUrl, explanationStatus: candidate.explanationStatus })) }));
  console.log(JSON.stringify({ reportPath, ownerCount: owners.length, kairoCount: kairo.length, idealGas: idealGas.map((row) => ({ externalId: row.externalId, id: row.id, diagramUrl: row.diagramUrl })) }));
} finally { await connection.end(); }
