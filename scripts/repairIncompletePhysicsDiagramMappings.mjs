import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "recovered_incomplete_physics_panels_20260825.json");

const targets = [
  {
    externalId: "OWNER-PHY-DIAGRAM-2026-003",
    expectedCurrentDiagramUrl: "/manus-storage/owner-phy-diagram-2026-003_ab65db76.png",
    replacementDiagramUrl: "/manus-storage/owner-phy-diagram-2026-003-source-panel_50717966.png",
    questionText: "The electrical power developed in the resistor shown above is",
  },
  {
    externalId: "OWNER-PHY-DIAGRAM-2026-005",
    expectedCurrentDiagramUrl: "/manus-storage/owner-phy-diagram-2026-005_58f9ed01.png",
    replacementDiagramUrl: "/manus-storage/owner-phy-diagram-2026-005-source-panel_63401d12.png",
    questionText: "Assuming E₁, E₂ and E₃ are equal, the total e.m.f. of the arrangement shown is given by",
  },
  {
    externalId: "OWNER-PHY-DIAGRAM-2026-007",
    expectedCurrentDiagramUrl: "/manus-storage/owner-phy-diagram-2026-007_79e42e61.png",
    replacementDiagramUrl: "/manus-storage/owner-phy-diagram-2026-007-source-panel_a3213b69.png",
    questionText: "If a positively charged rod is brought close to the cap of the positively charged electroscope shown, the divergence of its leaves",
  },
  {
    externalId: "OWNER-PHY-DIAGRAM-2026-008",
    expectedCurrentDiagramUrl: "/manus-storage/owner-phy-diagram-2026-008_e11f38cf.png",
    replacementDiagramUrl: "/manus-storage/owner-phy-diagram-2026-008-source-panel_acaa185f.png",
    questionText: "The acceleration of the body shown in the liquid is",
  },
];

const protectedFields = ["questionText", "optionsJson", "answerIndex", "topic", "explanation", "sourceId"];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const receipt = { repaired: [], alreadyRepaired: [], skipped: [] };

  for (const target of targets) {
    const [rows] = await connection.execute(
      `SELECT id, externalId, ${protectedFields.join(", ")}, diagramUrl, explanationStatus
       FROM questionItems WHERE externalId = ? LIMIT 1`,
      [target.externalId],
    );
    const row = rows[0];
    const protectedSnapshot = row
      ? Object.fromEntries(protectedFields.map((field) => [field, row[field]]))
      : null;

    if (!row || row.questionText !== target.questionText || row.explanationStatus !== "approved") {
      receipt.skipped.push({ externalId: target.externalId, reason: "protected source or status mismatch" });
      continue;
    }

    if (row.diagramUrl === target.replacementDiagramUrl) {
      receipt.alreadyRepaired.push({ externalId: target.externalId, id: row.id, protectedSnapshot });
      continue;
    }

    if (row.diagramUrl !== target.expectedCurrentDiagramUrl) {
      receipt.skipped.push({ externalId: target.externalId, reason: "unexpected current diagram mapping" });
      continue;
    }

    const [result] = await connection.execute(
      `UPDATE questionItems
       SET diagramUrl = ?
       WHERE id = ? AND externalId = ? AND diagramUrl = ? AND explanationStatus = "approved"`,
      [target.replacementDiagramUrl, row.id, target.externalId, target.expectedCurrentDiagramUrl],
    );
    if (result.affectedRows !== 1) {
      receipt.skipped.push({ externalId: target.externalId, reason: "guarded mapping update did not apply" });
      continue;
    }

    const [afterRows] = await connection.execute(
      `SELECT ${protectedFields.join(", ")}, diagramUrl, explanationStatus
       FROM questionItems WHERE id = ? LIMIT 1`,
      [row.id],
    );
    const after = afterRows[0];
    const protectedUnchanged = protectedFields.every((field) => after[field] === protectedSnapshot[field]);
    if (!protectedUnchanged || after.diagramUrl !== target.replacementDiagramUrl || after.explanationStatus !== "approved") {
      throw new Error(`post-update protected-field verification failed for ${target.externalId}`);
    }
    receipt.repaired.push({ externalId: target.externalId, id: row.id, protectedSnapshot });
  }

  await connection.commit();
  const report = {
    generatedAt: new Date().toISOString(),
    scope: "Idempotent mapping-only recovery of four source-only Physics figure panels. Protected question text, options, answer index, topic, explanation, and source relationship are verified unchanged.",
    targets,
    receipt,
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, receipt }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
