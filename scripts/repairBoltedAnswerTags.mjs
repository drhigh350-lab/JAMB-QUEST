import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const preflightPath = path.join(projectRoot, "reports", "preflight_bolted_answer_tags_20260826.json");
const reportPath = path.join(projectRoot, "reports", "repaired_bolted_answer_tags_20260826.json");
const protectedFields = ["questionText", "optionsJson", "answerIndex", "topic", "explanationStatus", "diagramUrl", "sourceId"];
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
    if (row.explanation === target.replacementExplanation) {
      receipt.alreadyRepaired.push({ id: target.id, externalId: target.externalId });
      continue;
    }
    if (row.explanation !== target.originalExplanation) {
      receipt.skipped.push({ id: target.id, externalId: target.externalId, reason: "unexpected explanation state" });
      continue;
    }
    const before = Object.fromEntries(["explanation", ...protectedFields].map((field) => [field, row[field]]));
    const [result] = await connection.execute(
      "UPDATE questionItems SET explanation = ? WHERE id = ? AND externalId = ? AND sourceId = ? AND explanation = ? AND questionText = ? AND optionsJson = ? AND answerIndex = ? AND topic = ? AND explanationStatus = ? AND diagramUrl <=> ?",
      [target.replacementExplanation, target.id, target.externalId, target.sourceId, target.originalExplanation, target.protectedSnapshot.questionText, target.protectedSnapshot.optionsJson, target.protectedSnapshot.answerIndex, target.protectedSnapshot.topic, target.protectedSnapshot.explanationStatus, target.protectedSnapshot.diagramUrl],
    );
    if (result.affectedRows !== 1) {
      receipt.skipped.push({ id: target.id, externalId: target.externalId, reason: "guarded explanation update did not apply" });
      continue;
    }
    const [afterRows] = await connection.execute(`SELECT ${["explanation", ...protectedFields].join(", ")} FROM questionItems WHERE id = ? LIMIT 1`, [target.id]);
    const after = afterRows[0];
    if (!protectedFields.every((field) => String(after[field]) === String(before[field])) || after.explanation !== target.replacementExplanation || /(?:Correct answer|Answer)\s*:/i.test(after.explanation)) throw new Error(`post-update verification failed for ${target.externalId}`);
    receipt.repaired.push({ id: target.id, externalId: target.externalId, before, after });
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), scope: "Idempotent guarded explanation-format repair. Only preflight-proven non-Lekki terminal tags that exactly restate a stored keyed option may be removed; all protected fields remain unchanged.", receipt }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, repaired: receipt.repaired.length, alreadyRepaired: receipt.alreadyRepaired.length, skipped: receipt.skipped.length, held: receipt.holds.length }, null, 2));
} finally {
  await connection.end();
}
