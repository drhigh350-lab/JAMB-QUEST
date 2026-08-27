import assert from "node:assert/strict";
import mysql from "mysql2/promise";

const mappings = [
  { id: 1170005, externalId: "OWNER-BIO-DIAGRAM-2025-005", questionText: "The part of the flower that is brightly coloured and attracts pollinating agents such as insects is labelled", oldUrl: "/manus-storage/owner-bio-diagram-2025-005_51f986ac.png", newUrl: "/manus-storage/361471_783560b3.png" },
  { id: 1170006, externalId: "OWNER-BIO-DIAGRAM-2025-006", questionText: "The part labelled I is the", oldUrl: "/manus-storage/owner-bio-diagram-2025-006_5eb4d812.png", newUrl: "/manus-storage/361433_f756c5b7.png" },
  { id: 1170003, externalId: "OWNER-BIO-DIAGRAM-2025-003", questionText: "The part labelled II is the", oldUrl: "/manus-storage/d53ee860-a163-11f1-aa95-c705be48a32d_7301fc24.png", newUrl: "/manus-storage/361430_48c28eed.png" },
  { id: 1170008, externalId: "OWNER-BIO-DIAGRAM-2025-008", questionText: "The endocrine gland that is located in the part labelled I is", oldUrl: "/manus-storage/owner-bio-diagram-2025-008_04c94f3c.png", newUrl: "/manus-storage/361429_964160d4.png" },
];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  for (const mapping of mappings) {
    const [rows] = await connection.execute(
      `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, explanationStatus, topic, sourceId, diagramUrl
       FROM questionItems WHERE id = ?`,
      [mapping.id],
    );
    assert.equal(rows.length, 1, `${mapping.externalId} must exist`);
    const before = rows[0];
    assert.equal(before.externalId, mapping.externalId);
    assert.equal(before.subject, "Biology");
    assert.equal(before.questionText, mapping.questionText);
    assert.equal(before.diagramUrl, mapping.oldUrl);
    assert.equal(before.explanationStatus, "approved");

    const [result] = await connection.execute(
      `UPDATE questionItems SET diagramUrl = ?
       WHERE id = ? AND externalId = ? AND subject = ? AND questionText = ? AND optionsJson = ?
         AND answerIndex = ? AND explanation = ? AND explanationStatus = ? AND topic = ? AND sourceId = ? AND diagramUrl = ?`,
      [mapping.newUrl, before.id, before.externalId, before.subject, before.questionText, before.optionsJson, before.answerIndex, before.explanation, before.explanationStatus, before.topic, before.sourceId, before.diagramUrl],
    );
    assert.equal(result.affectedRows, 1, `${mapping.externalId} must change exactly once`);
  }

  for (const mapping of mappings) {
    const [rows] = await connection.execute(`SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, explanationStatus, topic, sourceId, diagramUrl FROM questionItems WHERE id = ?`, [mapping.id]);
    assert.equal(rows[0].diagramUrl, mapping.newUrl);
  }
  await connection.commit();
  console.log(JSON.stringify({ changed: mappings.map(({ externalId, id, newUrl }) => ({ externalId, id, diagramUrl: newUrl })), changedOnly: "diagramUrl", lekkiHeadmasterTouched: false }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
