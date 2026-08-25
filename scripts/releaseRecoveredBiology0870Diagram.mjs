import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "recovered_biology_0870_diagram_release_20260825.json");
const target = {
  externalId: "biology_0870",
  expectedCurrentDiagramUrl: null,
  replacementDiagramUrl: "/manus-storage/biology-0870-myschool-original_c780fc2d.jpeg",
  questionText: "The graph above shows the results of a laboratory investigation which measured the body temperatures of a lizard and a bird under changing artificial conditions. Use it to answer the question. What physiological term can be used to describe the regulation of the body temperature of the lizard?",
  optionsJson: '["Homeostasis","Homoiothermy","Poikilothermy","Osmoregulation"]',
  answerIndex: 2,
  topic: "Coordination and control",
  sourceId: 22620001,
};
const protectedFields = ["questionText", "optionsJson", "answerIndex", "topic", "explanation", "sourceId"];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, ${protectedFields.join(", ")}, diagramUrl, explanationStatus FROM questionItems WHERE externalId = ? LIMIT 1`,
    [target.externalId],
  );
  const row = rows[0];
  const receipt = { externalId: target.externalId, released: false, alreadyReleased: false, skipped: false, reason: null };
  const sourceMatches = row
    && row.questionText === target.questionText
    && row.optionsJson === target.optionsJson
    && Number(row.answerIndex) === target.answerIndex
    && row.topic === target.topic
    && Number(row.sourceId) === target.sourceId
    && row.explanationStatus === "approved";

  if (!sourceMatches) {
    receipt.skipped = true;
    receipt.reason = "protected source or approved-status mismatch";
  } else if (row.diagramUrl === target.replacementDiagramUrl) {
    receipt.alreadyReleased = true;
    receipt.reason = "already mapped to verified original lizard-and-bird graph";
  } else if (row.diagramUrl !== target.expectedCurrentDiagramUrl) {
    receipt.skipped = true;
    receipt.reason = "unexpected current diagram mapping";
  } else {
    const protectedSnapshot = Object.fromEntries(protectedFields.map((field) => [field, row[field]]));
    const [result] = await connection.execute(
      "UPDATE questionItems SET diagramUrl = ? WHERE id = ? AND externalId = ? AND diagramUrl IS NULL AND explanationStatus = 'approved'",
      [target.replacementDiagramUrl, row.id, target.externalId],
    );
    if (result.affectedRows !== 1) {
      receipt.skipped = true;
      receipt.reason = "guarded mapping update did not apply";
    } else {
      const [afterRows] = await connection.execute(
        `SELECT ${protectedFields.join(", ")}, diagramUrl, explanationStatus FROM questionItems WHERE id = ? LIMIT 1`,
        [row.id],
      );
      const after = afterRows[0];
      const protectedUnchanged = protectedFields.every((field) => after[field] === protectedSnapshot[field]);
      if (!protectedUnchanged || after.diagramUrl !== target.replacementDiagramUrl || after.explanationStatus !== "approved") {
        throw new Error(`post-update protected-field verification failed for ${target.externalId}`);
      }
      receipt.released = true;
      receipt.reason = "exact MySchool original lizard-and-bird graph verified separately from the source answer and free of watermark, options, answer letters, correction text, and source chrome";
    }
  }

  await fs.writeFile(
    reportPath,
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      scope: "Guarded mapping-only release of an exact-source Biology thermoregulation graph. Question text, options, answer index, topic, explanation, and source relationship remain unchanged.",
      target,
      receipt,
    }, null, 2)}\n`,
  );
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
