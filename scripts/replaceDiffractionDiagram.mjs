import assert from "node:assert/strict";
import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const target = {
  id: 1140020,
  externalId: "pasted_content_7.txt:https://myschool.ng/classroom/physics/67249?exam_type=jamb&exam_year=2023&page=1:1",
  expectedQuestionText: "The property of wave shown in the diagram above is?",
  expectedDiagramUrl: "/manus-storage/jamb-quest-physics-diffraction-wave-neutral_999b518c.svg",
  newDiagramUrl: "/manus-storage/09b24020-a16d-11f1-bf0f-f32031ac4e86_665b74c5.webp",
};

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const [beforeRows] = await connection.execute(
    `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, explanationStatus, topic, sourceId, diagramUrl
     FROM questionItems WHERE id = ?`,
    [target.id],
  );
  assert.equal(beforeRows.length, 1, "The exact diffraction record must exist.");
  const before = beforeRows[0];
  assert.equal(before.externalId, target.externalId);
  assert.equal(before.subject, "Physics");
  assert.equal(before.questionText, target.expectedQuestionText);
  assert.ok(before.diagramUrl === target.expectedDiagramUrl || before.diagramUrl === target.newDiagramUrl, "Unexpected current diffraction picture.");
  const [result] = await connection.execute(
    `UPDATE questionItems SET diagramUrl = ?
     WHERE id = ? AND externalId = ? AND subject = ? AND questionText = ? AND optionsJson = ?
       AND answerIndex = ? AND explanation <=> ? AND explanationStatus = ? AND topic = ? AND sourceId = ?
       AND (diagramUrl = ? OR diagramUrl = ?)`,
    [target.newDiagramUrl, target.id, target.externalId, before.subject, before.questionText, before.optionsJson, before.answerIndex, before.explanation, before.explanationStatus, before.topic, before.sourceId, target.expectedDiagramUrl, target.newDiagramUrl],
  );
  assert.ok(result.affectedRows === 0 || result.affectedRows === 1, "Unexpected diffraction update count.");
  const [afterRows] = await connection.execute(
    `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, explanationStatus, topic, sourceId, diagramUrl
     FROM questionItems WHERE id = ?`,
    [target.id],
  );
  const after = afterRows[0];
  assert.equal(after.diagramUrl, target.newDiagramUrl);
  for (const key of ["externalId", "subject", "questionText", "optionsJson", "answerIndex", "explanation", "explanationStatus", "topic", "sourceId"]) assert.deepEqual(after[key], before[key], `${key} changed unexpectedly.`);
  await connection.commit();
  const receipt = { generatedAt: new Date().toISOString(), target, changedOnly: "diagramUrl", protectedFieldsVerified: true, lekkiHeadmasterTouched: false, idempotentRerunSafe: true };
  await fs.writeFile("/home/ubuntu/jamb-quiz-game/reports/diffraction_diagram_replacement_20260826.json", `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify(receipt, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
