import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const auditPath = path.join(projectRoot, "reports", "no_explanation_option_placeholder_audit_20260826.json");
const reportPath = path.join(projectRoot, "reports", "no_explanation_option_placeholder_hold_receipt_20260826.json");
const protectedFields = ["questionText", "optionsJson", "answerIndex", "topic", "explanation", "sourceId", "diagramUrl"];

const audit = JSON.parse(await fs.readFile(auditPath, "utf8"));
if (audit.totalAffected !== 56 || audit.findings.length !== 56) {
  throw new Error(`unexpected placeholder-option audit cardinality: ${audit.totalAffected}/${audit.findings.length}`);
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const receipt = { held: [], alreadyHeld: [], skipped: [] };

  for (const target of audit.findings) {
    const [rows] = await connection.execute(
      `SELECT id, externalId, ${protectedFields.join(", ")}, explanationStatus FROM questionItems WHERE externalId = ? LIMIT 1`,
      [target.externalId],
    );
    const row = rows[0];
    const optionsMatch = row && row.optionsJson === JSON.stringify(target.options);
    const sourceMatches = row
      && row.questionText === target.questionText
      && Number(row.sourceId) === target.sourceId
      && optionsMatch
      && target.placeholderIndices.length > 0;

    if (!sourceMatches) {
      receipt.skipped.push({ externalId: target.externalId, reason: "protected source or placeholder-option mismatch" });
      continue;
    }
    if (row.explanationStatus === "needs_review") {
      receipt.alreadyHeld.push({ externalId: target.externalId, id: row.id });
      continue;
    }
    if (row.explanationStatus !== "approved") {
      receipt.skipped.push({ externalId: target.externalId, reason: "unexpected current review status" });
      continue;
    }

    const protectedSnapshot = Object.fromEntries(protectedFields.map((field) => [field, row[field]]));
    const [result] = await connection.execute(
      "UPDATE questionItems SET explanationStatus = 'needs_review' WHERE id = ? AND externalId = ? AND explanationStatus = 'approved' AND optionsJson = ?",
      [row.id, target.externalId, row.optionsJson],
    );
    if (result.affectedRows !== 1) {
      receipt.skipped.push({ externalId: target.externalId, reason: "guarded learner-hold update did not apply" });
      continue;
    }

    const [afterRows] = await connection.execute(
      `SELECT ${protectedFields.join(", ")}, explanationStatus FROM questionItems WHERE id = ? LIMIT 1`,
      [row.id],
    );
    const after = afterRows[0];
    const protectedUnchanged = protectedFields.every((field) => after[field] === protectedSnapshot[field]);
    if (!protectedUnchanged || after.explanationStatus !== "needs_review") {
      throw new Error(`post-update protected-field verification failed for ${target.externalId}`);
    }
    receipt.held.push({
      externalId: target.externalId,
      id: row.id,
      answerPointsToPlaceholder: target.answerPointsToPlaceholder,
      reason: "active options include a literal no-explanation or empty placeholder; original source does not provide a repairable exact option",
    });
  }

  if (receipt.skipped.length > 0) {
    throw new Error(`placeholder hold blocked by ${receipt.skipped.length} protected-state mismatch(es)`);
  }
  await connection.commit();
  await fs.writeFile(reportPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    scope: "Guarded learner-safety hold for active questions whose answer options contain literal no-explanation or empty placeholders. Only explanationStatus changes from approved to needs_review; all question, option, key, topic, explanation, source, and diagram fields are verified unchanged.",
    auditedTotal: audit.totalAffected,
    receipt,
  }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, held: receipt.held.length, alreadyHeld: receipt.alreadyHeld.length, skipped: receipt.skipped.length }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
