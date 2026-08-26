import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "recovered_biology_0536_diagram_release_20260826.json");
const target = {
  externalId: "biology_0536",
  questionText: "Use the diagram above to answer this question. The structure that controls loss of water vapour during transpiration is labelled",
  optionsJson: '["I","II","III","IV"]',
  answerIndex: 3,
  topic: "Transport",
  sourceId: 22500001,
  expectedCurrentDiagramUrl: null,
  replacementDiagramUrl: "/manus-storage/biology-0536-testdriller-original_a59c4d17.png",
};
const protectedFields = ["questionText", "optionsJson", "answerIndex", "topic", "explanation", "sourceId", "explanationStatus"];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, ${protectedFields.join(", ")}, diagramUrl FROM questionItems WHERE externalId = ? LIMIT 1`, [target.externalId]);
  const row = rows[0];
  const receipt = { externalId: target.externalId, released: false, alreadyReleased: false, skipped: false, before: null, after: null, reason: null };
  const protectedMatches = row && row.questionText === target.questionText && row.optionsJson === target.optionsJson && Number(row.answerIndex) === target.answerIndex && row.topic === target.topic && Number(row.sourceId) === target.sourceId && row.explanationStatus === "approved";
  if (!protectedMatches) {
    receipt.skipped = true;
    receipt.reason = "protected source, answer, or approved-status mismatch";
  } else if (row.diagramUrl === target.replacementDiagramUrl) {
    receipt.alreadyReleased = true;
    receipt.reason = "already mapped to the verified clean TestDriller JAMB 2009 leaf original";
  } else if (row.diagramUrl !== target.expectedCurrentDiagramUrl) {
    receipt.skipped = true;
    receipt.reason = "unexpected current diagram mapping";
  } else {
    const before = Object.fromEntries([...protectedFields, "diagramUrl"].map((field) => [field, row[field]]));
    const [result] = await connection.execute("UPDATE questionItems SET diagramUrl = ? WHERE id = ? AND externalId = ? AND diagramUrl IS NULL AND explanationStatus = 'approved'", [target.replacementDiagramUrl, row.id, target.externalId]);
    if (result.affectedRows !== 1) {
      receipt.skipped = true;
      receipt.reason = "guarded mapping update did not apply";
    } else {
      const [afterRows] = await connection.execute(`SELECT ${protectedFields.join(", ")}, diagramUrl FROM questionItems WHERE id = ? LIMIT 1`, [row.id]);
      const after = afterRows[0];
      if (!protectedFields.every((field) => after[field] === before[field]) || after.diagramUrl !== target.replacementDiagramUrl) throw new Error(`post-update protected-field verification failed for ${target.externalId}`);
      receipt.released = true;
      receipt.before = before;
      receipt.after = after;
      receipt.reason = "TestDriller JAMB 2009 question 13 supplies a clean complete native leaf-section original with neutral I–IV leaders and no answer marker, option text, correction, watermark, or source residue. TestDriller, MySchool, and SchoolNGR all match the protected prompt and IV key, so only the verified original mapping is released; all protected learner fields remain unchanged.";
    }
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), scope: "Guarded mapping-only release. Question text, options, answer index, topic, explanation, source relationship, and approval status remain unchanged.", target, receipt }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
