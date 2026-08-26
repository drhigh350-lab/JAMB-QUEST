import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const classificationPath = path.join(projectRoot, "reports", "nonessential_diagram_link_removal_classification_20260826.json");
const receiptPath = path.join(projectRoot, "reports", "nonessential_diagram_link_removal_receipt_20260826.json");
const LEKKI_MARKER = /lekki headmaster/i;
const classification = JSON.parse(await fs.readFile(classificationPath, "utf8"));
const targets = classification.safeForGuardedRemoval;
assert.equal(targets.length, 22, "The reviewed target count changed; refusing update.");

function protectedSnapshot(row) {
  return {
    id: row.id,
    externalId: row.externalId,
    subject: row.subject,
    topic: row.topic,
    difficulty: row.difficulty,
    questionText: row.questionText,
    optionsJson: row.optionsJson,
    answerIndex: row.answerIndex,
    explanation: row.explanation,
    explanationStatus: row.explanationStatus,
    sourceId: row.sourceId,
  };
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const receipts = [];
  for (const target of targets) {
    const [beforeRows] = await connection.execute(`
      SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.difficulty, qi.questionText,
        qi.optionsJson, qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl,
        qi.sourceId, qs.label AS sourceLabel
      FROM questionItems qi
      INNER JOIN questionSources qs ON qs.id = qi.sourceId
      WHERE qi.id = ?
    `, [target.id]);
    assert.equal(beforeRows.length, 1, `Record ${target.id} is missing.`);
    const before = beforeRows[0];
    assert.equal(before.externalId, target.externalId, `External ID changed for ${target.id}.`);
    assert.equal(before.sourceId, target.sourceId, `Source changed for ${target.id}.`);
    assert.equal(before.questionText, target.questionText, `Question text changed for ${target.id}.`);
    assert.equal(before.optionsJson, JSON.stringify(target.options), `Options changed for ${target.id}.`);
    assert.equal(before.answerIndex, target.answerIndex, `Answer index changed for ${target.id}.`);
    assert.equal(before.explanationStatus, target.explanationStatus, `Review status changed for ${target.id}.`);
    assert.ok(!LEKKI_MARKER.test(before.sourceLabel) && !LEKKI_MARKER.test(before.questionText), `Lekki record ${target.id} is excluded.`);
    const snapshot = protectedSnapshot(before);
    let affectedRows = 0;
    if (before.diagramUrl !== null) {
      assert.equal(before.diagramUrl, target.diagramUrl, `Diagram link changed for ${target.id}; refusing update.`);
      const [result] = await connection.execute(`
        UPDATE questionItems
        SET diagramUrl = NULL
        WHERE id = ? AND externalId = ? AND sourceId = ? AND questionText = ? AND optionsJson = ?
          AND answerIndex = ? AND explanationStatus = ? AND diagramUrl = ?
      `, [before.id, before.externalId, before.sourceId, before.questionText, before.optionsJson, before.answerIndex, before.explanationStatus, before.diagramUrl]);
      affectedRows = result.affectedRows;
      assert.equal(affectedRows, 1, `Diagram removal did not affect exactly one record for ${target.id}.`);
    }
    const [afterRows] = await connection.execute(`
      SELECT id, externalId, subject, topic, difficulty, questionText, optionsJson, answerIndex,
        explanation, explanationStatus, diagramUrl, sourceId
      FROM questionItems WHERE id = ?
    `, [target.id]);
    assert.equal(afterRows.length, 1, `Record ${target.id} disappeared.`);
    const after = afterRows[0];
    assert.equal(after.diagramUrl, null, `Diagram link remains on ${target.id}.`);
    assert.equal(digest(protectedSnapshot(after)), digest(snapshot), `Protected content changed for ${target.id}.`);
    receipts.push({ id: target.id, externalId: target.externalId, subject: after.subject, sourceId: after.sourceId, diagramUrlBefore: before.diagramUrl, diagramUrlAfter: after.diagramUrl, protectedFieldsSha256: digest(snapshot), affectedRows });
  }
  await connection.commit();
  const receipt = {
    generatedAt: new Date().toISOString(),
    action: "Guarded removal of non-essential diagram links only.",
    sourceClassification: path.basename(classificationPath),
    targetCount: targets.length,
    changedCount: receipts.filter((record) => record.affectedRows === 1).length,
    unchangedOnRepeatCount: receipts.filter((record) => record.affectedRows === 0).length,
    learnerEligibilityRuleChanged: false,
    lekkiHeadmasterChanged: false,
    records: receipts,
  };
  await fs.writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify({ receiptPath, receipt }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
