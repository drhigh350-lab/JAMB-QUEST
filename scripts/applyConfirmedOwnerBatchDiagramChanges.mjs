import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const receiptPath = path.join("/home/ubuntu/jamb-quiz-game", "reports", "confirmed_owner_batch_diagram_changes_20260826.json");
const targets = [
  { id: 660007, externalId: "chem-docx-240", sourceId: 8880001, questionText: "How many carbon-carbon double bonds are formally represented in a Kekulé structure of benzene (C6H6)?", oldDiagramUrl: "/manus-storage/jamb-quest-benzene-kekule_36e25e7a.png", newDiagramUrl: null, reason: "Owner-confirmed text-only benzene question." },
  { id: 750005, externalId: "biology-dr-high-0012", sourceId: 9210001, questionText: "The movement of material in the xylem and phloem tissues of the plant are represented by the arrows labelled", oldDiagramUrl: "/manus-storage/owner-biology-plant-transport-restored-20260826_8317ae86.png", newDiagramUrl: "/manus-storage/owner-plant-transport-clean-20260826_d0f60ce0.png", reason: "Owner-supplied clean replacement for the same labelled plant-transport original." },
  { id: 750006, externalId: "biology-dr-high-0013", sourceId: 9210001, questionText: "During photosynthesis, the arrow labelled II represents the", oldDiagramUrl: "/manus-storage/owner-biology-plant-transport-restored-20260826_8317ae86.png", newDiagramUrl: "/manus-storage/owner-plant-transport-clean-20260826_d0f60ce0.png", reason: "The paired question uses the same owner-supplied clean plant-transport image." },
  { id: 1170001, externalId: "OWNER-BIO-DIAGRAM-2025-001", sourceId: 13830001, questionText: "What is the genotypic ratio of the F₂ generation?", oldDiagramUrl: "/manus-storage/owner-bio-diagram-2025-001_7a12c1dc.png", newDiagramUrl: "/manus-storage/owner-rr-cross-clean-20260826_58261e88.png", reason: "Owner-supplied clean replacement for the same Rr × Rr genetic cross." },
];
const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const protectedSnapshot = (row) => ({ id: row.id, externalId: row.externalId, subject: row.subject, topic: row.topic, difficulty: row.difficulty, questionText: row.questionText, optionsJson: row.optionsJson, answerIndex: row.answerIndex, explanation: row.explanation, explanationStatus: row.explanationStatus, sourceId: row.sourceId });
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const records = [];
  for (const target of targets) {
    const [beforeRows] = await connection.execute(`SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.difficulty, qi.questionText, qi.optionsJson, qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl, qi.sourceId, qs.label AS sourceLabel FROM questionItems qi INNER JOIN questionSources qs ON qs.id = qi.sourceId WHERE qi.id = ?`, [target.id]);
    assert.equal(beforeRows.length, 1, `Missing record ${target.id}.`);
    const before = beforeRows[0];
    assert.equal(before.externalId, target.externalId, `External ID changed for ${target.id}.`);
    assert.equal(before.sourceId, target.sourceId, `Source changed for ${target.id}.`);
    assert.equal(before.questionText, target.questionText, `Question text changed for ${target.id}.`);
    assert.ok([target.oldDiagramUrl, target.newDiagramUrl].includes(before.diagramUrl), `Unexpected diagram link for ${target.id}.`);
    assert.ok(!/kairo|lekki headmaster/i.test(`${before.sourceLabel} ${before.questionText}`), `Kairo or Lekki record ${target.id} is excluded.`);
    const snapshot = protectedSnapshot(before);
    let affectedRows = 0;
    if (before.diagramUrl !== target.newDiagramUrl) {
      const [result] = await connection.execute(`UPDATE questionItems SET diagramUrl = ? WHERE id = ? AND externalId = ? AND sourceId = ? AND questionText = ? AND optionsJson = ? AND answerIndex = ? AND explanationStatus = ? AND diagramUrl = ?`, [target.newDiagramUrl, before.id, before.externalId, before.sourceId, before.questionText, before.optionsJson, before.answerIndex, before.explanationStatus, target.oldDiagramUrl]);
      affectedRows = result.affectedRows;
      assert.equal(affectedRows, 1, `Diagram update did not affect exactly one record for ${target.id}.`);
    }
    const [afterRows] = await connection.execute(`SELECT id, externalId, subject, topic, difficulty, questionText, optionsJson, answerIndex, explanation, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE id = ?`, [target.id]);
    const after = afterRows[0];
    assert.equal(after.diagramUrl, target.newDiagramUrl, `New diagram link did not save for ${target.id}.`);
    assert.equal(hash(protectedSnapshot(after)), hash(snapshot), `Protected data changed for ${target.id}.`);
    records.push({ id: target.id, externalId: target.externalId, reason: target.reason, diagramUrl: { before: before.diagramUrl, after: after.diagramUrl }, protectedFieldsSha256: hash(snapshot), affectedRows });
  }
  await connection.commit();
  const receipt = { generatedAt: new Date().toISOString(), action: "Guarded owner-confirmed diagram-only batch update.", changedCount: records.filter((record) => record.affectedRows === 1).length, unchangedOnRepeatCount: records.filter((record) => record.affectedRows === 0).length, learnerEligibilityChanged: false, questionTextChanged: false, optionsChanged: false, answerChanged: false, explanationChanged: false, kairoChanged: false, lekkiHeadmasterChanged: false, records };
  await fs.writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify({ receiptPath, receipt }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
