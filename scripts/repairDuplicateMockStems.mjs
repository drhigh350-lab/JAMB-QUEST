import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const preflightPath = path.join(projectRoot, "reports", "preflight_duplicate_mock_stems_20260826.json");
const reportPath = path.join(projectRoot, "reports", "repaired_duplicate_mock_stems_20260826.json");
const protectedFields = ["optionsJson", "answerIndex", "explanation", "topic", "explanationStatus", "diagramUrl", "sourceId"];
const preflight = JSON.parse(await fs.readFile(preflightPath, "utf8"));
const targets = preflight.candidates.filter((candidate) => candidate.safe);
const holds = preflight.candidates.filter((candidate) => !candidate.safe).map((candidate) => ({ id: candidate.id, externalId: candidate.externalId, reason: candidate.holdReason }));

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const receipt = { repaired: [], alreadyRepaired: [], skipped: [], holds, targetCount: targets.length };
  for (const target of targets) {
    const [rows] = await connection.execute(`SELECT id, externalId, questionText, optionsJson, answerIndex, explanation, topic, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE id = ? AND externalId = ? LIMIT 1`, [target.id, target.externalId]);
    const row = rows[0];
    const protectedMatches = row && protectedFields.every((field) => String(row[field]) === String(target.protectedSnapshot[field]));
    if (!protectedMatches || row?.sourceId !== target.sourceId) {
      receipt.skipped.push({ id: target.id, externalId: target.externalId, reason: "protected current state mismatch" });
      continue;
    }
    if (row.questionText === target.replacementQuestionText) {
      receipt.alreadyRepaired.push({ id: target.id, externalId: target.externalId });
      continue;
    }
    if (row.questionText !== target.originalQuestionText) {
      receipt.skipped.push({ id: target.id, externalId: target.externalId, reason: "unexpected question text state" });
      continue;
    }
    const before = Object.fromEntries(["questionText", ...protectedFields].map((field) => [field, row[field]]));
    const [result] = await connection.execute(
      "UPDATE questionItems SET questionText = ? WHERE id = ? AND externalId = ? AND sourceId = ? AND questionText = ? AND optionsJson = ? AND answerIndex = ? AND explanation <=> ? AND topic = ? AND explanationStatus = ? AND diagramUrl <=> ?",
      [target.replacementQuestionText, target.id, target.externalId, target.sourceId, target.originalQuestionText, target.protectedSnapshot.optionsJson, target.protectedSnapshot.answerIndex, target.protectedSnapshot.explanation, target.protectedSnapshot.topic, target.protectedSnapshot.explanationStatus, target.protectedSnapshot.diagramUrl],
    );
    if (result.affectedRows !== 1) {
      receipt.skipped.push({ id: target.id, externalId: target.externalId, reason: "guarded question-text update did not apply" });
      continue;
    }
    const [afterRows] = await connection.execute(`SELECT ${["questionText", ...protectedFields].join(", ")} FROM questionItems WHERE id = ? LIMIT 1`, [target.id]);
    const after = afterRows[0];
    if (!protectedFields.every((field) => String(after[field]) === String(before[field])) || after.questionText !== target.replacementQuestionText || /\sOptions:\s*$/i.test(after.questionText)) throw new Error(`post-update verification failed for ${target.externalId}`);
    receipt.repaired.push({ id: target.id, externalId: target.externalId, before, after });
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), scope: "Idempotent guarded question-text-only repair. Only preflight-proven exact duplicated non-Lekki mock stems may change; all protected fields remain unchanged.", receipt }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, repaired: receipt.repaired.length, alreadyRepaired: receipt.alreadyRepaired.length, skipped: receipt.skipped.length, held: receipt.holds.length }, null, 2));
} finally {
  await connection.end();
}
