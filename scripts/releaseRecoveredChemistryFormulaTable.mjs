import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "recovered_chemistry_formula_table_release_20260825.json");
const target = {
  externalId: "OWNER-CHEM-DIAGRAM-2026-009",
  expectedCurrentDiagramUrl: "/manus-storage/owner-chem-diagram-2026-009_837e85f8.png",
  replacementDiagramUrl: "/manus-storage/owner-chem-diagram-2026-009-source-table_b66e3aaa.png",
  stem: "In the formula table, the two compounds that combine in the presence of an acid catalyst to produce compound V are",
};

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    "SELECT id, questionText, diagramUrl, explanationStatus FROM questionItems WHERE externalId = ? LIMIT 1",
    [target.externalId],
  );
  const row = rows[0];
  const receipt = { externalId: target.externalId, released: false, skipped: false, reason: null };
  if (!row || row.questionText !== target.stem) {
    receipt.skipped = true;
    receipt.reason = "protected source mismatch";
  } else if (row.diagramUrl === target.replacementDiagramUrl && row.explanationStatus === "approved") {
    receipt.skipped = true;
    receipt.reason = "already released";
  } else if (row.diagramUrl !== target.expectedCurrentDiagramUrl || row.explanationStatus !== "needs_review") {
    receipt.skipped = true;
    receipt.reason = "unexpected current mapping or status";
  } else {
    const [result] = await connection.execute(
      "UPDATE questionItems SET diagramUrl = ?, explanationStatus = 'approved' WHERE id = ? AND externalId = ? AND diagramUrl = ? AND explanationStatus = 'needs_review'",
      [target.replacementDiagramUrl, row.id, target.externalId, target.expectedCurrentDiagramUrl],
    );
    receipt.released = result.affectedRows === 1;
    receipt.reason = receipt.released ? "verified original formula table recovered and mapped" : "guarded update did not apply";
  }
  const report = { generatedAt: new Date().toISOString(), scope: "Mapping/status-only release. Question text, options, answer index, topic, explanation, and source fields are preserved.", target, receipt };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} finally {
  await connection.end();
}
