import assert from "node:assert/strict";
import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const target = {
  id: 1170007,
  externalId: "OWNER-BIO-DIAGRAM-2025-007",
  expectedQuestionText: "The type of teeth used for tearing in man is labelled",
  expectedOptionsJson: JSON.stringify(["IV", "III", "I", "II"]),
  expectedAnswerIndex: 3,
  newAnswerIndex: 1,
  newExplanation: "Canines are pointed teeth used for gripping and tearing food. In the supplied diagram, the canines are labelled III, so the correct answer is option B (III).",
};

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const [rows] = await connection.execute(
    `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, explanationStatus, topic, sourceId, diagramUrl
     FROM questionItems WHERE id = ?`,
    [target.id],
  );
  assert.equal(rows.length, 1, "The exact teeth record must exist.");
  const before = rows[0];
  assert.equal(before.externalId, target.externalId);
  assert.equal(before.subject, "Biology");
  assert.equal(before.questionText, target.expectedQuestionText);
  assert.equal(before.optionsJson, target.expectedOptionsJson);
  assert.equal(before.answerIndex, target.expectedAnswerIndex);
  assert.equal(before.explanationStatus, "approved");

  const [result] = await connection.execute(
    `UPDATE questionItems SET answerIndex = ?, explanation = ?
     WHERE id = ? AND externalId = ? AND subject = ? AND questionText = ? AND optionsJson = ?
       AND answerIndex = ? AND explanationStatus = ? AND topic = ? AND sourceId = ? AND diagramUrl <=> ?`,
    [target.newAnswerIndex, target.newExplanation, target.id, target.externalId, before.subject, before.questionText, before.optionsJson, target.expectedAnswerIndex, before.explanationStatus, before.topic, before.sourceId, before.diagramUrl],
  );
  assert.equal(result.affectedRows, 1, "The teeth answer correction must change exactly one record.");

  const [afterRows] = await connection.execute(
    `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, explanationStatus, topic, sourceId, diagramUrl
     FROM questionItems WHERE id = ?`,
    [target.id],
  );
  const after = afterRows[0];
  assert.equal(after.answerIndex, target.newAnswerIndex);
  assert.equal(after.explanation, target.newExplanation);
  for (const key of ["id", "externalId", "subject", "questionText", "optionsJson", "explanationStatus", "topic", "sourceId", "diagramUrl"]) {
    assert.deepEqual(after[key], before[key], `${key} changed unexpectedly.`);
  }
  await connection.commit();

  const receipt = {
    generatedAt: new Date().toISOString(),
    target: target.externalId,
    id: target.id,
    changedFields: ["answerIndex", "explanation"],
    oldAnswerIndex: before.answerIndex,
    newAnswerIndex: after.answerIndex,
    protectedFieldsVerified: true,
    lekkiHeadmasterTouched: false,
    idempotentRerunGuard: "requires the old answer index and would make zero changes on a safe rerun",
  };
  await fs.writeFile("/home/ubuntu/jamb-quiz-game/reports/teeth_diagram_answer_iii_20260826.json", `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify(receipt, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
