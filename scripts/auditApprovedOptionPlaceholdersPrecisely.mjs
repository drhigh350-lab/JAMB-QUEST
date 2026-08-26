import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const outputPath = path.join(projectRoot, "reports", "approved_option_placeholder_precision_audit_20260826.json");
const knownPlaceholderOptions = new Set(["no explanation", "no explanation available"]);
const normalise = (value) => String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT id, externalId, subject, topic, questionText, optionsJson, answerIndex, sourceId
     FROM questionItems
     WHERE explanationStatus = 'approved'
     ORDER BY id`,
  );

  const findings = [];
  const malformedOptionsJsonExternalIds = [];
  for (const row of rows) {
    let options;
    try {
      options = JSON.parse(row.optionsJson);
    } catch {
      malformedOptionsJsonExternalIds.push(row.externalId);
      continue;
    }
    if (!Array.isArray(options)) {
      malformedOptionsJsonExternalIds.push(row.externalId);
      continue;
    }
    const placeholders = options
      .map((option, index) => ({ index, option, normalised: normalise(option) }))
      .filter(({ normalised }) => !normalised || knownPlaceholderOptions.has(normalised))
      .map(({ index, option, normalised }) => ({ index, option, kind: !normalised ? "empty" : "known_no_explanation" }));
    if (placeholders.length > 0) {
      findings.push({
        externalId: row.externalId,
        id: Number(row.id),
        subject: row.subject,
        topic: row.topic,
        questionText: row.questionText,
        options,
        answerIndex: Number(row.answerIndex),
        sourceId: Number(row.sourceId),
        placeholders,
      });
    }
  }

  const byKind = Object.fromEntries(
    ["empty", "known_no_explanation"].map((kind) => [kind, findings.filter(({ placeholders }) => placeholders.some((placeholder) => placeholder.kind === kind)).length]),
  );
  const approvedRowsScannedBySubject = Object.fromEntries(
    [...new Set(rows.map(({ subject }) => subject))].sort().map((subject) => [subject, rows.filter((row) => row.subject === subject).length]),
  );
  await fs.writeFile(outputPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    scope: "Precise JSON parse of every approved learner record. It detects only truly empty option strings and literal no-explanation placeholder values; quoted dialogue is parsed as ordinary option text and does not produce a false match.",
    approvedRowsScanned: rows.length,
    approvedRowsScannedBySubject,
    totalAffected: findings.length,
    byKind,
    malformedOptionsJsonExternalIds,
    findings,
  }, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, approvedRowsScanned: rows.length, approvedRowsScannedBySubject, totalAffected: findings.length, byKind, malformedOptionsJsonCount: malformedOptionsJsonExternalIds.length }, null, 2));
} finally {
  await connection.end();
}
