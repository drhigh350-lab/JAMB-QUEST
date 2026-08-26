import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "owner_supplied_cell_diagram_replacement_20260826.json");
const target = {
  id: 1020055,
  externalId: "supplied-keyed-2004-biology-032",
  sourceId: 11580001,
  questionText: "[DIAGRAM: a plant/animal cell diagram with organelles labelled I, II, III, IV, including nucleus, mitochondria, and other structures]\nThe part labelled II is responsible for",
  optionsJson: "[\"respiration\",\"protein synthesis\",\"excretion\",\"photosynthesis\"]",
  answerIndex: 0,
  explanationStatus: "approved",
  oldDiagramUrl: "/manus-storage/biology-2004-cell-original-label-map-neutral_adf47544.png",
  newDiagramUrl: "/manus-storage/owner-supplied-biology-cell-label-ii-361163_9a80424a.png",
  ownerImageSha256: "869bc894f278d79565cc3b1723f91a0187956dc7b13a861b69187e1e7292f263",
};

function protectedSnapshot(row) {
  return {
    id: row.id,
    externalId: row.externalId,
    subject: row.subject,
    topic: row.topic,
    difficulty: row.difficulty,
    questionText: row.questionText,
    optionsJson: row.optionsJson,
    answerIndex: row.answerIndex,
    explanation: row.explanation,
    explanationStatus: row.explanationStatus,
    sourceId: row.sourceId,
  };
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [beforeRows] = await connection.execute(`
    SELECT id, externalId, subject, topic, difficulty, questionText, optionsJson, answerIndex,
      explanation, explanationStatus, diagramUrl, sourceId
    FROM questionItems WHERE id = ?
  `, [target.id]);
  assert.equal(beforeRows.length, 1, "Expected exactly one supplied cell-diagram record.");
  const before = beforeRows[0];
  assert.equal(before.externalId, target.externalId, "External ID changed; refusing update.");
  assert.equal(before.sourceId, target.sourceId, "Source changed; refusing update.");
  assert.equal(before.questionText, target.questionText, "Question text changed; refusing update.");
  assert.equal(before.optionsJson, target.optionsJson, "Options changed; refusing update.");
  assert.equal(before.answerIndex, target.answerIndex, "Answer index changed; refusing update.");
  assert.equal(before.explanationStatus, target.explanationStatus, "Status changed; refusing update.");
  assert.ok([target.oldDiagramUrl, target.newDiagramUrl].includes(before.diagramUrl), "Unexpected diagram mapping; refusing update.");
  const beforeProtected = protectedSnapshot(before);

  let affectedRows = 0;
  if (before.diagramUrl !== target.newDiagramUrl) {
    const [result] = await connection.execute(`
      UPDATE questionItems
      SET diagramUrl = ?
      WHERE id = ? AND externalId = ? AND sourceId = ? AND questionText = ?
        AND optionsJson = ? AND answerIndex = ? AND explanationStatus = ? AND diagramUrl = ?
    `, [target.newDiagramUrl, target.id, target.externalId, target.sourceId, target.questionText, target.optionsJson, target.answerIndex, target.explanationStatus, target.oldDiagramUrl]);
    affectedRows = result.affectedRows;
    assert.equal(affectedRows, 1, "Mapping update did not affect exactly one guarded record.");
  }

  const [afterRows] = await connection.execute(`
    SELECT id, externalId, subject, topic, difficulty, questionText, optionsJson, answerIndex,
      explanation, explanationStatus, diagramUrl, sourceId
    FROM questionItems WHERE id = ?
  `, [target.id]);
  assert.equal(afterRows.length, 1, "Record disappeared after guarded update.");
  const after = afterRows[0];
  assert.equal(after.diagramUrl, target.newDiagramUrl, "Owner-supplied diagram URL was not saved.");
  assert.equal(digest(protectedSnapshot(after)), digest(beforeProtected), "A protected field changed; refusing receipt.");

  const receipt = {
    generatedAt: new Date().toISOString(),
    action: "Guarded mapping-only replacement with owner-supplied original image.",
    record: { id: target.id, externalId: target.externalId, subject: after.subject, topic: after.topic, sourceId: target.sourceId },
    ownerImage: { filename: "361163.png", dimensions: "1522x1033", sha256: target.ownerImageSha256, storedUrl: target.newDiagramUrl },
    diagramUrl: { before: before.diagramUrl, after: after.diagramUrl },
    protectedFieldsSha256: digest(beforeProtected),
    affectedRows,
    learnerEligibilityChanged: false,
    lekkiHeadmasterChanged: false,
  };
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
