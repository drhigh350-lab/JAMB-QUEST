import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "repaired_biology_0583_plantation_graph_20260826.json");
const target = {
  externalId: "biology_0583",
  questionText: "Use the diagram above to answer this question. In which plantation are all the trees between the height of 2-4m?",
  optionsJson: '["III","II","I","IV"]',
  currentAnswerIndex: 2,
  currentExplanation: "This question requires reading the height distribution shown in the plantation diagram. Plantation I is the one whose represented trees all fall within the 2–4 m height interval; the key is to compare the entire range of tree heights rather than the tallest or most numerous trees.",
  replacementAnswerIndex: 0,
  replacementExplanation: "All trees in plantation III lie between 2 m and 4 m on the graph. The other plantations include trees outside that interval, so III is correct; with the supplied option order, that is option A.",
  topic: "Natural habitats",
  sourceId: 22500001,
  expectedCurrentDiagramUrl: null,
  replacementDiagramUrl: "/manus-storage/biology-0583-testdriller-original_99e7eb08.png",
};
const immutableFields = ["questionText", "optionsJson", "topic", "sourceId", "explanationStatus"];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, questionText, optionsJson, answerIndex, explanation, topic, sourceId, diagramUrl, explanationStatus FROM questionItems WHERE externalId = ? LIMIT 1`,
    [target.externalId],
  );
  const row = rows[0];
  const receipt = { externalId: target.externalId, repaired: false, alreadyRepaired: false, skipped: false, before: null, after: null, reason: null };
  const protectedSourceMatches = row
    && row.questionText === target.questionText
    && row.optionsJson === target.optionsJson
    && Number(row.answerIndex) === target.currentAnswerIndex
    && row.explanation === target.currentExplanation
    && row.topic === target.topic
    && Number(row.sourceId) === target.sourceId
    && row.diagramUrl === target.expectedCurrentDiagramUrl
    && row.explanationStatus === "approved";
  const alreadyRepaired = row
    && row.questionText === target.questionText
    && row.optionsJson === target.optionsJson
    && Number(row.answerIndex) === target.replacementAnswerIndex
    && row.explanation === target.replacementExplanation
    && row.topic === target.topic
    && Number(row.sourceId) === target.sourceId
    && row.diagramUrl === target.replacementDiagramUrl
    && row.explanationStatus === "approved";

  if (alreadyRepaired) {
    receipt.alreadyRepaired = true;
    receipt.reason = "already repaired with the verified exact TestDriller original and independently corroborated A/III key";
  } else if (!protectedSourceMatches) {
    receipt.skipped = true;
    receipt.reason = "protected current state mismatch";
  } else {
    const before = Object.fromEntries([...immutableFields, "answerIndex", "explanation", "diagramUrl"].map((field) => [field, row[field]]));
    const [result] = await connection.execute(
      "UPDATE questionItems SET answerIndex = ?, explanation = ?, diagramUrl = ? WHERE id = ? AND externalId = ? AND answerIndex = ? AND explanation = ? AND diagramUrl IS NULL AND explanationStatus = 'approved'",
      [target.replacementAnswerIndex, target.replacementExplanation, target.replacementDiagramUrl, row.id, target.externalId, target.currentAnswerIndex, target.currentExplanation],
    );
    if (result.affectedRows !== 1) {
      receipt.skipped = true;
      receipt.reason = "guarded repair update did not apply";
    } else {
      const [afterRows] = await connection.execute(
        `SELECT ${[...immutableFields, "answerIndex", "explanation", "diagramUrl"].join(", ")} FROM questionItems WHERE id = ? LIMIT 1`,
        [row.id],
      );
      const after = afterRows[0];
      const immutableUnchanged = immutableFields.every((field) => after[field] === before[field]);
      const repairApplied = Number(after.answerIndex) === target.replacementAnswerIndex && after.explanation === target.replacementExplanation && after.diagramUrl === target.replacementDiagramUrl;
      if (!immutableUnchanged || !repairApplied) throw new Error(`post-update verification failed for ${target.externalId}`);
      receipt.repaired = true;
      receipt.before = before;
      receipt.after = after;
      receipt.reason = "clean exact TestDriller graph confirms the complete I–IV height distributions; TestDriller and SchoolNGR independently match the prompt, option order, and A/III key, so the source-proven answer/explanation correction and diagram mapping are released together";
    }
  }
  await fs.writeFile(reportPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    scope: "Guarded figure-and-key repair. Only answerIndex, explanation, and diagramUrl may change after exact source confirmation; question text, option order, topic, source relationship, and approval status remain protected.",
    target,
    receipt,
  }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
