import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "preflight_dangling_repeat_explanations_20260826.json");
const isDangling = (value) => /^This is a repeat of Question\s+\d+/i.test(String(value ?? "").trim());
const normalizeExplanation = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const nonLekkiClause = `NOT (
  LOWER(COALESCE(qs.label, '')) LIKE '%lekki headmaster%'
  OR LOWER(qi.questionText) LIKE '%lekki headmaster%'
  OR LOWER(COALESCE(qi.explanation, '')) LIKE '%lekki headmaster%'
  OR LOWER(qi.optionsJson) LIKE '%lekki headmaster%'
  OR LOWER(qi.topic) LIKE '%lekki headmaster%'
)`;

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [nonLekkiRows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson, qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl, qi.sourceId, qs.label AS sourceLabel
    FROM questionItems qi
    LEFT JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE ${nonLekkiClause}
    ORDER BY qi.id ASC
  `);
  const targets = nonLekkiRows.filter((row) => isDangling(normalizeExplanation(row.explanation)));
  const candidates = [];
  for (const target of targets) {
    const [counterparts] = await connection.execute(`
      SELECT qi.id, qi.externalId, qi.explanation, qi.explanationStatus, qi.sourceId, qs.label AS sourceLabel
      FROM questionItems qi
      LEFT JOIN questionSources qs ON qs.id = qi.sourceId
      WHERE qi.id <> ?
        AND qi.subject = ?
        AND qi.topic = ?
        AND qi.questionText = ?
        AND qi.optionsJson = ?
        AND qi.answerIndex = ?
        AND qi.explanation IS NOT NULL
        AND CHAR_LENGTH(TRIM(qi.explanation)) >= 24
        AND LOWER(TRIM(qi.explanation)) NOT LIKE 'this is a repeat of question%'
      ORDER BY qi.id ASC
    `, [target.id, target.subject, target.topic, target.questionText, target.optionsJson, target.answerIndex]);
    const normalizedCounterparts = new Map();
    for (const counterpart of counterparts) {
      const normalized = normalizeExplanation(counterpart.explanation);
      if (!normalized || isDangling(normalized)) continue;
      const entries = normalizedCounterparts.get(normalized) ?? [];
      entries.push({ id: counterpart.id, externalId: counterpart.externalId, sourceId: counterpart.sourceId, sourceLabel: counterpart.sourceLabel, explanationStatus: counterpart.explanationStatus });
      normalizedCounterparts.set(normalized, entries);
    }
    const uniqueExplanations = [...normalizedCounterparts.entries()];
    const safe = uniqueExplanations.length === 1;
    candidates.push({
      id: target.id,
      externalId: target.externalId,
      subject: target.subject,
      topic: target.topic,
      sourceId: target.sourceId,
      sourceLabel: target.sourceLabel,
      originalExplanation: target.explanation,
      replacementExplanation: safe ? uniqueExplanations[0][0] : null,
      counterpartEvidence: uniqueExplanations.map(([explanation, rows]) => ({ explanation, rows })),
      protectedSnapshot: {
        questionText: target.questionText,
        optionsJson: target.optionsJson,
        answerIndex: target.answerIndex,
        topic: target.topic,
        explanationStatus: target.explanationStatus,
        diagramUrl: target.diagramUrl,
        sourceId: target.sourceId,
      },
      safe,
      holdReason: safe ? null : "No exact same-subject/topic/stem/options/key counterpart with one unambiguous substantive stored explanation.",
    });
  }
  const report = {
    generatedAt: new Date().toISOString(),
    scope: "Read-only exact-counterpart preflight for non-Lekki dangling repeat explanations. No database update occurs in this script.",
    candidateCount: candidates.length,
    safeCandidateCount: candidates.filter((candidate) => candidate.safe).length,
    holdCandidateCount: candidates.filter((candidate) => !candidate.safe).length,
    candidates,
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, candidateCount: report.candidateCount, safeCandidateCount: report.safeCandidateCount, holdCandidateCount: report.holdCandidateCount }, null, 2));
} finally {
  await connection.end();
}
