import assert from "node:assert/strict";
import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const updates = [
  { id: 1050171, externalId: "kairo-csv-chemistry_30bd42", expectedDiagramUrl: "/manus-storage/chemistry-organic-structure-original_fa400ff1.png", newDiagramUrl: "/manus-storage/361320_b9c7bf03.png" },
  { id: 1050122, externalId: "kairo-csv-chemistry_20650b", expectedDiagramUrl: "/manus-storage/chemistry-energy-profile-original-20260826_69a97b4c.png", newDiagramUrl: "/manus-storage/361319_fa65243d.png" },
  { id: 1170009, externalId: "OWNER-BIO-DIAGRAM-2025-009", expectedDiagramUrl: "/manus-storage/owner-bio-diagram-2025-009_70ea46c4.png", newDiagramUrl: "/manus-storage/eff8e838-cc13-42a4-8eb6-72f5154f1e16_6298bc87.png" },
  { id: 1170007, externalId: "OWNER-BIO-DIAGRAM-2025-007", expectedDiagramUrl: "/manus-storage/owner-bio-diagram-2025-007_bc399683.png", newDiagramUrl: "/manus-storage/42349b3d-5d89-4d76-aadd-4a41e6a8f4fb(1)_3bcd216a.png" },
  { id: 1170002, externalId: "OWNER-BIO-DIAGRAM-2025-002", expectedDiagramUrl: "/manus-storage/owner-bio-diagram-2025-002_eb1f7c83.png", newDiagramUrl: "/manus-storage/65b13ce8-83ec-449a-8bbf-30e6aaf08540_a28ca462.png" },
];
const terminated = { id: 1050117, externalId: "kairo-csv-chemistry_1ea741", explanationStatus: "needs_review" };
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const reportPath = "/home/ubuntu/jamb-quiz-game/reports/new_owner_diagram_batch_20260826.json";
try {
  await connection.beginTransaction();
  const ids = [...updates.map((item) => item.id), terminated.id];
  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await connection.execute(`SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, explanationStatus, topic, sourceId, diagramUrl FROM questionItems WHERE id IN (${placeholders}) ORDER BY id`, ids);
  assert.equal(rows.length, ids.length, "Every exact target record must exist.");
  const before = new Map(rows.map((row) => [row.id, row]));
  const held = before.get(terminated.id);
  assert.equal(held.externalId, terminated.externalId);
  assert.equal(held.explanationStatus, terminated.explanationStatus);
  assert.equal(held.diagramUrl, null);
  for (const item of updates) {
    const row = before.get(item.id);
    assert.equal(row.externalId, item.externalId);
    assert.ok(row.diagramUrl === item.expectedDiagramUrl || row.diagramUrl === item.newDiagramUrl, `Unexpected existing image on ${item.externalId}`);
    const [result] = await connection.execute(`UPDATE questionItems SET diagramUrl = ? WHERE id = ? AND externalId = ? AND subject = ? AND topic = ? AND questionText = ? AND optionsJson = ? AND answerIndex = ? AND explanation <=> ? AND explanationStatus = ? AND sourceId = ? AND (diagramUrl = ? OR diagramUrl = ?)`, [item.newDiagramUrl, item.id, item.externalId, row.subject, row.topic, row.questionText, row.optionsJson, row.answerIndex, row.explanation, row.explanationStatus, row.sourceId, item.expectedDiagramUrl, item.newDiagramUrl]);
    assert.ok(result.affectedRows === 0 || result.affectedRows === 1, `Unexpected update count for ${item.externalId}`);
  }
  const [afterRows] = await connection.execute(`SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, explanationStatus, topic, sourceId, diagramUrl FROM questionItems WHERE id IN (${placeholders}) ORDER BY id`, ids);
  const after = new Map(afterRows.map((row) => [row.id, row]));
  for (const item of updates) {
    const row = after.get(item.id);
    assert.equal(row.diagramUrl, item.newDiagramUrl, `New image did not save on ${item.externalId}`);
    const beforeRow = before.get(item.id);
    for (const field of ["externalId", "subject", "questionText", "optionsJson", "answerIndex", "explanation", "explanationStatus", "topic", "sourceId"]) assert.deepEqual(row[field], beforeRow[field], `${field} changed on ${item.externalId}`);
  }
  const afterHeld = after.get(terminated.id);
  assert.equal(afterHeld.diagramUrl, null);
  assert.equal(afterHeld.explanationStatus, terminated.explanationStatus);
  await connection.commit();
  const report = { generatedAt: new Date().toISOString(), changedOnly: "diagramUrl", updates: updates.map(({ id, externalId, newDiagramUrl }) => ({ id, externalId, newDiagramUrl })), terminatedStillHidden: terminated, protectedFieldsVerified: true, lekkiHeadmasterTouched: false, idempotentRerunSafe: true };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, report }, null, 2));
} catch (error) { await connection.rollback(); throw error; } finally { await connection.end(); }
