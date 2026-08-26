import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "recovered_biology_0551_diagram_release_20260826.json");
const target = {
  externalId: "biology_0551",
  expectedCurrentDiagramUrl: null,
  replacementDiagramUrl: "/manus-storage/biology-0551-testdriller-original_7dc25806.png",
  questionText: "Use the diagram above to answer this question. Emulsification of fats takes place in the part labelled?",
  optionsJson: '["I","II","III","IV"]',
  answerIndex: 3,
  topic: "Nutrition and digestion",
  sourceId: 22500001,
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
    receipt.reason = "already mapped to verified clean TestDriller original emulsification figure";
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
      receipt.reason = "exact TestDriller JAMB 2009 original is complete and clean: all I–IV leaders, digestive anatomy, and soil-free figure geometry are visible with no answer option, answer letter, correction, watermark, or source residue; conflicting TestDriller answer metadata does not authorise an answer-field edit, so the active D/IV key remains unmodified in this mapping-only release";
    }
  }

  await fs.writeFile(
    reportPath,
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      scope: "Guarded mapping-only release of the clean exact JAMB 2009 emulsification figure. Question text, options, answer index, topic, explanation, and source relationship remain unchanged.",
      target,
      receipt,
    }, null, 2)}\n`,
  );
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
