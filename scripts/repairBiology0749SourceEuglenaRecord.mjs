import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "repaired_biology_0749_source_euglena_20260825.json");
const target = {
  externalId: "biology_0749",
  questionText: "Use the diagram above to answer this question. The part responsible for photosynthesis is labelled",
  topic: "Nutrition and digestion",
  sourceId: 22500001,
  expectedOptionsJson: '["III","IV","I","II"]',
  expectedAnswerIndex: 3,
  expectedDiagramUrl: null,
  replacementAnswerIndex: 0,
  replacementExplanation: "In the exact source figure, label III identifies the chloroplast-containing part of Euglena. Chloroplasts contain chlorophyll and carry out photosynthesis.",
  replacementDiagramUrl: "/manus-storage/biology-0749-schoolngr-original_64d08afe.png",
};
const immutableFields = ["questionText", "optionsJson", "topic", "sourceId"];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, ${immutableFields.join(", ")}, answerIndex, explanation, diagramUrl, explanationStatus FROM questionItems WHERE externalId = ? LIMIT 1`,
    [target.externalId],
  );
  const row = rows[0];
  const receipt = { externalId: target.externalId, repaired: false, alreadyRepaired: false, skipped: false, reason: null };
  const immutableMatch = row
    && row.questionText === target.questionText
    && row.optionsJson === target.expectedOptionsJson
    && row.topic === target.topic
    && Number(row.sourceId) === target.sourceId
    && row.explanationStatus === "approved";

  if (!immutableMatch) {
    receipt.skipped = true;
    receipt.reason = "protected question or source mismatch";
  } else if (
    Number(row.answerIndex) === target.replacementAnswerIndex
    && row.explanation === target.replacementExplanation
    && row.diagramUrl === target.replacementDiagramUrl
  ) {
    receipt.alreadyRepaired = true;
    receipt.reason = "already repaired to exact original Euglena figure and corroborated response data";
  } else if (Number(row.answerIndex) !== target.expectedAnswerIndex || row.diagramUrl !== target.expectedDiagramUrl) {
    receipt.skipped = true;
    receipt.reason = "unexpected current source-proven fields";
  } else {
    const immutableSnapshot = Object.fromEntries(immutableFields.map((field) => [field, row[field]]));
    const [result] = await connection.execute(
      "UPDATE questionItems SET answerIndex = ?, explanation = ?, diagramUrl = ? WHERE id = ? AND externalId = ? AND answerIndex = ? AND diagramUrl IS NULL AND explanationStatus = 'approved'",
      [target.replacementAnswerIndex, target.replacementExplanation, target.replacementDiagramUrl, row.id, target.externalId, target.expectedAnswerIndex],
    );
    if (result.affectedRows !== 1) {
      receipt.skipped = true;
      receipt.reason = "guarded source-proven update did not apply";
    } else {
      const [afterRows] = await connection.execute(
        `SELECT ${immutableFields.join(", ")}, answerIndex, explanation, diagramUrl, explanationStatus FROM questionItems WHERE id = ? LIMIT 1`,
        [row.id],
      );
      const after = afterRows[0];
      const immutableUnchanged = immutableFields.every((field) => after[field] === immutableSnapshot[field]);
      const repairedValuesMatch = Number(after.answerIndex) === target.replacementAnswerIndex
        && after.explanation === target.replacementExplanation
        && after.diagramUrl === target.replacementDiagramUrl
        && after.explanationStatus === "approved";
      if (!immutableUnchanged || !repairedValuesMatch) {
        throw new Error(`post-update source-evidence verification failed for ${target.externalId}`);
      }
      receipt.repaired = true;
      receipt.reason = "exact SchoolNGR JAMB 2014 original maps photosynthesis to III; independent TestDriller JAMB 2014 Question 3 also marks III as the correct label despite a differently ordered option list";
    }
  }

  await fs.writeFile(
    reportPath,
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      scope: "Guarded source-proven repair of a held diagram-dependent Biology record. It changes only corroborated answer index, explanation, and original diagram mapping; stem, option order, topic, source relationship, and approved status are verified unchanged.",
      target,
      receipt,
    }, null, 2)}\n`,
  );
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
