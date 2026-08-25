import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "repaired_biology_0396_source_graph_20260825.json");
const target = {
  externalId: "biology_0396",
  questionText: "From the diagram above the optimal temperature for breeding cockroaches is",
  topic: "Natural habitats",
  sourceId: 22500001,
  expectedOptionsJson: '["15","19","Download Offline App","33"]',
  expectedAnswerIndex: 3,
  expectedDiagramUrl: null,
  replacementOptionsJson: '["15 °C","19 °C","24 °C","33 °C"]',
  replacementAnswerIndex: 2,
  replacementExplanation: "Read the curve with the largest number of cockroaches. The curve marked 24 °C reaches the highest value, so 24 °C is the optimum temperature for breeding in the diagram.",
  replacementDiagramUrl: "/manus-storage/biology-0396-schoolngr-source-panel_658f04ef.png",
};
const immutableFields = ["questionText", "topic", "sourceId"];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, ${immutableFields.join(", ")}, optionsJson, answerIndex, explanation, diagramUrl, explanationStatus
     FROM questionItems WHERE externalId = ? LIMIT 1`,
    [target.externalId],
  );
  const row = rows[0];
  const receipt = { externalId: target.externalId, repaired: false, alreadyRepaired: false, skipped: false, reason: null };
  const immutableMatch = row
    && row.questionText === target.questionText
    && row.topic === target.topic
    && Number(row.sourceId) === target.sourceId
    && row.explanationStatus === "approved";

  if (!immutableMatch) {
    receipt.skipped = true;
    receipt.reason = "protected question or source mismatch";
  } else if (
    row.optionsJson === target.replacementOptionsJson
    && Number(row.answerIndex) === target.replacementAnswerIndex
    && row.explanation === target.replacementExplanation
    && row.diagramUrl === target.replacementDiagramUrl
  ) {
    receipt.alreadyRepaired = true;
    receipt.reason = "already repaired to exact public-source graph and response data";
  } else if (
    row.optionsJson !== target.expectedOptionsJson
    || Number(row.answerIndex) !== target.expectedAnswerIndex
    || row.diagramUrl !== target.expectedDiagramUrl
  ) {
    receipt.skipped = true;
    receipt.reason = "unexpected current source-proven fields";
  } else {
    const immutableSnapshot = Object.fromEntries(immutableFields.map((field) => [field, row[field]]));
    const [result] = await connection.execute(
      `UPDATE questionItems
       SET optionsJson = ?, answerIndex = ?, explanation = ?, diagramUrl = ?
       WHERE id = ? AND externalId = ? AND optionsJson = ? AND answerIndex = ? AND diagramUrl IS NULL AND explanationStatus = 'approved'`,
      [
        target.replacementOptionsJson,
        target.replacementAnswerIndex,
        target.replacementExplanation,
        target.replacementDiagramUrl,
        row.id,
        target.externalId,
        target.expectedOptionsJson,
        target.expectedAnswerIndex,
      ],
    );
    if (result.affectedRows !== 1) {
      receipt.skipped = true;
      receipt.reason = "guarded source-proven update did not apply";
    } else {
      const [afterRows] = await connection.execute(
        `SELECT ${immutableFields.join(", ")}, optionsJson, answerIndex, explanation, diagramUrl, explanationStatus
         FROM questionItems WHERE id = ? LIMIT 1`,
        [row.id],
      );
      const after = afterRows[0];
      const immutableUnchanged = immutableFields.every((field) => after[field] === immutableSnapshot[field]);
      const repairedValuesMatch = after.optionsJson === target.replacementOptionsJson
        && Number(after.answerIndex) === target.replacementAnswerIndex
        && after.explanation === target.replacementExplanation
        && after.diagramUrl === target.replacementDiagramUrl
        && after.explanationStatus === "approved";
      if (!immutableUnchanged || !repairedValuesMatch) {
        throw new Error(`post-update source-evidence verification failed for ${target.externalId}`);
      }
      receipt.repaired = true;
      receipt.reason = "exact public-source graph confirms 24 °C option/key and supports the replacement explanation";
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "Guarded source-proven repair of a held diagram-dependent Biology record. It changes only exact public-source-proven options, answer index, explanation, and diagram mapping; stem, topic, source relationship, and approved status are verified unchanged.",
    target,
    receipt,
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
