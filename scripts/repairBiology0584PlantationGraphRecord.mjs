import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "repaired_biology_0584_plantation_graph_20260826.json");
const target = {
  externalId: "biology_0584",
  questionText: "Use the diagram above to answer this question. Which of the following is a true feature of plantation II?",
  optionsJson: '["it has the highest number of trees of about 2m high","it has highest number of trees","it has the highest number of tall trees","the height of all its trees range between 2m and 6m"]',
  currentAnswerIndex: 1,
  currentExplanation: "This is a diagram-reading question about comparing populations across plantations. Plantation II has the greatest total number of trees, so the correct statement concerns overall population size rather than the number of trees at one particular height.",
  replacementAnswerIndex: 0,
  replacementExplanation: "The plantation II curve peaks at about 2 m and has the highest number of trees at that height. It does not have the highest total number of trees, so with the supplied option order the correct answer is option A.",
  topic: "Natural habitats",
  sourceId: 22500001,
  expectedCurrentDiagramUrl: null,
  replacementDiagramUrl: "/manus-storage/biology-0583-testdriller-original_99e7eb08.png",
};
const immutableFields = ["questionText", "optionsJson", "topic", "sourceId", "explanationStatus"];
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, questionText, optionsJson, answerIndex, explanation, topic, sourceId, diagramUrl, explanationStatus FROM questionItems WHERE externalId = ? LIMIT 1`, [target.externalId]);
  const row = rows[0];
  const receipt = { externalId: target.externalId, repaired: false, alreadyRepaired: false, skipped: false, before: null, after: null, reason: null };
  const currentMatches = row && row.questionText === target.questionText && row.optionsJson === target.optionsJson && Number(row.answerIndex) === target.currentAnswerIndex && row.explanation === target.currentExplanation && row.topic === target.topic && Number(row.sourceId) === target.sourceId && row.diagramUrl === target.expectedCurrentDiagramUrl && row.explanationStatus === "approved";
  const alreadyRepaired = row && row.questionText === target.questionText && row.optionsJson === target.optionsJson && Number(row.answerIndex) === target.replacementAnswerIndex && row.explanation === target.replacementExplanation && row.topic === target.topic && Number(row.sourceId) === target.sourceId && row.diagramUrl === target.replacementDiagramUrl && row.explanationStatus === "approved";
  if (alreadyRepaired) { receipt.alreadyRepaired = true; receipt.reason = "already repaired with the byte-identical verified exact original and independently corroborated A/2m-high key"; }
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
      receipt.reason = "TestDriller question 43 embeds a byte-identical copy of the clean exact graph already inspected and mapped for JAMB 2010 question 42; TestDriller and MySchool independently match the protected prompt, option order, and A/highest-number-at-about-2m key, so the source-proven answer/explanation correction and mapping are released together";
    }
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), scope: "Guarded figure-and-key repair. Only answerIndex, explanation, and diagramUrl may change; question text, option order, topic, source relationship, and approval status remain protected.", target, receipt }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally { await connection.end(); }
