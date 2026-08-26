import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "recovered_biology_0574_diagram_release_20260826.json");
const target = {
  externalId: "biology_0574",
  questionText: "Use the diagram above to answer this question. With respect to their decreasing dependence on aquatic conditions for reproduction, which of the following is the correct arrangement of the animals represented?",
  optionsJson: '["I, IV, II and III","IV, III, II and I","I, II, IV and III","III, II, IV and I"]',
  answerIndex: 1,
  topic: "Reproduction",
  sourceId: 22500001,
  expectedCurrentDiagramUrl: null,
  replacementDiagramUrl: "/manus-storage/biology-0574-testdriller-original_23e441c0.png",
};
const protectedFields = ["questionText", "optionsJson", "answerIndex", "topic", "explanation", "sourceId", "explanationStatus"];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`SELECT id, externalId, ${protectedFields.join(", ")}, diagramUrl FROM questionItems WHERE externalId = ? LIMIT 1`, [target.externalId]);
  const row = rows[0];
  const receipt = { externalId: target.externalId, released: false, alreadyReleased: false, skipped: false, reason: null };
  const protectedMatches = row && row.questionText === target.questionText && row.optionsJson === target.optionsJson && Number(row.answerIndex) === target.answerIndex && row.topic === target.topic && Number(row.sourceId) === target.sourceId && row.explanationStatus === "approved";
  if (!protectedMatches) {
    receipt.skipped = true;
    receipt.reason = "protected source or approved-status mismatch";
  } else if (row.diagramUrl === target.replacementDiagramUrl) {
    receipt.alreadyReleased = true;
    receipt.reason = "already mapped to the verified clean TestDriller original four-animal panel";
  } else if (row.diagramUrl !== target.expectedCurrentDiagramUrl) {
    receipt.skipped = true;
    receipt.reason = "unexpected current diagram mapping";
  } else {
    const before = Object.fromEntries(protectedFields.map((field) => [field, row[field]]));
    const [result] = await connection.execute("UPDATE questionItems SET diagramUrl = ? WHERE id = ? AND externalId = ? AND diagramUrl IS NULL AND explanationStatus = 'approved'", [target.replacementDiagramUrl, row.id, target.externalId]);
    if (result.affectedRows !== 1) {
      receipt.skipped = true;
      receipt.reason = "guarded mapping update did not apply";
    } else {
      const [afterRows] = await connection.execute(`SELECT ${protectedFields.join(", ")}, diagramUrl FROM questionItems WHERE id = ? LIMIT 1`, [row.id]);
      const after = afterRows[0];
      if (!protectedFields.every((field) => after[field] === before[field]) || after.diagramUrl !== target.replacementDiagramUrl) throw new Error(`post-update protected-field verification failed for ${target.externalId}`);
      receipt.released = true;
      receipt.reason = "clean exact TestDriller panel retains all four I–IV animals and grid boundaries with no source residue, answer marker, option text, correction, or watermark; the existing B/IV, III, II and I key is independently source-matching and remains unchanged";
    }
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), scope: "Guarded mapping-only release. Question text, options, answer index, topic, explanation, source relationship, and approval status remain unchanged.", target, receipt }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
