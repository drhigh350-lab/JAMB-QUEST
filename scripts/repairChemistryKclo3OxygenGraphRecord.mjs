import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "repaired_kairo_csv_chemistry_bcfca8_kclo3_graph_20260825.json");
const target = {
  externalId: "kairo-csv-chemistry_bcfca8",
  topic: "Rates of reaction",
  sourceId: 12330001,
  expectedQuestionText: "In a rate of reaction diagram, which of the curves represents the evolution of oxygen with time in the equation 2KClO3(s) → 2KCl(s) + 3O2(g)?",
  expectedOptionsJson: '["Curve starting at origin and plateauing at the top","Curve starting high and sloping down to plateau near zero","A straight diagonal line passing through the origin","A horizontal line parallel to the time axis"]',
  expectedAnswerIndex: 0,
  expectedExplanation: "Even without seeing the specific image, understand the principle of a product curve. Oxygen is a product. At time zero, no reaction has happened, so the volume of oxygen is 0 (it starts at the origin). As the reaction proceeds quickly, the curve rises steeply. As the reactant (KClO3) gets used up, the rate slows down, causing the curve to level off and eventually become a flat plateau when the reaction stops.",
  expectedDiagramUrl: null,
  replacementQuestionText: "In the diagram above, which of the curves represents the evolution of oxygen with time in the equation 2KClO3(s) → 2KCl(s) + 3O2(g)?",
  replacementOptionsJson: '["X","Y","Z","R"]',
  replacementAnswerIndex: 3,
  replacementExplanation: "Curve R begins at the origin, rises as oxygen is evolved, and levels off as potassium chlorate is used up.",
  replacementDiagramUrl: "/manus-storage/chemistry-kclo3-schoolngr-original_4374f259.png",
};
const immutableFields = ["topic", "sourceId"];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, ${immutableFields.join(", ")}, questionText, optionsJson, answerIndex, explanation, diagramUrl, explanationStatus
     FROM questionItems WHERE externalId = ? LIMIT 1`,
    [target.externalId],
  );
  const row = rows[0];
  const receipt = { externalId: target.externalId, repaired: false, alreadyRepaired: false, skipped: false, reason: null };
  const immutableMatch = row
    && row.topic === target.topic
    && Number(row.sourceId) === target.sourceId
    && row.explanationStatus === "approved";

  if (!immutableMatch) {
    receipt.skipped = true;
    receipt.reason = "protected topic, source, or approval mismatch";
  } else if (
    row.questionText === target.replacementQuestionText
    && row.optionsJson === target.replacementOptionsJson
    && Number(row.answerIndex) === target.replacementAnswerIndex
    && row.explanation === target.replacementExplanation
    && row.diagramUrl === target.replacementDiagramUrl
  ) {
    receipt.alreadyRepaired = true;
    receipt.reason = "already repaired to the clean exact JAMB 2009 graph and source-proven response data";
  } else if (
    row.questionText !== target.expectedQuestionText
    || row.optionsJson !== target.expectedOptionsJson
    || Number(row.answerIndex) !== target.expectedAnswerIndex
    || row.explanation !== target.expectedExplanation
    || row.diagramUrl !== target.expectedDiagramUrl
  ) {
    receipt.skipped = true;
    receipt.reason = "unexpected current source-proven fields";
  } else {
    const immutableSnapshot = Object.fromEntries(immutableFields.map((field) => [field, row[field]]));
    const [result] = await connection.execute(
      `UPDATE questionItems
       SET questionText = ?, optionsJson = ?, answerIndex = ?, explanation = ?, diagramUrl = ?
       WHERE id = ? AND externalId = ? AND questionText = ? AND optionsJson = ? AND answerIndex = ? AND explanation = ? AND diagramUrl IS NULL AND explanationStatus = 'approved'`,
      [
        target.replacementQuestionText,
        target.replacementOptionsJson,
        target.replacementAnswerIndex,
        target.replacementExplanation,
        target.replacementDiagramUrl,
        row.id,
        target.externalId,
        target.expectedQuestionText,
        target.expectedOptionsJson,
        target.expectedAnswerIndex,
        target.expectedExplanation,
      ],
    );
    if (result.affectedRows !== 1) {
      receipt.skipped = true;
      receipt.reason = "guarded source-proven update did not apply";
    } else {
      const [afterRows] = await connection.execute(
        `SELECT ${immutableFields.join(", ")}, questionText, optionsJson, answerIndex, explanation, diagramUrl, explanationStatus
         FROM questionItems WHERE id = ? LIMIT 1`,
        [row.id],
      );
      const after = afterRows[0];
      const immutableUnchanged = immutableFields.every((field) => after[field] === immutableSnapshot[field]);
      const repairedValuesMatch = after.questionText === target.replacementQuestionText
        && after.optionsJson === target.replacementOptionsJson
        && Number(after.answerIndex) === target.replacementAnswerIndex
        && after.explanation === target.replacementExplanation
        && after.diagramUrl === target.replacementDiagramUrl
        && after.explanationStatus === "approved";
      if (!immutableUnchanged || !repairedValuesMatch) {
        throw new Error(`post-update source-evidence verification failed for ${target.externalId}`);
      }
      receipt.repaired = true;
      receipt.reason = "exact SchoolNGR JAMB 2009 source provides the clean X/Y/Z/R graph and keys R as option D; MySchool independently matches the prompt, option order, and key but its watermarked visual was not used";
    }
  }

  await fs.writeFile(
    reportPath,
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      scope: "Guarded source-proven repair of a held Chemistry graph record. It changes only the exact-source-proven question text, options, answer index, explanation, and clean original diagram mapping; topic, authorised source relationship, and approved status are verified unchanged.",
      target,
      receipt,
    }, null, 2)}\n`,
  );
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
