import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "released_biology_1041_frog_water_loss_20260826.json");
const target = {
  externalId: "biology_1041",
  questionText: "Use the diagram to answer the question. The process of water loss and intake indicated by the arrows labelled I and II are respectively",
  optionsJson: '["Evaporation and osmosis","Osmosis and exhalation","Osmosis and diffusion","Urination and diffusion"]',
  answerIndex: 0,
  explanation: "The diagram represents water leaving the body by evaporation and entering through osmosis. Osmosis specifically concerns movement of water across a selectively permeable membrane, while evaporation is water loss as vapour.",
  topic: "Transport",
  sourceId: 22500002,
  expectedCurrentDiagramUrl: null,
  replacementDiagramUrl: "/manus-storage/biology-1041-testdriller-original_f360a5e8.png",
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
    receipt.reason = "already mapped to the verified clean repeated-original TestDriller frog water-loss and intake figure";
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
      receipt.reason = "TestDriller JAMB 2003 question 6 supplies the clean original repeated frog-water visual with intact I/II arrows and water context. The supported JAMB 2020 MySchool and SchoolNGR pages independently match the protected prompt, option order, and A/evaporation-and-osmosis key, while their served visual variants are residue-bearing. This release maps only the clean visual and preserves all protected learner content.";
    }
  }
  await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), scope: "Guarded mapping-only release. Question text, options, answer index, explanation, topic, source relationship, and approval status must remain unchanged.", target, receipt }, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
