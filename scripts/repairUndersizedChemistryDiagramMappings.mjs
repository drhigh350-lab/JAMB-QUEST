import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "undersized_chemistry_diagram_mapping_repair_20260825.json");

const removeRedundantMappings = [
  {
    externalId: "OWNER-CHEM-DIAGRAM-2026-005",
    diagramUrl: "/manus-storage/owner-chem-diagram-2026-005_c6d57589.png",
    stem: "The table shows formulae of some ions. In which compound is the formula not correct?",
  },
  {
    externalId: "OWNER-CHEM-DIAGRAM-2026-006",
    diagramUrl: "/manus-storage/owner-chem-diagram-2026-006_81ed3539.png",
    stem: "For the equilibrium 2XY₃(g) ⇌ X₂(g) + 3Y₂(g), the expression for Kc is",
  },
  {
    externalId: "OWNER-CHEM-DIAGRAM-2026-007",
    diagramUrl: "/manus-storage/owner-chem-diagram-2026-007_c3c993d3.png",
    stem: "The reaction C₃H₈ + Cl₂ → C₃H₇Cl + HCl in ultraviolet light is",
  },
];

const holdIncompleteTable = {
  externalId: "OWNER-CHEM-DIAGRAM-2026-009",
  diagramUrl: "/manus-storage/owner-chem-diagram-2026-009_837e85f8.png",
  stem: "In the formula table, the two compounds that combine in the presence of an acid catalyst to produce compound V are",
};

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const receipt = { removedRedundantMappings: [], heldIncompleteTable: null, skipped: [] };

  for (const target of removeRedundantMappings) {
    const [rows] = await connection.execute(
      "SELECT id, questionText, diagramUrl, explanationStatus FROM questionItems WHERE externalId = ? LIMIT 1",
      [target.externalId],
    );
    const row = rows[0];
    if (!row || row.questionText !== target.stem || row.diagramUrl !== target.diagramUrl) {
      receipt.skipped.push({ externalId: target.externalId, reason: "protected source mismatch" });
      continue;
    }
    await connection.execute(
      "UPDATE questionItems SET diagramUrl = NULL WHERE id = ? AND externalId = ? AND diagramUrl = ?",
      [row.id, target.externalId, target.diagramUrl],
    );
    receipt.removedRedundantMappings.push({ externalId: target.externalId, id: row.id });
  }

  const [holdRows] = await connection.execute(
    "SELECT id, questionText, diagramUrl, explanationStatus FROM questionItems WHERE externalId = ? LIMIT 1",
    [holdIncompleteTable.externalId],
  );
  const holdRow = holdRows[0];
  if (!holdRow || holdRow.questionText !== holdIncompleteTable.stem || holdRow.diagramUrl !== holdIncompleteTable.diagramUrl) {
    receipt.skipped.push({ externalId: holdIncompleteTable.externalId, reason: "protected source mismatch" });
  } else {
    await connection.execute(
      "UPDATE questionItems SET explanationStatus = 'needs_review' WHERE id = ? AND externalId = ? AND diagramUrl = ? AND explanationStatus = 'approved'",
      [holdRow.id, holdIncompleteTable.externalId, holdIncompleteTable.diagramUrl],
    );
    receipt.heldIncompleteTable = { externalId: holdIncompleteTable.externalId, id: holdRow.id, reason: "formula table crop is incomplete; no learner release until a readable source visual is recovered" };
  }

  await connection.commit();
  const report = { generatedAt: new Date().toISOString(), scope: "Idempotent mapping-only repair. Question text, options, answer index, topic, explanation, and source fields are preserved.", receipt };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, ...receipt }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
