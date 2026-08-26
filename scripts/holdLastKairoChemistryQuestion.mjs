import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const target = {
  externalId: "kairo-csv-chemistry_1ea741",
  questionText: "Choose the correct option from the structure above",
  newStatus: "needs_review",
};
const reportPath = "/home/ubuntu/jamb-quiz-game/reports/last_kairo_chemistry_question_hold_20260826.json";
const snapshot = (row) => ({ id: row.id, externalId: row.externalId, subject: row.subject, topic: row.topic, questionText: row.questionText, optionsJson: row.optionsJson, answerIndex: row.answerIndex, explanation: row.explanation, diagramUrl: row.diagramUrl, sourceId: row.sourceId });
const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const [beforeRows] = await connection.execute(`SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson, qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl, qi.sourceId, qs.label AS sourceLabel FROM questionItems qi INNER JOIN questionSources qs ON qs.id = qi.sourceId WHERE qi.externalId = ?`, [target.externalId]);
  assert.equal(beforeRows.length, 1, "Target Kairo question was not found.");
  const before = beforeRows[0];
  assert.equal(before.subject, "Chemistry", "Target is not Chemistry.");
  assert.equal(before.questionText, target.questionText, "Target wording changed.");
  assert.match(before.sourceLabel, /^Kairo/i, "Target is not the Kairo source.");
  assert.equal(before.diagramUrl, null, "Target unexpectedly has a picture; refusing change.");
  assert.ok(before.explanationStatus === "approved" || before.explanationStatus === target.newStatus, "Unexpected target status; refusing change.");
  const protectedFieldsSha256 = hash(snapshot(before));
  let affectedRows = 0;
  if (before.explanationStatus !== target.newStatus) {
    const [result] = await connection.execute(`UPDATE questionItems SET explanationStatus = ? WHERE id = ? AND externalId = ? AND subject = ? AND questionText = ? AND optionsJson = ? AND answerIndex = ? AND explanation <=> ? AND diagramUrl IS NULL AND explanationStatus = ?`, [target.newStatus, before.id, before.externalId, before.subject, before.questionText, before.optionsJson, before.answerIndex, before.explanation, before.explanationStatus]);
    affectedRows = result.affectedRows;
    assert.equal(affectedRows, 1, "Hold did not affect exactly one record.");
  }
  const [afterRows] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanation, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE id = ?`, [before.id]);
  const after = afterRows[0];
  assert.equal(after.explanationStatus, target.newStatus, "Target is not held.");
  assert.equal(after.diagramUrl, null, "Target gained a picture.");
  assert.equal(hash(snapshot(after)), protectedFieldsSha256, "Protected question fields changed.");
  await connection.commit();
  const report = { generatedAt: new Date().toISOString(), target, changedFields: ["explanationStatus"], learnerVisible: false, ownerHistoryRetained: true, diagramUrlRemainedNull: true, protectedFieldsSha256, affectedRows };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, report }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
