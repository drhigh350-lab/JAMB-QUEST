import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const outputPath = path.join(projectRoot, "reports", "no_explanation_option_placeholder_audit_20260826.json");
const placeholders = new Set(["no explanation", "no explanation available"]);
const normalise = (value) => String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    `SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson, qi.answerIndex, qi.explanationStatus, qi.sourceId, qi.diagramUrl
     FROM questionItems qi
     WHERE qi.explanationStatus = 'approved'
       AND (LOWER(qi.optionsJson) LIKE '%no explanation%' OR qi.optionsJson LIKE '%""%')
     ORDER BY qi.subject, qi.externalId`,
  );

  const findings = rows.map((row) => {
    const options = JSON.parse(row.optionsJson);
    const placeholderIndices = options
      .map((option, index) => ({ option, index, normalised: normalise(option) }))
      .filter(({ normalised }) => !normalised || placeholders.has(normalised))
      .map(({ index, option }) => ({ index, option }));
    return {
      id: Number(row.id),
      externalId: row.externalId,
      subject: row.subject,
      topic: row.topic,
      questionText: row.questionText,
      options,
      answerIndex: Number(row.answerIndex),
      placeholderIndices,
      answerPointsToPlaceholder: placeholderIndices.some(({ index }) => index === Number(row.answerIndex)),
      sourceId: Number(row.sourceId),
      diagramUrl: row.diagramUrl,
    };
  }).filter(({ placeholderIndices }) => placeholderIndices.length > 0);

  const bySubject = Object.fromEntries(
    [...new Set(findings.map(({ subject }) => subject))].sort().map((subject) => [subject, findings.filter((finding) => finding.subject === subject).length]),
  );
  const bySourceId = Object.fromEntries(
    [...new Set(findings.map(({ sourceId }) => sourceId))].sort((a, b) => a - b).map((sourceId) => [sourceId, findings.filter((finding) => finding.sourceId === sourceId).length]),
  );
  const answerPlaceholderExternalIds = findings.filter(({ answerPointsToPlaceholder }) => answerPointsToPlaceholder).map(({ externalId }) => externalId);

  await fs.writeFile(outputPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    scope: "Read-only inventory of active approved learner questions containing an empty or no-explanation placeholder in optionsJson. This audit makes no database mutation.",
    totalAffected: findings.length,
    bySubject,
    bySourceId,
    answerPointsToPlaceholderExternalIds: answerPlaceholderExternalIds,
    requiredDisposition: "Hold every affected record outside learner play until its exact original/source supports a guarded option repair; never replace a placeholder option by inference.",
    findings,
  }, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, totalAffected: findings.length, bySubject, bySourceId, answerPlaceholderCount: answerPlaceholderExternalIds.length }, null, 2));
} finally {
  await connection.end();
}
