import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "repaired_kairo_csv_chemistry_ea3781_ideal_gas_graph_20260825.json");
const target = {
  externalId: "kairo-csv-chemistry_ea3781",
  questionText: "From the diagram above, an ideal gas can be represented by:",
  topic: "Kinetic theory of matter and gases",
  sourceId: 12330002,
  expectedOptionsJson: '["M.","N.","K.","L."]',
  expectedAnswerIndex: 0,
  expectedExplanation: "Although the specific diagram is hidden, UTME typically tests this concept using a graph of PV/RT against pressure. For an ideal gas, PV/RT always equals 1, regardless of the pressure. This creates a perfectly horizontal, straight line (often labeled M). Real gases deviate and curve up or down. Whenever you see this graph, the straight flat line represents the theoretical 'ideal' behavior.",
  expectedDiagramUrl: null,
  replacementAnswerIndex: 1,
  replacementExplanation: "In the exact source graph, N is the horizontal line, so its PV value remains unchanged as pressure varies. It represents ideal gas behaviour.",
  replacementDiagramUrl: "/manus-storage/chemistry-ideal-gas-schoolngr-original_002271ae.png",
};
const immutableFields = ["questionText", "optionsJson", "topic", "sourceId"];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, ${immutableFields.join(", ")}, answerIndex, explanation, diagramUrl, explanationStatus
     FROM questionItems WHERE externalId = ? LIMIT 1`,
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
    receipt.reason = "already repaired to the clean exact JAMB 2011 graph and source-proven response data";
  } else if (
    Number(row.answerIndex) !== target.expectedAnswerIndex
    || row.explanation !== target.expectedExplanation
    || row.diagramUrl !== target.expectedDiagramUrl
  ) {
    receipt.skipped = true;
    receipt.reason = "unexpected current source-proven fields";
  } else {
    const immutableSnapshot = Object.fromEntries(immutableFields.map((field) => [field, row[field]]));
    const [result] = await connection.execute(
      "UPDATE questionItems SET answerIndex = ?, explanation = ?, diagramUrl = ? WHERE id = ? AND externalId = ? AND answerIndex = ? AND explanation = ? AND diagramUrl IS NULL AND explanationStatus = 'approved'",
      [
        target.replacementAnswerIndex,
        target.replacementExplanation,
        target.replacementDiagramUrl,
        row.id,
        target.externalId,
        target.expectedAnswerIndex,
        target.expectedExplanation,
      ],
    );
    if (result.affectedRows !== 1) {
      receipt.skipped = true;
      receipt.reason = "guarded source-proven update did not apply";
    } else {
      const [afterRows] = await connection.execute(
        `SELECT ${immutableFields.join(", ")}, answerIndex, explanation, diagramUrl, explanationStatus
         FROM questionItems WHERE id = ? LIMIT 1`,
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
      receipt.reason = "exact SchoolNGR JAMB 2011 source provides the clean M/N/K/L graph and keys N as option B; MySchool independently matches that prompt, option order, and answer but its watermarked visual was not used";
    }
  }

  await fs.writeFile(
    reportPath,
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      scope: "Guarded source-proven repair of a held Chemistry graph record. It changes only the corroborated answer index, explanation, and clean original diagram mapping; stem, option order, topic, authorised source relationship, and approved status are verified unchanged.",
      target,
      receipt,
    }, null, 2)}\n`,
  );
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
