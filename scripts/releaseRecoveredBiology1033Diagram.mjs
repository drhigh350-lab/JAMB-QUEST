import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "released_biology_1033_countershading_20260826.json");
const target = {
  externalId: "biology_1033",
  questionText: "Use the diagram to answer the question. The type of protective adaptation exhibited by the animal is",
  optionsJson: '["Disruptive colouration","Flash colouration","Countershading colouration","Warning colouration"]',
  answerIndex: 2,
  explanation: "Countershading involves a darker upper surface and lighter underside, reducing the animal's visibility by making its body blend with different light conditions above and below. It is a form of camouflage.",
  topic: "Adaptations of organisms",
  sourceId: 22500002,
  expectedCurrentDiagramUrl: null,
  replacementDiagramUrl: "/manus-storage/biology-1033-testdriller-original_425154e0.png",
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
    receipt.reason = "already mapped to the verified clean exact TestDriller JAMB 2007 countershading original";
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
      receipt.reason = "TestDriller JAMB 2007 question 11 provides a clean complete animal original. TestDriller, MySchool, and SchoolNGR match the protected prompt, option order, and C/countershading key, so the exact original is mapped without changing learner content.";
    }
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), scope: "Guarded mapping-only release. Question text, options, answer index, explanation, topic, source relationship, and approval status must remain unchanged.", target, receipt }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
