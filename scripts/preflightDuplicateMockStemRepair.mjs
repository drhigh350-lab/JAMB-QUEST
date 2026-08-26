import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "preflight_duplicate_mock_stems_20260826.json");
const sourceIds = [1230003, 1290001];
const normalizeLineEndings = (value) => String(value ?? "").replaceAll("\r\n", "\n").replaceAll("\r", "\n");
const getExactDuplicateStem = (questionText) => {
  const normalized = normalizeLineEndings(questionText).trim();
  if (!/\s+Options:\s*$/i.test(normalized)) return null;
  const beforeMarker = normalized.replace(/\s+Options:\s*$/i, "").trim();
  const match = /^(?<stem>.+?)\s+\k<stem>$/is.exec(beforeMarker);
  return match?.groups?.stem?.trim() || null;
};

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.questionText, qi.optionsJson, qi.answerIndex, qi.explanation, qi.topic, qi.explanationStatus, qi.diagramUrl, qi.sourceId, qs.label AS sourceLabel
    FROM questionItems qi
    JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE qi.sourceId IN (?, ?) AND qi.questionText LIKE '%Options:%'
    ORDER BY qi.id ASC
  `, sourceIds);
  const candidates = rows.map((row) => {
    const replacementQuestionText = getExactDuplicateStem(row.questionText);
    let optionCount = null;
    try { optionCount = JSON.parse(row.optionsJson).length; } catch { optionCount = null; }
    const safe = Boolean(replacementQuestionText) && optionCount != null && row.answerIndex >= 0 && row.answerIndex < optionCount;
    return {
      id: row.id,
      externalId: row.externalId,
      sourceId: row.sourceId,
      sourceLabel: row.sourceLabel,
      subject: row.subject,
      originalQuestionText: row.questionText,
      replacementQuestionText,
      safe,
      holdReason: safe ? null : "Stem was not an exact duplicated sentence plus trailing Options: marker with a usable stored option set.",
      protectedSnapshot: {
        optionsJson: row.optionsJson,
        answerIndex: row.answerIndex,
        explanation: row.explanation,
        topic: row.topic,
        explanationStatus: row.explanationStatus,
        diagramUrl: row.diagramUrl,
        sourceId: row.sourceId,
      },
    };
  });
  const report = {
    generatedAt: new Date().toISOString(),
    scope: "Read-only preflight for exact duplicated JAMB Mock 2026 stems. No Lekki Headmaster source or learner record is included or changed.",
    sourceIds,
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
