import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const reportPath = "/home/ubuntu/jamb-quiz-game/reports/chemistry_036_wrong_diagram_hold_20260826.json";
const target = {
  id: 1020081,
  externalId: "supplied-keyed-2021-chemistry-036",
  sourceId: 11580001,
  oldDiagramUrl: "/manus-storage/chemistry-2021-atom-mixture-neutral_4778e51b.png",
  newDiagramUrl: null,
  oldExplanationStatus: "approved",
  newExplanationStatus: "needs_review",
};
const protectedSnapshot = (row) => ({ id: row.id, externalId: row.externalId, subject: row.subject, topic: row.topic, questionText: row.questionText, optionsJson: row.optionsJson, answerIndex: row.answerIndex, explanation: row.explanation, sourceId: row.sourceId });
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const [beforeRows] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanation, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE id = ?`, [target.id]);
  assert.equal(beforeRows.length, 1, "Target record was not found.");
  const before = beforeRows[0];
  assert.equal(before.externalId, target.externalId, "External ID changed.");
  assert.equal(before.sourceId, target.sourceId, "Source changed.");
  assert.ok(before.diagramUrl === target.oldDiagramUrl || before.diagramUrl === target.newDiagramUrl, "Unexpected diagram link; refusing change.");
  assert.ok(before.explanationStatus === target.oldExplanationStatus || before.explanationStatus === target.newExplanationStatus, "Unexpected review status; refusing change.");
  const snapshot = protectedSnapshot(before);
  let affectedRows = 0;
  if (before.diagramUrl !== target.newDiagramUrl || before.explanationStatus !== target.newExplanationStatus) {
    const [result] = await connection.execute(`UPDATE questionItems SET diagramUrl = ?, explanationStatus = ? WHERE id = ? AND externalId = ? AND sourceId = ? AND questionText = ? AND optionsJson = ? AND answerIndex = ? AND explanation <=> ? AND diagramUrl = ? AND explanationStatus = ?`, [target.newDiagramUrl, target.newExplanationStatus, before.id, before.externalId, before.sourceId, before.questionText, before.optionsJson, before.answerIndex, before.explanation, target.oldDiagramUrl, target.oldExplanationStatus]);
    affectedRows = result.affectedRows;
    if (before.diagramUrl === target.newDiagramUrl && before.explanationStatus === target.newExplanationStatus) assert.equal(affectedRows, 0);
    else assert.equal(affectedRows, 1, "Hold did not affect exactly one record.");
  }
  const [afterRows] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanation, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE id = ?`, [target.id]);
  const after = afterRows[0];
  assert.equal(after.diagramUrl, target.newDiagramUrl, "Wrong diagram link remains.");
  assert.equal(after.explanationStatus, target.newExplanationStatus, "Learner hold did not save.");
  assert.equal(digest(protectedSnapshot(after)), digest(snapshot), "Protected question content changed.");
  await connection.commit();
  const report = { generatedAt: new Date().toISOString(), action: "Non-destructive owner hold for one wrong diagram.", target, changedFields: ["diagramUrl", "explanationStatus"], learnerVisible: false, ownerHistoryRetained: true, protectedFieldsSha256: digest(snapshot), affectedRows };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, report }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
