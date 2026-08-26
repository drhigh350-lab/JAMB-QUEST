import assert from "node:assert/strict";
import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const replacements = [
  {
    id: 1170004,
    externalId: "OWNER-BIO-DIAGRAM-2025-004",
    expectedDiagramUrl: "/manus-storage/owner-bio-diagram-2025-004_abd70262.png",
    newDiagramUrl: "/manus-storage/Gemini_Generated_Image_yxf649yxf649yxf6_a31767f9.jpg",
  },
  {
    id: 1170003,
    externalId: "OWNER-BIO-DIAGRAM-2025-003",
    expectedDiagramUrl: "/manus-storage/owner-bio-diagram-2025-003_f017e9d4.png",
    newDiagramUrl: "/manus-storage/d53ee860-a163-11f1-aa95-c705be48a32d_7301fc24.png",
  },
  {
    id: 1050536,
    externalId: "kairo-csv-chemistry_ea3781",
    expectedDiagramUrl: "/manus-storage/chemistry-ideal-gas-schoolngr-original_002271ae.png",
    newDiagramUrl: "/manus-storage/5587f440-a168-11f1-8e1a-9529d895e9b2_ec811623.png",
  },
  {
    id: 1050438,
    externalId: "kairo-csv-chemistry_bcfca8",
    expectedDiagramUrl: "/manus-storage/chemistry-kclo3-schoolngr-original_4374f259.png",
    newDiagramUrl: "/manus-storage/8c64c100-a168-11f1-8e1a-9529d895e9b2_b6b8f094.png",
  },
];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const ids = replacements.map((item) => item.id);
  const [beforeRows] = await connection.execute(
    `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, explanationStatus, topic, sourceId, diagramUrl
     FROM questionItems WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY id`,
    ids,
  );
  assert.equal(beforeRows.length, replacements.length, "All four exact targets must exist.");
  const before = new Map(beforeRows.map((row) => [row.id, row]));

  for (const item of replacements) {
    const row = before.get(item.id);
    assert.equal(row.externalId, item.externalId);
    assert.ok(row.diagramUrl === item.expectedDiagramUrl || row.diagramUrl === item.newDiagramUrl, `Unexpected current diagram on ${item.externalId}`);
    const [result] = await connection.execute(
      `UPDATE questionItems SET diagramUrl = ?
       WHERE id = ? AND externalId = ? AND subject = ? AND questionText = ? AND optionsJson = ?
         AND answerIndex = ? AND explanation <=> ? AND explanationStatus = ? AND topic = ? AND sourceId = ?
         AND (diagramUrl = ? OR diagramUrl = ?)`,
      [item.newDiagramUrl, item.id, item.externalId, row.subject, row.questionText, row.optionsJson, row.answerIndex, row.explanation, row.explanationStatus, row.topic, row.sourceId, item.expectedDiagramUrl, item.newDiagramUrl],
    );
    assert.ok(result.affectedRows === 0 || result.affectedRows === 1, `Unexpected update count for ${item.externalId}`);
  }

  const [afterRows] = await connection.execute(
    `SELECT id, externalId, subject, questionText, optionsJson, answerIndex, explanation, explanationStatus, topic, sourceId, diagramUrl
     FROM questionItems WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY id`,
    ids,
  );
  const after = new Map(afterRows.map((row) => [row.id, row]));
  for (const item of replacements) {
    const beforeRow = before.get(item.id);
    const afterRow = after.get(item.id);
    assert.equal(afterRow.diagramUrl, item.newDiagramUrl, `New picture did not save on ${item.externalId}`);
    for (const key of ["externalId", "subject", "questionText", "optionsJson", "answerIndex", "explanation", "explanationStatus", "topic", "sourceId"]) {
      assert.deepEqual(afterRow[key], beforeRow[key], `${key} changed on ${item.externalId}`);
    }
  }
  await connection.commit();
  const receipt = {
    generatedAt: new Date().toISOString(),
    changedOnly: "diagramUrl",
    replacements: replacements.map(({ id, externalId, newDiagramUrl }) => ({ id, externalId, newDiagramUrl })),
    protectedFieldsVerified: true,
    lekkiHeadmasterTouched: false,
    idempotentRerunSafe: true,
  };
  await fs.writeFile("/home/ubuntu/jamb-quiz-game/reports/four_owner_requested_replacements_20260826.json", `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify(receipt, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
