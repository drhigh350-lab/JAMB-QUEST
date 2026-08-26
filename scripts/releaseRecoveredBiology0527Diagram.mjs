import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "released_biology_0527_thermoregulation_graph_20260826.json");
const target = {
  externalId: "biology_0527",
  questionText: "Use the diagram above to answer this question. From the graph above, it can be appropriately deduced that",
  optionsJson: '["the body temperature in II varies with that in I","the body temperature in I is independent of external temperature","I and II maintain constant body temperature","external temperatures affect the body temperature of I and II"]',
  answerIndex: 1,
  explanation: "The graph demonstrates the difference between an animal that maintains a relatively constant internal temperature and one whose body temperature changes with the environment. The body temperature represented by I remains relatively constant despite changes in external temperature, showing homeothermic regulation.",
  topic: "Support and movement",
  sourceId: 22500001,
  expectedCurrentDiagramUrl: null,
  replacementDiagramUrl: "/manus-storage/biology-0527-testdriller-original_8ece4a3c.png",
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
    receipt.reason = "already mapped to the verified clean exact TestDriller JAMB 2008 thermoregulation graph";
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
      receipt.reason = "TestDriller JAMB 2008 question 46 provides a clean complete native graph with legible I/II lines and axes. TestDriller, MySchool, and SchoolNGR match the protected prompt, option order, and B/I-independent key, so the exact original is mapped without changing learner content.";
    }
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), scope: "Guarded mapping-only release. Question text, options, answer index, explanation, topic, source relationship, and approval status must remain unchanged.", target, receipt }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
