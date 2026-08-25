import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "repaired_biology_0402_source_diagram_20260825.json");
const target = {
  externalId: "biology_0402",
  questionText: "From the diagram above the structure labelled I originates from the",
  optionsJson: '["liver","kidney","small intestine","stomach"]',
  topic: "Plant and mammal structure",
  sourceId: 22500001,
  expectedAnswerIndex: 3,
  replacementAnswerIndex: 1,
  expectedDiagramUrl: null,
  replacementDiagramUrl: "/manus-storage/biology-0402-schoolngr-source-panel_2f306451.png",
  replacementExplanation: "The labelled structure is the ureter. It carries urine from the kidney to the urinary bladder, so it originates from the kidney.",
};
const immutableFields = ["questionText", "optionsJson", "topic", "sourceId"];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, ${immutableFields.join(", ")}, answerIndex, explanation, diagramUrl, explanationStatus FROM questionItems WHERE externalId = ? LIMIT 1`, [target.externalId]);
  const row = rows[0];
  const receipt = { externalId: target.externalId, repaired: false, alreadyRepaired: false, skipped: false, reason: null };
  const immutableMatch = row && row.questionText === target.questionText && row.optionsJson === target.optionsJson && row.topic === target.topic && Number(row.sourceId) === target.sourceId && row.explanationStatus === "approved";
  if (!immutableMatch) { receipt.skipped = true; receipt.reason = "protected question or source mismatch"; }
  else if (Number(row.answerIndex) === target.replacementAnswerIndex && row.explanation === target.replacementExplanation && row.diagramUrl === target.replacementDiagramUrl) { receipt.alreadyRepaired = true; receipt.reason = "already repaired to exact public-source diagram and response data"; }
  else if (Number(row.answerIndex) !== target.expectedAnswerIndex || row.diagramUrl !== target.expectedDiagramUrl) { receipt.skipped = true; receipt.reason = "unexpected current source-proven fields"; }
  else {
    const immutableSnapshot = Object.fromEntries(immutableFields.map((field) => [field, row[field]]));
    const [result] = await connection.execute("UPDATE questionItems SET answerIndex = ?, explanation = ?, diagramUrl = ? WHERE id = ? AND externalId = ? AND answerIndex = ? AND diagramUrl IS NULL AND explanationStatus = 'approved'", [target.replacementAnswerIndex, target.replacementExplanation, target.replacementDiagramUrl, row.id, target.externalId, target.expectedAnswerIndex]);
    if (result.affectedRows !== 1) { receipt.skipped = true; receipt.reason = "guarded source-proven update did not apply"; }
    else {
      const [afterRows] = await connection.execute(`SELECT ${immutableFields.join(", ")}, answerIndex, explanation, diagramUrl, explanationStatus FROM questionItems WHERE id = ? LIMIT 1`, [row.id]);
      const after = afterRows[0];
      const immutableUnchanged = immutableFields.every((field) => after[field] === immutableSnapshot[field]);
      const repairedValuesMatch = Number(after.answerIndex) === target.replacementAnswerIndex && after.explanation === target.replacementExplanation && after.diagramUrl === target.replacementDiagramUrl && after.explanationStatus === "approved";
      if (!immutableUnchanged || !repairedValuesMatch) throw new Error(`post-update source-evidence verification failed for ${target.externalId}`);
      receipt.repaired = true; receipt.reason = "exact public-source urinary-system figure confirms the kidney key and source-backed explanation";
    }
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), scope: "Guarded source-proven repair. Only the exact-source-proven answer index, explanation, and diagram mapping may change; stem, options, topic, source relationship, and approved status are verified unchanged.", target, receipt }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally { await connection.end(); }
