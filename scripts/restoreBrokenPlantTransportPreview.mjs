import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const receiptPath = path.join(projectRoot, "reports", "plant_transport_preview_recovery_20260826.json");
const oldDiagramUrl = "/manus-storage/biology-plant-transport-original_1e2a8b38.png";
const newDiagramUrl = "/manus-storage/owner-biology-plant-transport-restored-20260826_8317ae86.png";
const targets = [
  { id: 750005, externalId: "biology-dr-high-0012", sourceId: 9210001, questionText: "The movement of material in the xylem and phloem tissues of the plant are represented by the arrows labelled", optionsJson: "[\"A. III and IV respectively\",\"B. II and I respectively\",\"C. I and II respectively\",\"D. I and III respectively\"]", answerIndex: 0, explanationStatus: "approved" },
  { id: 750006, externalId: "biology-dr-high-0013", sourceId: 9210001, questionText: "During photosynthesis, the arrow labelled II represents the", optionsJson: "[\"A. escape of mineral salts\",\"B. absorption of energy from the sun\",\"C. release of carbon (IV) oxide\",\"D. release of oxygen as a by‑product\"]", answerIndex: 3, explanationStatus: "approved" },
];
const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const protectedSnapshot = (row) => ({ id: row.id, externalId: row.externalId, subject: row.subject, topic: row.topic, difficulty: row.difficulty, questionText: row.questionText, optionsJson: row.optionsJson, answerIndex: row.answerIndex, explanation: row.explanation, explanationStatus: row.explanationStatus, sourceId: row.sourceId });
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const records = [];
  for (const target of targets) {
    const [beforeRows] = await connection.execute(`SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.difficulty, qi.questionText, qi.optionsJson, qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl, qi.sourceId, qs.label AS sourceLabel FROM questionItems qi INNER JOIN questionSources qs ON qs.id = qi.sourceId WHERE qi.id = ?`, [target.id]);
    assert.equal(beforeRows.length, 1, `Missing plant-transport record ${target.id}.`);
    const before = beforeRows[0];
    assert.equal(before.externalId, target.externalId, `External ID changed for ${target.id}.`);
    assert.equal(before.sourceId, target.sourceId, `Source changed for ${target.id}.`);
    assert.equal(before.questionText, target.questionText, `Question text changed for ${target.id}.`);
    assert.equal(before.optionsJson, target.optionsJson, `Options changed for ${target.id}.`);
    assert.equal(before.answerIndex, target.answerIndex, `Answer changed for ${target.id}.`);
    assert.equal(before.explanationStatus, target.explanationStatus, `Status changed for ${target.id}.`);
    assert.ok(!/lekki headmaster|kairo/i.test(`${before.sourceLabel} ${before.questionText}`), `Excluded protected source detected for ${target.id}.`);
    assert.ok([oldDiagramUrl, newDiagramUrl].includes(before.diagramUrl), `Unexpected diagram link for ${target.id}.`);
    const snapshot = protectedSnapshot(before);
    let affectedRows = 0;
    if (before.diagramUrl !== newDiagramUrl) {
      const [result] = await connection.execute(`UPDATE questionItems SET diagramUrl = ? WHERE id = ? AND externalId = ? AND sourceId = ? AND questionText = ? AND optionsJson = ? AND answerIndex = ? AND explanationStatus = ? AND diagramUrl = ?`, [newDiagramUrl, target.id, target.externalId, target.sourceId, target.questionText, target.optionsJson, target.answerIndex, target.explanationStatus, oldDiagramUrl]);
      affectedRows = result.affectedRows;
      assert.equal(affectedRows, 1, `Fresh link did not update exactly one record for ${target.id}.`);
    }
    const [afterRows] = await connection.execute(`SELECT id, externalId, subject, topic, difficulty, questionText, optionsJson, answerIndex, explanation, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE id = ?`, [target.id]);
    const after = afterRows[0];
    assert.equal(after.diagramUrl, newDiagramUrl, `Fresh plant image link failed for ${target.id}.`);
    assert.equal(hash(protectedSnapshot(after)), hash(snapshot), `Protected content changed for ${target.id}.`);
    records.push({ id: target.id, externalId: target.externalId, diagramUrl: { before: before.diagramUrl, after: after.diagramUrl }, protectedFieldsSha256: hash(snapshot), affectedRows });
  }
  await connection.commit();
  const receipt = { generatedAt: new Date().toISOString(), action: "Fresh-link recovery for the unchanged Owner Biology DOCX plant-transport original.", originalImageSha256: "9c8211d8d4e41614e33b9d21f00f51bca98036fa3c9ef9f3571d11c01a6b6807", imageDimensions: "1000x740", changedCount: records.filter((record) => record.affectedRows === 1).length, unchangedOnRepeatCount: records.filter((record) => record.affectedRows === 0).length, learnerEligibilityChanged: false, questionTextChanged: false, kairoChanged: false, lekkiHeadmasterChanged: false, records };
  await fs.writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify({ receiptPath, receipt }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
