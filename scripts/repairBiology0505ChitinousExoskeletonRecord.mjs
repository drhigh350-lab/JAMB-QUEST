import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "repaired_biology_0505_chitinous_exoskeleton_20260826.json");
const target = {
  externalId: "biology_0505",
  questionText: "Use the diagram above to answer this question. Which of the organisms is characterised by the possession of a chitinous exoskeleton?",
  optionsJson: '["I","II","III","IV"]',
  currentAnswerIndex: 2,
  currentExplanation: "A chitinous exoskeleton is a defining feature of arthropods. The organism labelled III in the referenced diagram belongs to this group, so it is the correct choice.",
  replacementAnswerIndex: 0,
  replacementExplanation: "A chitinous exoskeleton is a defining feature of arthropods. In the exact figure, organism I is the arthropod; with the supplied option order, the correct answer is option A.",
  topic: "Theories of evolution",
  sourceId: 22500001,
  expectedCurrentDiagramUrl: null,
  replacementDiagramUrl: "/manus-storage/biology-0502-testdriller-original_eea7904a.png",
};
const immutableFields = ["questionText", "optionsJson", "topic", "sourceId", "explanationStatus"];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, questionText, optionsJson, answerIndex, explanation, topic, sourceId, diagramUrl, explanationStatus FROM questionItems WHERE externalId = ? LIMIT 1`, [target.externalId]);
  const row = rows[0];
  const receipt = { externalId: target.externalId, repaired: false, alreadyRepaired: false, skipped: false, before: null, after: null, reason: null };
  const currentMatches = row && row.questionText === target.questionText && row.optionsJson === target.optionsJson && Number(row.answerIndex) === target.currentAnswerIndex && row.explanation === target.currentExplanation && row.topic === target.topic && Number(row.sourceId) === target.sourceId && row.diagramUrl === target.expectedCurrentDiagramUrl && row.explanationStatus === "approved";
  const alreadyRepaired = row && row.questionText === target.questionText && row.optionsJson === target.optionsJson && Number(row.answerIndex) === target.replacementAnswerIndex && row.explanation === target.replacementExplanation && row.topic === target.topic && Number(row.sourceId) === target.sourceId && row.diagramUrl === target.replacementDiagramUrl && row.explanationStatus === "approved";
  if (alreadyRepaired) {
    receipt.alreadyRepaired = true;
    receipt.reason = "already repaired with the verified byte-identical clean TestDriller JAMB 2008 organism panel and independently corroborated A/I key";
  } else if (!currentMatches) {
    receipt.skipped = true;
    receipt.reason = "protected current state mismatch";
  } else {
    const before = Object.fromEntries([...immutableFields, "answerIndex", "explanation", "diagramUrl"].map((field) => [field, row[field]]));
    const [result] = await connection.execute("UPDATE questionItems SET answerIndex = ?, explanation = ?, diagramUrl = ? WHERE id = ? AND externalId = ? AND answerIndex = ? AND explanation = ? AND diagramUrl IS NULL AND explanationStatus = 'approved'", [target.replacementAnswerIndex, target.replacementExplanation, target.replacementDiagramUrl, row.id, target.externalId, target.currentAnswerIndex, target.currentExplanation]);
    if (result.affectedRows !== 1) {
      receipt.skipped = true;
      receipt.reason = "guarded repair update did not apply";
    } else {
      const [afterRows] = await connection.execute(`SELECT ${[...immutableFields, "answerIndex", "explanation", "diagramUrl"].join(", ")} FROM questionItems WHERE id = ? LIMIT 1`, [row.id]);
      const after = afterRows[0];
      if (!immutableFields.every((field) => after[field] === before[field]) || Number(after.answerIndex) !== target.replacementAnswerIndex || after.explanation !== target.replacementExplanation || after.diagramUrl !== target.replacementDiagramUrl) throw new Error(`post-update verification failed for ${target.externalId}`);
      receipt.repaired = true;
      receipt.before = before;
      receipt.after = after;
      receipt.reason = "TestDriller JAMB 2008 question 4 provides a clean complete native I–IV organism panel whose bytes are SHA-256-identical to the clean TestDriller JAMB 2008 question 5 asset. TestDriller, MySchool, and SchoolNGR match the protected prompt, I/II/III/IV option order, and A/I answer, so the source-proven key/explanation correction and mapping are released together.";
    }
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), scope: "Guarded figure-and-key repair. Only answerIndex, explanation, and diagramUrl may change; question text, option order, topic, source relationship, and approval status remain protected.", target, receipt }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
