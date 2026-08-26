import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "released_biology_1111_f2_ratio_20260826.json");
const target = {
  externalId: "biology_1111",
  questionText: "Use the illustration above to answer the question that follows What is the genotypic ratio of the F2 generation?",
  optionsJson: '["2 :1 :1","3 : 1","1 : 1","1 : 2: 1"]',
  answerIndex: 3,
  explanation: "In a monohybrid cross of heterozygotes (Tt x Tt), the F2 genotypic ratio is 1 TT : 2 Tt : 1 tt. This is the classic 1:2:1 ratio. The phenotypic ratio would be 3:1.",
  topic: "Heredity",
  sourceId: 22500002,
  expectedCurrentDiagramUrl: null,
  replacementDiagramUrl: "/manus-storage/boundary-x0-520-y38-354_5d0f5769.png",
  explanationStatus: "approved",
};
const protectedFields = ["questionText", "optionsJson", "answerIndex", "explanation", "topic", "sourceId", "explanationStatus"];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, questionText, optionsJson, answerIndex, explanation, topic, sourceId, diagramUrl, explanationStatus FROM questionItems WHERE externalId = ? LIMIT 1`, [target.externalId]);
  const row = rows[0];
  const protectedMatches = row && protectedFields.every((field) => String(row[field]) === String(target[field]));
  const receipt = { externalId: target.externalId, released: false, alreadyReleased: false, skipped: false, before: null, after: null, reason: null };
  if (protectedMatches && row.diagramUrl === target.replacementDiagramUrl) {
    receipt.alreadyReleased = true;
    receipt.reason = "already mapped to the verified clean repeated-original JAMB 2025 F2 genetic-cross figure";
  } else if (!protectedMatches || row?.diagramUrl !== target.expectedCurrentDiagramUrl) {
    receipt.skipped = true;
    receipt.reason = "protected current state mismatch";
  } else {
    const before = Object.fromEntries([...protectedFields, "diagramUrl"].map((field) => [field, row[field]]));
    const [result] = await connection.execute("UPDATE questionItems SET diagramUrl = ? WHERE id = ? AND externalId = ? AND diagramUrl IS NULL AND explanationStatus = 'approved'", [target.replacementDiagramUrl, row.id, target.externalId]);
    if (result.affectedRows !== 1) {
      receipt.skipped = true;
      receipt.reason = "guarded mapping update did not apply";
    } else {
      const [afterRows] = await connection.execute(`SELECT ${[...protectedFields, "diagramUrl"].join(", ")} FROM questionItems WHERE id = ? LIMIT 1`, [row.id]);
      const after = afterRows[0];
      if (!protectedFields.every((field) => String(after[field]) === String(before[field])) || after.diagramUrl !== target.replacementDiagramUrl) throw new Error(`post-update verification failed for ${target.externalId}`);
      receipt.released = true;
      receipt.before = before;
      receipt.after = after;
      receipt.reason = "The exact JAMB 2025 MySchool page establishes the protected prompt, option order, and D/1:2:1 key. An independent public repeated visual has the same complete Rr/R/r/RR/rr genetic-cross geometry; a source-only boundary crop removes surrounding chat chrome, timestamp, and answer material without cutting figure geometry. The repeated original maps only the visual and preserves all protected learner content.";
    }
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), scope: "Guarded mapping-only release. Question text, options, answer index, explanation, topic, source relationship, and approval status must remain unchanged.", target, receipt }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
