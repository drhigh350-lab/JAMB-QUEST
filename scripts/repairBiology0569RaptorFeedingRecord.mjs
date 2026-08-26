import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "repaired_biology_0569_raptor_feeding_20260826.json");
const target = {
  externalId: "biology_0569",
  questionText: "Use the diagram above to answer this question based on the shape and structure of the beak and feet, the bird represented is likely to feed mainly on?",
  optionsJson: '["flesh","fruits","seeds","nectar"]',
  currentAnswerIndex: 2,
  currentExplanation: "The question tests the relationship between an animal's structure and its mode of feeding. The referenced bird diagram is associated with adaptations for feeding on seeds, where a strong, suitable beak can crack or crush hard seed coverings.",
  replacementAnswerIndex: 0,
  replacementExplanation: "The hooked beak and strong grasping talons identify a raptor adapted for catching prey and tearing flesh. With the supplied option order, flesh is option A.",
  topic: "Nutrition and digestion",
  sourceId: 22500001,
  expectedCurrentDiagramUrl: null,
  replacementDiagramUrl: "/manus-storage/biology-0569-testdriller-original_ec8a36e9.png",
};
const immutableFields = ["questionText", "optionsJson", "topic", "sourceId", "explanationStatus"];
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, questionText, optionsJson, answerIndex, explanation, topic, sourceId, diagramUrl, explanationStatus FROM questionItems WHERE externalId = ? LIMIT 1`, [target.externalId]);
  const row = rows[0];
  const receipt = { externalId: target.externalId, repaired: false, alreadyRepaired: false, skipped: false, before: null, after: null, reason: null };
  const currentMatches = row && row.questionText === target.questionText && row.optionsJson === target.optionsJson && Number(row.answerIndex) === target.currentAnswerIndex && row.explanation === target.currentExplanation && row.topic === target.topic && Number(row.sourceId) === target.sourceId && row.diagramUrl === target.expectedCurrentDiagramUrl && row.explanationStatus === "approved";
  const alreadyRepaired = row && row.questionText === target.questionText && row.optionsJson === target.optionsJson && Number(row.answerIndex) === target.replacementAnswerIndex && row.explanation === target.replacementExplanation && row.topic === target.topic && Number(row.sourceId) === target.sourceId && row.diagramUrl === target.replacementDiagramUrl && row.explanationStatus === "approved";
  if (alreadyRepaired) { receipt.alreadyRepaired = true; receipt.reason = "already repaired with verified exact original and independently corroborated A/flesh key"; }
  else if (!currentMatches) { receipt.skipped = true; receipt.reason = "protected current state mismatch"; }
  else {
    const before = Object.fromEntries([...immutableFields, "answerIndex", "explanation", "diagramUrl"].map((field) => [field, row[field]]));
    const [result] = await connection.execute("UPDATE questionItems SET answerIndex = ?, explanation = ?, diagramUrl = ? WHERE id = ? AND externalId = ? AND answerIndex = ? AND explanation = ? AND diagramUrl IS NULL AND explanationStatus = 'approved'", [target.replacementAnswerIndex, target.replacementExplanation, target.replacementDiagramUrl, row.id, target.externalId, target.currentAnswerIndex, target.currentExplanation]);
    if (result.affectedRows !== 1) { receipt.skipped = true; receipt.reason = "guarded repair update did not apply"; }
    else {
      const [afterRows] = await connection.execute(`SELECT ${[...immutableFields, "answerIndex", "explanation", "diagramUrl"].join(", ")} FROM questionItems WHERE id = ? LIMIT 1`, [row.id]);
      const after = afterRows[0];
      if (!immutableFields.every((field) => after[field] === before[field]) || Number(after.answerIndex) !== target.replacementAnswerIndex || after.explanation !== target.replacementExplanation || after.diagramUrl !== target.replacementDiagramUrl) throw new Error(`post-update verification failed for ${target.externalId}`);
      receipt.repaired = true; receipt.before = before; receipt.after = after;
      receipt.reason = "clean exact TestDriller raptor figure shows hooked beak and grasping talons; TestDriller plus the previously verified MySchool and SchoolNGR sources match the protected prompt, option order, and A/flesh key, so the source-proven answer/explanation correction and diagram mapping are released together";
    }
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), scope: "Guarded figure-and-key repair. Only answerIndex, explanation, and diagramUrl may change; question text, option order, topic, source relationship, and approval status remain protected.", target, receipt }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally { await connection.end(); }
