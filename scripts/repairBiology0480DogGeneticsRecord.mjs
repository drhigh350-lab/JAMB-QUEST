import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "repaired_biology_0480_dog_genetics_20260826.json");
const target = {
  externalId: "biology_0480",
  currentQuestionText: "Use the diagram above to answer this question. If the dogs are offspring of a monohybird cross and the gene G for grey head is dominant cross over its allele g, the individual whose genotype is likely to be gg is",
  currentOptionsJson: '["ll","l","IV","lll"]',
  currentAnswerIndex: 3,
  currentExplanation: "In a monohybrid cross, the homozygous recessive genotype (gg) would show the recessive phenotype. The individual with the recessive trait (likely a different colour) would be the one with genotype gg. Based on the diagram, III likely represents the individual showing the recessive trait.",
  replacementQuestionText: "Use the diagram above to answer this question. If the dogs are offspring of a monohybrid cross and the gene G for grey head is dominant over its allele g, the individual whose genotype is likely to be gg is",
  replacementOptionsJson: '["II","I","IV","III"]',
  replacementAnswerIndex: 2,
  replacementExplanation: "The recessive genotype gg is expressed by the non-grey-headed dog. In the exact figure, dog IV has that recessive phenotype; with the supplied option order II, I, IV, III, the correct answer is option C.",
  topic: "Heredity",
  sourceId: 22500001,
  expectedCurrentDiagramUrl: null,
  replacementDiagramUrl: "/manus-storage/biology-0480-testdriller-original_4eb6cef1.png",
};
const immutableFields = ["topic", "sourceId", "explanationStatus"];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, questionText, optionsJson, answerIndex, explanation, topic, sourceId, diagramUrl, explanationStatus FROM questionItems WHERE externalId = ? LIMIT 1`, [target.externalId]);
  const row = rows[0];
  const receipt = { externalId: target.externalId, repaired: false, alreadyRepaired: false, skipped: false, before: null, after: null, reason: null };
  const immutableMatches = row && row.topic === target.topic && Number(row.sourceId) === target.sourceId && row.explanationStatus === "approved";
  const currentMatches = immutableMatches && row.questionText === target.currentQuestionText && row.optionsJson === target.currentOptionsJson && Number(row.answerIndex) === target.currentAnswerIndex && row.explanation === target.currentExplanation && row.diagramUrl === target.expectedCurrentDiagramUrl;
  const alreadyRepaired = immutableMatches && row.questionText === target.replacementQuestionText && row.optionsJson === target.replacementOptionsJson && Number(row.answerIndex) === target.replacementAnswerIndex && row.explanation === target.replacementExplanation && row.diagramUrl === target.replacementDiagramUrl;
  if (alreadyRepaired) {
    receipt.alreadyRepaired = true;
    receipt.reason = "already repaired with the verified clean exact TestDriller JAMB 2007 dog-genetics original and independently corroborated C/IV key";
  } else if (!currentMatches) {
    receipt.skipped = true;
    receipt.reason = "protected current state mismatch";
  } else {
    const before = Object.fromEntries(["questionText", "optionsJson", ...immutableFields, "answerIndex", "explanation", "diagramUrl"].map((field) => [field, row[field]]));
    const [result] = await connection.execute("UPDATE questionItems SET questionText = ?, optionsJson = ?, answerIndex = ?, explanation = ?, diagramUrl = ? WHERE id = ? AND externalId = ? AND questionText = ? AND optionsJson = ? AND answerIndex = ? AND explanation = ? AND diagramUrl IS NULL AND explanationStatus = 'approved'", [target.replacementQuestionText, target.replacementOptionsJson, target.replacementAnswerIndex, target.replacementExplanation, target.replacementDiagramUrl, row.id, target.externalId, target.currentQuestionText, target.currentOptionsJson, target.currentAnswerIndex, target.currentExplanation]);
    if (result.affectedRows !== 1) {
      receipt.skipped = true;
      receipt.reason = "guarded repair update did not apply";
    } else {
      const [afterRows] = await connection.execute(`SELECT questionText, optionsJson, ${[...immutableFields, "answerIndex", "explanation", "diagramUrl"].join(", ")} FROM questionItems WHERE id = ? LIMIT 1`, [row.id]);
      const after = afterRows[0];
      if (!immutableFields.every((field) => after[field] === before[field]) || after.questionText !== target.replacementQuestionText || after.optionsJson !== target.replacementOptionsJson || Number(after.answerIndex) !== target.replacementAnswerIndex || after.explanation !== target.replacementExplanation || after.diagramUrl !== target.replacementDiagramUrl) throw new Error(`post-update verification failed for ${target.externalId}`);
      receipt.repaired = true;
      receipt.before = before;
      receipt.after = after;
      receipt.reason = "TestDriller JAMB 2007 question 47 provides a clean complete native I–IV dog-panel original and exact corrected wording/options. TestDriller, MySchool, and SchoolNGR match the source wording, II/I/IV/III option order, and C/IV answer, so the source-proven prompt formatting, option labels, answer/explanation, and mapping are repaired together while topic, source relationship, and approval status remain protected.";
    }
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), scope: "Guarded source-proven content repair. Only exact-source question wording, option labels, answerIndex, explanation, and diagramUrl may change; topic, source relationship, and approval status remain protected.", target, receipt }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
