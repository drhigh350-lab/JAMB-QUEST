import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "owner_false_positive_diagram_ids_inspection_20260826.json");
const requestedIds = ["199", "302", "308", "315", "150127", "150128", "300016", "390109", "960657", "960663", "960664", "1080017", "1110001", "1140050", "1140067", "1230140", "1350992", "1351029", "1351041", "1351058", "1351076", "1351123", "1351153", "1351199", "1351241", "1351280", "1351305", "1351324", "1351418", "1500206"];
const placeholders = requestedIds.map(() => "?").join(", ");
const directVisualAnchor = /\b(?:in|on|from|use)\s+(?:the\s+)?(?:diagram|figure|table|chart|graph)\b|\bpart\s+label(?:led|ed)\b|\bwhich\s+(?:part|label)\b.*\b(?:diagram|figure|table)\b/i;
const likelyTextOnlyCue = /\b(?:image\s+(?:distance|formed|size|position|height|magnification)|magnification|mirror|lens|pinhole|figure\s+of\s+speech|historical\s+figure)\b/i;

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson,
      qi.answerIndex, qi.explanationStatus, qi.diagramUrl, qi.sourceId,
      qs.label AS sourceLabel, qs.isActive AS sourceActive
    FROM questionItems qi
    INNER JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE CAST(qi.id AS CHAR) IN (${placeholders}) OR qi.externalId IN (${placeholders})
    ORDER BY qi.id
  `, [...requestedIds, ...requestedIds]);
  const foundByRequestedId = new Map();
  const records = rows.map((row) => {
    const matchedRequestId = requestedIds.find((id) => id === String(row.id) || id === String(row.externalId)) ?? null;
    if (matchedRequestId) foundByRequestedId.set(matchedRequestId, true);
    const questionText = String(row.questionText ?? "").replace(/\s+/g, " ").trim();
    return {
      requestedId: matchedRequestId,
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
      directVisualAnchor: directVisualAnchor.test(questionText),
      likelyTextOnlyCue: likelyTextOnlyCue.test(questionText),
      auditDisposition: "unreviewed — owner-supplied classification is not treated as release authority",
    };
  });
  const missingRequestedIds = requestedIds.filter((id) => !foundByRequestedId.has(id));
  const report = {
    generatedAt: new Date().toISOString(),
    mode: "Read-only inspection. No question, source, diagram, learner eligibility, notification, or Lekki Headmaster record was changed.",
    ownerSuppliedClaim: "These IDs may be false-positive visual holds because terms such as image or figure can have a non-visual meaning.",
    requestedIds,
    summary: {
      requested: requestedIds.length,
      found: records.length,
      missingRequestedIds,
      directVisualAnchorCount: records.filter((record) => record.directVisualAnchor).length,
      likelyTextOnlyCueCount: records.filter((record) => record.likelyTextOnlyCue).length,
    },
    records,
  };
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, summary: report.summary, records }, null, 2));
} finally {
  await connection.end();
}
