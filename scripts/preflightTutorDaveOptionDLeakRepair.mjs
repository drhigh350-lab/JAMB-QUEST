import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "preflight_tutor_dave_option_d_leaks_20260826.json");
const sourceIds = [420003, 420004];
const leakPattern = /^(?<option>.+?)\s+Correct Answer:\s*(?<letter>[A-D])\s+Explanation:\s*(?<explanation>[\s\S]+)$/i;
const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const answerLetter = (answerIndex) => Number.isInteger(Number(answerIndex)) && Number(answerIndex) >= 0 && Number(answerIndex) <= 3 ? String.fromCharCode(65 + Number(answerIndex)) : null;

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson, qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl, qi.sourceId, qs.label AS sourceLabel
    FROM questionItems qi
    JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE qi.sourceId IN (?, ?) AND LOWER(qi.optionsJson) LIKE '%correct answer:%'
    ORDER BY qi.id ASC
  `, sourceIds);
  const candidates = rows.map((row) => {
    let options = [];
    try { options = JSON.parse(row.optionsJson); } catch { options = []; }
    const match = typeof options[3] === "string" ? options[3].match(leakPattern) : null;
    const expectedLetter = answerLetter(row.answerIndex);
    const originalOptionD = match ? normalize(match.groups.option) : "";
    const leakedAnswerLetter = match?.groups.letter?.toUpperCase() ?? null;
    const safe = Array.isArray(options)
      && options.length === 4
      && Boolean(match)
      && Boolean(originalOptionD)
      && leakedAnswerLetter === expectedLetter
      && normalize(match?.groups.explanation).length >= 8;
    return {
      id: row.id,
      externalId: row.externalId,
      sourceId: row.sourceId,
      sourceLabel: row.sourceLabel,
      subject: row.subject,
      answerIndex: Number(row.answerIndex),
      expectedAnswerLetter: expectedLetter,
      leakedAnswerLetter,
      originalOptionD,
      suffixPreview: normalize(match?.groups.explanation).slice(0, 180),
      originalOptionsJson: row.optionsJson,
      replacementOptionsJson: safe ? JSON.stringify([...options.slice(0, 3), originalOptionD]) : null,
      protectedSnapshot: {
        questionText: row.questionText,
        answerIndex: row.answerIndex,
        explanation: row.explanation,
        topic: row.topic,
        explanationStatus: row.explanationStatus,
        diagramUrl: row.diagramUrl,
        sourceId: row.sourceId,
      },
      safe,
      holdReason: safe ? null : "Option D leak did not match the exact four-option Correct Answer/Explanation parser signature with a stored-key match.",
    };
  });
  const report = {
    generatedAt: new Date().toISOString(),
    scope: "Read-only preflight for non-Lekki Tutor Dave parser-leak cleanup. No database update occurs in this script.",
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
