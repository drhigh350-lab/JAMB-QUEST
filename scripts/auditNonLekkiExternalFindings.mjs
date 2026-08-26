import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const holdsPath = path.join(projectRoot, "reports", "explicit_diagram_asset_holds_20260825.json");
const outputPath = path.join(projectRoot, "reports", "non_lekki_external_audit_reproduction_20260826.json");
const normalize = (value) => String(value ?? "").replaceAll("\r\n", "\n").replaceAll("\r", "\n").trim();
const compact = (value) => normalize(value).replace(/\s+/g, " ");
const isRepeatedStemWithOptionsMarker = (questionText) => {
  const withoutMarker = compact(questionText).replace(/\s+Options:\s*$/i, "").trim();
  const match = /^(.*?)\s+\1$/i.exec(withoutMarker);
  return Boolean(match?.[1]);
};
const parsesToDistinctOptionCount = (optionsJson) => {
  try {
    const options = JSON.parse(optionsJson);
    return Array.isArray(options) ? options.filter((option) => normalize(option)).length : 0;
  } catch {
    return null;
  }
};

const holds = JSON.parse(await fs.readFile(holdsPath, "utf8"));
const heldExternalIds = new Set(holds.holds.map((hold) => hold.externalId));
const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [rows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson, qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl, qi.sourceId, qs.slug AS sourceSlug, qs.label AS sourceLabel, qs.isActive AS sourceActive
    FROM questionItems qi
    LEFT JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE NOT (
      LOWER(COALESCE(qs.label, '')) LIKE '%lekki headmaster%'
      OR LOWER(qi.questionText) LIKE '%lekki headmaster%'
      OR LOWER(COALESCE(qi.explanation, '')) LIKE '%lekki headmaster%'
      OR LOWER(qi.optionsJson) LIKE '%lekki headmaster%'
      OR LOWER(qi.topic) LIKE '%lekki headmaster%'
    )
    ORDER BY qi.id ASC
  `);

  const issueRules = [
    {
      issueType: "answer_and_explanation_leaked_in_option_d",
      predicate: (row, options) => /correct answer\s*:/i.test(String(options[3] ?? "")) || /explanation\s*:/i.test(String(options[3] ?? "")),
      repairClass: "candidate for exact source-backed option repair",
    },
    {
      issueType: "duplicated_stem_with_options_marker",
      predicate: (row) => isRepeatedStemWithOptionsMarker(row.questionText),
      repairClass: "candidate for guarded formatting-only stem repair",
    },
    {
      issueType: "literal_escaped_newline_in_question_text",
      predicate: (row) => String(row.questionText).includes("\\n"),
      repairClass: "candidate for guarded formatting-only text normalization after context review",
    },
    {
      issueType: "dangling_repeat_explanation_reference",
      predicate: (row) => /^This is a repeat of Question\s+\d+/i.test(normalize(row.explanation)),
      repairClass: "needs source-backed replacement explanation; do not invent teaching content",
    },
    {
      issueType: "bolted_answer_tag_in_explanation",
      predicate: (row) => /(?:^|\s)(?:correct answer|answer)\s*:\s*[^.\n]+\.?\s*$/i.test(normalize(row.explanation)),
      repairClass: "candidate for guarded explanation-format repair only when source explanation remains intact",
    },
    {
      issueType: "visual_reference_without_asset_or_existing_hold",
      predicate: (row) => !row.diagramUrl && !heldExternalIds.has(row.externalId) && /\b(diagram|figure|illustration|graph|table)\b|part labelled/i.test(String(row.questionText)),
      repairClass: "hold for exact original visual or prove diagram not required; never infer or generate a figure",
    },
    {
      issueType: "options_json_parse_or_count_mismatch",
      predicate: (row) => {
        const count = parsesToDistinctOptionCount(row.optionsJson);
        return count == null || count < 4 || row.answerIndex < 0 || row.answerIndex >= count;
      },
      repairClass: "inspect source before any option or key change",
    },
  ];

  const findings = issueRules.flatMap(({ issueType, predicate, repairClass }) => rows.flatMap((row) => {
    let options = [];
    try { options = JSON.parse(row.optionsJson); } catch { options = []; }
    return predicate(row, options) ? [{
      issueType,
      repairClass,
      internalId: row.id,
      externalId: row.externalId,
      subject: row.subject,
      topic: row.topic,
      sourceId: row.sourceId,
      sourceSlug: row.sourceSlug,
      sourceLabel: row.sourceLabel,
      sourceActive: Boolean(row.sourceActive),
      preview: compact(issueType.includes("option_d") ? options[3] : issueType.includes("explanation") ? row.explanation : row.questionText).slice(0, 280),
    }] : [];
  }));
  const byIssueType = Object.fromEntries(issueRules.map(({ issueType }) => [issueType, findings.filter((finding) => finding.issueType === issueType).length]));
  const byIssueTypeAndSource = Object.fromEntries(issueRules.map(({ issueType }) => {
    const sourceCounts = new Map();
    for (const finding of findings.filter((item) => item.issueType === issueType)) {
      const source = finding.sourceLabel ?? "Unknown source";
      sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
    }
    return [issueType, Object.fromEntries([...sourceCounts.entries()].sort(([left], [right]) => left.localeCompare(right)))];
  }));
  const samplesByIssueType = Object.fromEntries(issueRules.map(({ issueType }) => [issueType, findings.filter((finding) => finding.issueType === issueType).slice(0, 5)]));
  const report = {
    generatedAt: new Date().toISOString(),
    scope: "Read-only reproduction of externally reported defects. All Lekki Headmaster source/content records are excluded from this audit and must remain unchanged.",
    auditedQuestionCount: rows.length,
    excludedLekkiQuestionCount: 9352 - rows.length,
    byIssueType,
    byIssueTypeAndSource,
    samplesByIssueType,
    findingCount: findings.length,
    findings,
  };
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, auditedQuestionCount: report.auditedQuestionCount, excludedLekkiQuestionCount: report.excludedLekkiQuestionCount, byIssueType, findingCount: findings.length }, null, 2));
} finally {
  await connection.end();
}
