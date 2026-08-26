import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportsDirectory = path.join(projectRoot, "reports");
const holdsPath = path.join(reportsDirectory, "explicit_diagram_asset_holds_20260825.json");
const excludeLekkiHeadmaster = process.argv.includes("--exclude-lekki-headmaster");
const exportStem = excludeLekkiHeadmaster
  ? "jamb_quest_question_bank_audit_excluding_lekki_headmaster_20260826"
  : "jamb_quest_full_question_bank_audit_20260826";
const outputPath = path.join(reportsDirectory, `${exportStem}.csv`);
const summaryPath = path.join(reportsDirectory, `${exportStem}.summary.json`);

const columns = [
  "internal_id",
  "external_id",
  "subject",
  "topic",
  "difficulty",
  "question_text",
  "option_count",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "option_e",
  "options_json",
  "answer_index_zero_based",
  "answer_letter",
  "answer_text",
  "explanation",
  "explanation_status",
  "diagram_url",
  "audit_explicit_visual_hold",
  "audit_hold_reason",
  "source_id",
  "source_slug",
  "source_label",
  "source_type",
  "source_active",
  "question_created_at",
];

const csvValue = (value) => {
  const normalized = value == null
    ? ""
    : String(value).replaceAll("\r\n", "\n").replaceAll("\r", "\n").replaceAll("\n", "\\n");
  return `"${normalized.replaceAll('"', '""')}"`;
};

const answerLetter = (answerIndex, optionCount) => {
  const index = Number(answerIndex);
  return Number.isInteger(index) && index >= 0 && index < optionCount && index < 26
    ? String.fromCharCode(65 + index)
    : "";
};

const holds = JSON.parse(await fs.readFile(holdsPath, "utf8"));
const holdsByExternalId = new Map(holds.holds.map((hold) => [hold.externalId, hold]));
const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [[databaseTotal]] = await connection.execute("SELECT COUNT(*) AS totalQuestionCount FROM questionItems");
  const lekkiExclusionClause = excludeLekkiHeadmaster
    ? `WHERE NOT (
      LOWER(COALESCE(qs.label, '')) LIKE '%lekki headmaster%'
      OR LOWER(qi.questionText) LIKE '%lekki headmaster%'
      OR LOWER(COALESCE(qi.explanation, '')) LIKE '%lekki headmaster%'
      OR LOWER(qi.optionsJson) LIKE '%lekki headmaster%'
      OR LOWER(qi.topic) LIKE '%lekki headmaster%'
    )`
    : "";
  const [rows] = await connection.execute(`
    SELECT
      qi.id,
      qi.externalId,
      qi.subject,
      qi.topic,
      qi.difficulty,
      qi.questionText,
      qi.optionsJson,
      qi.answerIndex,
      qi.explanation,
      qi.explanationStatus,
      qi.diagramUrl,
      qi.sourceId,
      qi.createdAt,
      qs.slug AS sourceSlug,
      qs.label AS sourceLabel,
      qs.sourceType,
      qs.isActive AS sourceActive
    FROM questionItems qi
    LEFT JOIN questionSources qs ON qs.id = qi.sourceId
    ${lekkiExclusionClause}
    ORDER BY qi.subject ASC, qi.externalId ASC, qi.id ASC
  `);

  const exportRows = rows.map((row) => {
    let options;
    try {
      options = JSON.parse(row.optionsJson);
    } catch {
      options = [];
    }
    const safeOptions = Array.isArray(options) ? options : [];
    const hold = holdsByExternalId.get(row.externalId);
    return {
      internal_id: row.id,
      external_id: row.externalId,
      subject: row.subject,
      topic: row.topic,
      difficulty: row.difficulty,
      question_text: row.questionText,
      option_count: safeOptions.length,
      option_a: safeOptions[0] ?? "",
      option_b: safeOptions[1] ?? "",
      option_c: safeOptions[2] ?? "",
      option_d: safeOptions[3] ?? "",
      option_e: safeOptions[4] ?? "",
      options_json: row.optionsJson,
      answer_index_zero_based: row.answerIndex,
      answer_letter: answerLetter(row.answerIndex, safeOptions.length),
      answer_text: safeOptions[row.answerIndex] ?? "",
      explanation: row.explanation,
      explanation_status: row.explanationStatus,
      diagram_url: row.diagramUrl,
      audit_explicit_visual_hold: hold ? "yes" : "no",
      audit_hold_reason: hold?.reason ?? "",
      source_id: row.sourceId,
      source_slug: row.sourceSlug,
      source_label: row.sourceLabel,
      source_type: row.sourceType,
      source_active: row.sourceActive,
      question_created_at: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    };
  });

  const csv = `${columns.join(",")}\n${exportRows.map((row) => columns.map((column) => csvValue(row[column])).join(",")).join("\n")}\n`;
  const bySubject = Object.fromEntries([...new Set(exportRows.map((row) => row.subject))].sort().map((subject) => [subject, exportRows.filter((row) => row.subject === subject).length]));
  const fiveOptionRows = exportRows.filter((row) => row.option_count === 5);
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "Read-only full question-bank export for owner-provided external audit. No learner record was changed.",
    excludesLekkiHeadmaster: excludeLekkiHeadmaster,
    exclusionRule: excludeLekkiHeadmaster ? "Question source label or preserved question content contains 'Lekki Headmaster' (case-insensitive)." : null,
    excludedQuestionCount: Number(databaseTotal.totalQuestionCount) - exportRows.length,
    outputPath,
    csvColumns: columns,
    totalRows: exportRows.length,
    bySubject,
    explicitVisualHoldsIncluded: holds.holds.length,
    integrityChecks: {
      exportedRowsMatchDatabaseRows: exportRows.length === rows.length,
      exportedPlusExcludedRowsMatchDatabaseRows: exportRows.length + (Number(databaseTotal.totalQuestionCount) - exportRows.length) === Number(databaseTotal.totalQuestionCount),
      allRowsHaveExternalId: exportRows.every((row) => Boolean(row.external_id)),
      allRowsRetainRawOptionsJson: exportRows.every((row) => typeof row.options_json === "string"),
      physicalCsvRowsMatchHeaderPlusQuestions: csv.split("\n").length - 2 === exportRows.length,
      fiveOptionQuestionCount: fiveOptionRows.length,
      allFiveOptionRowsExposeOptionE: fiveOptionRows.every((row) => Boolean(row.option_e)),
      allCurrentExplicitVisualHoldsPresent: holds.holds.every((hold) => exportRows.some((row) => row.external_id === hold.externalId && row.audit_explicit_visual_hold === "yes")),
    },
  };

  await fs.writeFile(outputPath, csv);
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await connection.end();
}
