import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "nonessential_diagram_link_audit_20260826.json");
const DIAGRAM_REFERENCE = /(?:\[(?:diagram|refers to .*diagram)\b|diagram\s+(?:above|below|shown|illustrated)|illustration\s+(?:above|below|shown)|figure\s+(?:above|below|shown)|\b(?:use|from)\s+the\s+diagram\b|\b(?:structure|compound|graph)\s+above\b|\bgraph\s+shown\b|\brate\s+of\s+reaction\s+diagram\b|\bbeak\s+structure\s+of\s+the\s+organism\b|\bin\s+the\s+(?:above\s+)?(?:diagram|figure|illustration)\s*,?\s+the\s+part\s+labelled\b|\bthe\s+part\s+labelled\s+(?:[a-z]|[ivxlcdm]+|\d+)\s+(?:in|on)\s+the\s+(?:above\s+)?(?:diagram|figure|illustration)\b|\buse\s+the\s+table\s+to\s+answer\b)/i;
const TEXTUAL_STRUCTURE_EVIDENCE = /(?:\[structure\]|(?:\bCH\d*|\bH\d*C)\s*(?:[-–—=]|\()|C\(=O\)|CH\(OH\))/i;
const IMPLICIT_VISUAL_ANCHOR = /\b(?:label(?:led|ed)|shown|illustrated|represented|indicated|identified|marked|curve\s+[A-Z]|part\s+[IVXLC\d]+|structure\s+[IVXLC\d]+|region\s+[IVXLC\d]+|line\s+[IVXLC\d]+)\b/i;
const LEKKI_MARKER = /lekki headmaster/i;
const requiresDiagramAsset = (questionText) => DIAGRAM_REFERENCE.test(questionText) && !TEXTUAL_STRUCTURE_EVIDENCE.test(questionText);

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson,
      qi.answerIndex, qi.explanationStatus, qi.diagramUrl, qi.sourceId,
      qs.label AS sourceLabel, qs.isActive AS sourceActive
    FROM questionItems qi
    INNER JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE qi.diagramUrl IS NOT NULL AND TRIM(qi.diagramUrl) <> ''
    ORDER BY qi.id
  `);
  const records = rows.map((row) => {
    const questionText = String(row.questionText ?? "").replace(/\s+/g, " ").trim();
    const directVisualAnchor = requiresDiagramAsset(questionText);
    const implicitVisualAnchor = IMPLICIT_VISUAL_ANCHOR.test(questionText);
    const lekki = LEKKI_MARKER.test(String(row.sourceLabel ?? "")) || LEKKI_MARKER.test(questionText);
    const disposition = lekki
      ? "leave_lekki_untouched"
      : directVisualAnchor
        ? "retain_direct_answer_critical_visual"
        : implicitVisualAnchor
          ? "retain_until_manual_label_review"
          : "candidate_remove_nonessential_link";
    return {
      id: row.id,
      externalId: row.externalId,
      subject: row.subject,
      topic: row.topic,
      questionText,
      options: JSON.parse(row.optionsJson),
      answerIndex: row.answerIndex,
      explanationStatus: row.explanationStatus,
      diagramUrl: row.diagramUrl,
      sourceId: row.sourceId,
      sourceLabel: row.sourceLabel,
      sourceActive: row.sourceActive,
      directVisualAnchor,
      implicitVisualAnchor,
      disposition,
    };
  });
  const counts = records.reduce((result, record) => {
    result[record.disposition] = (result[record.disposition] ?? 0) + 1;
    result.bySubject[record.subject] = (result.bySubject[record.subject] ?? 0) + 1;
    return result;
  }, { bySubject: {} });
  const report = {
    generatedAt: new Date().toISOString(),
    mode: "Read-only full diagram-link audit. Candidate removal means the stored question has neither the existing direct visual dependency nor an implicit label/shown/illustrated anchor; it still requires individual receipt-based review before update.",
    safetyRule: "Never remove a link from direct answer-critical visual wording, label-dependent wording, chemical structures, or any Lekki Headmaster record.",
    counts,
    records,
  };
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, counts, candidates: records.filter((record) => record.disposition === "candidate_remove_nonessential_link") }, null, 2));
} finally {
  await connection.end();
}
