import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "preflight_bolted_answer_tags_20260826.json");
const trailingAnswerPattern = /^(?<body>[\s\S]*?)(?:\s|\n)+(?:Correct answer|Answer)\s*:\s*(?<answer>[^\n.]+)\.?\s*$/i;
const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const exactKeyRestatement = (tagAnswer, expectedAnswer, answerIndex) => {
  if (tagAnswer.toLowerCase() === expectedAnswer.toLowerCase()) return true;
  const letterAndOption = /^([A-E])\s*\(\s*(.+?)\s*\)$/i.exec(tagAnswer);
  return Boolean(letterAndOption) && letterAndOption[1].toUpperCase() === String.fromCharCode(65 + Number(answerIndex)) && normalize(letterAndOption[2]).toLowerCase() === expectedAnswer.toLowerCase();
};
const nonLekkiClause = `NOT (
  LOWER(COALESCE(qs.label, '')) LIKE '%lekki headmaster%'
  OR LOWER(qi.questionText) LIKE '%lekki headmaster%'
  OR LOWER(COALESCE(qi.explanation, '')) LIKE '%lekki headmaster%'
  OR LOWER(qi.optionsJson) LIKE '%lekki headmaster%'
  OR LOWER(qi.topic) LIKE '%lekki headmaster%'
)`;

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.questionText, qi.optionsJson, qi.answerIndex, qi.explanation, qi.topic, qi.explanationStatus, qi.diagramUrl, qi.sourceId, qs.label AS sourceLabel
    FROM questionItems qi
    LEFT JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE ${nonLekkiClause}
    ORDER BY qi.id ASC
  `);
  const candidates = rows.flatMap((row) => {
    const match = String(row.explanation ?? "").match(trailingAnswerPattern);
    if (!match) return [];
    let options = [];
    try { options = JSON.parse(row.optionsJson); } catch { options = []; }
    const expectedAnswer = normalize(options[row.answerIndex]);
    const body = normalize(match.groups.body);
    const tagAnswer = normalize(match.groups.answer);
    const safe = Array.isArray(options) && row.answerIndex >= 0 && row.answerIndex < options.length && body.split(/\s+/).length >= 8 && exactKeyRestatement(tagAnswer, expectedAnswer, row.answerIndex);
    return [{
      id: row.id,
      externalId: row.externalId,
      sourceId: row.sourceId,
      sourceLabel: row.sourceLabel,
      subject: row.subject,
      originalExplanation: row.explanation,
      replacementExplanation: safe ? body : null,
      expectedAnswer,
      terminalTagAnswer: tagAnswer,
      safe,
      holdReason: safe ? null : "Terminal answer tag did not exactly repeat the stored keyed option after a substantive explanation body.",
      protectedSnapshot: {
        questionText: row.questionText,
        optionsJson: row.optionsJson,
        answerIndex: row.answerIndex,
        topic: row.topic,
        explanationStatus: row.explanationStatus,
        diagramUrl: row.diagramUrl,
        sourceId: row.sourceId,
      },
    }];
  });
  const report = {
    generatedAt: new Date().toISOString(),
    scope: "Read-only preflight for non-Lekki bolted answer tags. No database update occurs in this script.",
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
