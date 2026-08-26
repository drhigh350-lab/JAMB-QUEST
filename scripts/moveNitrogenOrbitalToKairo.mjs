import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const source = { id: 1020081, externalId: "supplied-keyed-2021-chemistry-036", explanationStatus: "needs_review", currentDiagramUrl: "/manus-storage/nitrogen-orbital-owner-supplied-20260826_9c7bddd0.png" };
const destination = { id: 1050162, externalId: "kairo-csv-chemistry_2bdf6a", explanationStatus: "approved", newDiagramUrl: "/manus-storage/nitrogen-orbital-owner-supplied-20260826_9c7bddd0.png" };
const reportPath = "/home/ubuntu/jamb-quiz-game/reports/nitrogen_orbital_move_to_kairo_20260826.json";
const digest = (row) => createHash("sha256").update(JSON.stringify({ id: row.id, externalId: row.externalId, subject: row.subject, topic: row.topic, questionText: row.questionText, optionsJson: row.optionsJson, answerIndex: row.answerIndex, explanation: row.explanation, explanationStatus: row.explanationStatus, sourceId: row.sourceId })).digest("hex");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const [rows] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanation, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE id IN (?, ?) ORDER BY id`, [source.id, destination.id]);
  assert.equal(rows.length, 2, "Both exact records are required.");
  const sourceRow = rows.find((row) => row.id === source.id);
  const destinationRow = rows.find((row) => row.id === destination.id);
  assert.equal(sourceRow.externalId, source.externalId, "Source external ID changed.");
  assert.equal(destinationRow.externalId, destination.externalId, "Destination external ID changed.");
  assert.equal(sourceRow.subject, "Chemistry");
  assert.equal(destinationRow.subject, "Chemistry");
  assert.equal(sourceRow.explanationStatus, source.explanationStatus, "Source is not held.");
  assert.equal(destinationRow.explanationStatus, destination.explanationStatus, "Destination status changed.");
  assert.ok(sourceRow.diagramUrl === null || sourceRow.diagramUrl === source.currentDiagramUrl, "Source image link is not the owner image; refusing move.");
  const sourceProtected = digest(sourceRow);
  const destinationProtected = digest(destinationRow);
  let clearResult = { affectedRows: 0 };
  if (sourceRow.diagramUrl === source.currentDiagramUrl) {
    const [result] = await connection.execute(`UPDATE questionItems SET diagramUrl = NULL WHERE id = ? AND externalId = ? AND subject = ? AND explanationStatus = ? AND diagramUrl = ?`, [source.id, source.externalId, sourceRow.subject, source.explanationStatus, source.currentDiagramUrl]);
    clearResult = result;
  }
  assert.ok(clearResult.affectedRows === 0 || clearResult.affectedRows === 1, "Unexpected source update count.");
  const [setResult] = await connection.execute(`UPDATE questionItems SET diagramUrl = ? WHERE id = ? AND externalId = ? AND subject = ? AND explanationStatus = ? AND questionText = ? AND optionsJson = ? AND answerIndex = ? AND explanation <=> ? AND sourceId = ?`, [destination.newDiagramUrl, destination.id, destination.externalId, destinationRow.subject, destination.explanationStatus, destinationRow.questionText, destinationRow.optionsJson, destinationRow.answerIndex, destinationRow.explanation, destinationRow.sourceId]);
  assert.ok(setResult.affectedRows === 0 || setResult.affectedRows === 1, "Unexpected destination update count.");
  const [afterRows] = await connection.execute(`SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, explanation, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE id IN (?, ?) ORDER BY id`, [source.id, destination.id]);
  const afterSource = afterRows.find((row) => row.id === source.id);
  const afterDestination = afterRows.find((row) => row.id === destination.id);
  assert.equal(afterSource.diagramUrl, null, "Chemistry 036 still has the orbital picture.");
  assert.equal(afterSource.explanationStatus, source.explanationStatus, "Chemistry 036 was released.");
  assert.equal(afterDestination.diagramUrl, destination.newDiagramUrl, "Kairo nitrogen picture was not saved.");
  assert.equal(afterDestination.explanationStatus, destination.explanationStatus, "Kairo nitrogen status changed.");
  assert.equal(digest(afterSource), sourceProtected, "Chemistry 036 protected fields changed.");
  assert.equal(digest(afterDestination), destinationProtected, "Kairo nitrogen protected fields changed.");
  await connection.commit();
  const report = { generatedAt: new Date().toISOString(), source, destination, changedFields: [{ externalId: source.externalId, fields: ["diagramUrl"] }, { externalId: destination.externalId, fields: ["diagramUrl"] }], sourceLearnerVisible: false, destinationLearnerVisible: true, affectedRows: { source: clearResult.affectedRows, destination: setResult.affectedRows }, idempotentRerunSafe: true, protectedFieldsVerified: true };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, report }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
