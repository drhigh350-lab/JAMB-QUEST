import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const inventoryPath = path.join(projectRoot, "reports", "bracketed_diagram_top_note_inventory_20260826.json");
const receiptPath = path.join(projectRoot, "reports", "bracketed_diagram_top_note_removal_receipt_20260826.json");
const topNote = /^\s*(\[(?:diagram\s*:|refers?\s+to\b[^\]]*(?:diagram|figure|graph|table|set-?up)[^\]]*)\])\s*/i;
const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8"));
const targets = inventory.records;
assert.equal(targets.length, 4, "Bracketed note inventory changed; refusing cleanup.");
const protectedSnapshot = (row) => ({ id: row.id, externalId: row.externalId, subject: row.subject, topic: row.topic, difficulty: row.difficulty, optionsJson: row.optionsJson, answerIndex: row.answerIndex, explanation: row.explanation, explanationStatus: row.explanationStatus, diagramUrl: row.diagramUrl, sourceId: row.sourceId });
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const records = [];
  for (const target of targets) {
    const [beforeRows] = await connection.execute(`SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.difficulty, qi.questionText, qi.optionsJson, qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl, qi.sourceId, qs.label AS sourceLabel FROM questionItems qi INNER JOIN questionSources qs ON qs.id = qi.sourceId WHERE qi.id = ?`, [target.id]);
    assert.equal(beforeRows.length, 1, `Missing record ${target.id}.`);
    const before = beforeRows[0];
    const targetOptionsJson = JSON.stringify(target.options);
    assert.equal(before.externalId, target.externalId, `External ID changed for ${target.id}.`);
    assert.equal(before.sourceId, target.sourceId, `Source changed for ${target.id}.`);
    assert.equal(before.optionsJson, targetOptionsJson, `Options changed for ${target.id}.`);
    assert.equal(before.answerIndex, target.answerIndex, `Answer changed for ${target.id}.`);
    assert.equal(before.explanationStatus, target.explanationStatus, `Status changed for ${target.id}.`);
    assert.equal(before.diagramUrl, target.diagramUrl, `Diagram link changed for ${target.id}.`);
    assert.ok(!/lekki headmaster/i.test(`${before.sourceLabel} ${before.questionText}`), `Lekki record ${target.id} is excluded.`);
    const expectedCleaned = target.questionAfterRemovingNote;
    const hasNote = topNote.test(before.questionText);
    const cleaned = hasNote ? before.questionText.replace(topNote, "").trimStart() : before.questionText;
    assert.equal(cleaned, expectedCleaned, `Unexpected question wording for ${target.id}.`);
    const snapshot = protectedSnapshot(before);
    let affectedRows = 0;
    if (hasNote) {
      const [result] = await connection.execute(`UPDATE questionItems SET questionText = ? WHERE id = ? AND externalId = ? AND sourceId = ? AND questionText = ? AND optionsJson = ? AND answerIndex = ? AND explanationStatus = ? AND diagramUrl = ?`, [cleaned, before.id, before.externalId, before.sourceId, before.questionText, targetOptionsJson, before.answerIndex, before.explanationStatus, before.diagramUrl]);
      affectedRows = result.affectedRows;
      assert.equal(affectedRows, 1, `Top note removal did not affect exactly one record for ${target.id}.`);
    }
    const [afterRows] = await connection.execute(`SELECT id, externalId, subject, topic, difficulty, questionText, optionsJson, answerIndex, explanation, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE id = ?`, [target.id]);
    const after = afterRows[0];
    assert.equal(after.questionText, expectedCleaned, `Top note remains for ${target.id}.`);
    assert.equal(digest(protectedSnapshot(after)), digest(snapshot), `Protected data changed for ${target.id}.`);
    records.push({ id: target.id, externalId: target.externalId, removedNote: target.note, questionTextBefore: before.questionText, questionTextAfter: after.questionText, diagramUrlUnchanged: after.diagramUrl, protectedFieldsSha256: digest(snapshot), affectedRows });
  }
  await connection.commit();
  const receipt = { generatedAt: new Date().toISOString(), action: "Guarded removal of leading bracketed diagram-reference notes only.", targetCount: targets.length, changedCount: records.filter((record) => record.affectedRows === 1).length, unchangedOnRepeatCount: records.filter((record) => record.affectedRows === 0).length, diagramLinksChanged: false, learnerEligibilityChanged: false, kairoChanged: false, lekkiHeadmasterChanged: false, records };
  await fs.writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify({ receiptPath, receipt }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
