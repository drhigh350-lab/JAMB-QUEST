import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const target = {
  id: 1050122,
  externalId: "kairo-csv-chemistry_20650b",
  oldDiagramUrl: "/manus-storage/chemistry-energy-profile-original_3e1f7670.png",
  newDiagramUrl: "/manus-storage/chemistry-energy-profile-original-20260826_69a97b4c.png",
  explanationStatus: "approved",
};
const reportPath = "/home/ubuntu/jamb-quiz-game/reports/kairo_energy_profile_preview_recovery_20260826.json";
const protectedSnapshot = (row) => ({ id: row.id, externalId: row.externalId, subject: row.subject, topic: row.topic, questionText: row.questionText, optionsJson: row.optionsJson, answerIndex: row.answerIndex, explanation: row.explanation, sourceId: row.sourceId, explanationStatus: row.explanationStatus });
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const [beforeRows] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanation, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE id = ?`, [target.id]);
  assert.equal(beforeRows.length, 1, "Target record was not found.");
  const before = beforeRows[0];
  assert.equal(before.externalId, target.externalId, "External ID changed.");
  assert.equal(before.subject, "Chemistry", "Subject changed.");
  assert.equal(before.explanationStatus, target.explanationStatus, "Target is no longer approved.");
  assert.ok(before.diagramUrl === target.oldDiagramUrl || before.diagramUrl === target.newDiagramUrl, "Unexpected image link; refusing change.");
  const protectedFieldsSha256 = digest(protectedSnapshot(before));
  let affectedRows = 0;
  if (before.diagramUrl !== target.newDiagramUrl) {
    const [result] = await connection.execute(`UPDATE questionItems SET diagramUrl = ? WHERE id = ? AND externalId = ? AND subject = ? AND questionText = ? AND optionsJson = ? AND answerIndex = ? AND explanation <=> ? AND sourceId = ? AND explanationStatus = ? AND diagramUrl = ?`, [target.newDiagramUrl, before.id, before.externalId, before.subject, before.questionText, before.optionsJson, before.answerIndex, before.explanation, before.sourceId, before.explanationStatus, target.oldDiagramUrl]);
    affectedRows = result.affectedRows;
    assert.equal(affectedRows, 1, "Energy image repair did not affect exactly one record.");
  }
  const [afterRows] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanation, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE id = ?`, [target.id]);
  const after = afterRows[0];
  assert.equal(after.diagramUrl, target.newDiagramUrl, "Fresh energy image link was not saved.");
  assert.equal(after.explanationStatus, target.explanationStatus, "Energy question was accidentally hidden or released.");
  assert.equal(digest(protectedSnapshot(after)), protectedFieldsSha256, "Protected fields changed.");
  await connection.commit();
  const report = { generatedAt: new Date().toISOString(), target, changedFields: ["diagramUrl"], learnerVisible: true, protectedFieldsSha256, affectedRows };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, report }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
