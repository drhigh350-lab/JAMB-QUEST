import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const target = {
  id: 1020081,
  externalId: "supplied-keyed-2021-chemistry-036",
  sourceId: 11580001,
  diagramUrl: "/manus-storage/nitrogen-orbital-owner-supplied-20260826_9c7bddd0.png",
  explanationStatus: "needs_review",
};
const reportPath = "/home/ubuntu/jamb-quiz-game/reports/nitrogen_orbital_owner_image_mapping_20260826.json";
const protectedSnapshot = (row) => ({ id: row.id, externalId: row.externalId, subject: row.subject, topic: row.topic, questionText: row.questionText, optionsJson: row.optionsJson, answerIndex: row.answerIndex, explanation: row.explanation, sourceId: row.sourceId, explanationStatus: row.explanationStatus });
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const [beforeRows] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanation, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE id = ?`, [target.id]);
  assert.equal(beforeRows.length, 1, "Target record was not found.");
  const before = beforeRows[0];
  assert.equal(before.externalId, target.externalId, "External ID changed.");
  assert.equal(before.sourceId, target.sourceId, "Source changed.");
  assert.equal(before.subject, "Chemistry", "Subject changed.");
  assert.equal(before.explanationStatus, target.explanationStatus, "Question is not still held.");
  assert.ok(before.diagramUrl === null || before.diagramUrl === target.diagramUrl, "Unexpected image link; refusing change.");
  const protectedFieldsSha256 = digest(protectedSnapshot(before));
  let affectedRows = 0;
  if (before.diagramUrl !== target.diagramUrl) {
    const [result] = await connection.execute(`UPDATE questionItems SET diagramUrl = ? WHERE id = ? AND externalId = ? AND sourceId = ? AND subject = ? AND questionText = ? AND optionsJson = ? AND answerIndex = ? AND explanation <=> ? AND explanationStatus = ? AND diagramUrl IS NULL`, [target.diagramUrl, before.id, before.externalId, before.sourceId, before.subject, before.questionText, before.optionsJson, before.answerIndex, before.explanation, before.explanationStatus]);
    affectedRows = result.affectedRows;
    assert.equal(affectedRows, 1, "Image mapping did not affect exactly one record.");
  }
  const [afterRows] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanation, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE id = ?`, [target.id]);
  const after = afterRows[0];
  assert.equal(after.diagramUrl, target.diagramUrl, "Owner image was not saved.");
  assert.equal(after.explanationStatus, target.explanationStatus, "Question was accidentally released.");
  assert.equal(digest(protectedSnapshot(after)), protectedFieldsSha256, "Protected fields changed.");
  await connection.commit();
  const report = { generatedAt: new Date().toISOString(), target, changedFields: ["diagramUrl"], learnerVisible: false, questionRemainsHeld: true, protectedFieldsSha256, affectedRows };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, report }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
