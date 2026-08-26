import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const reportPath = path.join("/home/ubuntu/jamb-quiz-game", "reports", "bracketed_diagram_top_note_inventory_20260826.json");
const removableTopNote = /^\s*(\[(?:diagram\s*:|refers?\s+to\b[^\]]*(?:diagram|figure|graph|table|set-?up)[^\]]*)\])\s*/i;
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`
    SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.questionText, qi.optionsJson,
      qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl, qi.sourceId,
      qs.label AS sourceLabel, qs.isActive AS sourceActive
    FROM questionItems qi INNER JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE qi.diagramUrl IS NOT NULL AND TRIM(qi.diagramUrl) <> ''
    ORDER BY qi.id
  `);
  const removable = rows.flatMap((row) => {
    const match = row.questionText.match(removableTopNote);
    if (!match) return [];
    const options = JSON.parse(row.optionsJson);
    return [{
      id: row.id, externalId: row.externalId, subject: row.subject, topic: row.topic,
      note: match[1], questionText: row.questionText, questionAfterRemovingNote: row.questionText.replace(removableTopNote, "").trimStart(),
      options, answerIndex: row.answerIndex, savedAnswer: options[row.answerIndex] ?? null,
      explanation: row.explanation, explanationStatus: row.explanationStatus, diagramUrl: row.diagramUrl,
      sourceId: row.sourceId, sourceLabel: row.sourceLabel, sourceActive: Boolean(row.sourceActive),
      noteType: /^\[diagram\s*:/i.test(match[1]) ? "diagram-description" : "diagram-reference",
    }];
  });
  const report = {
    generatedAt: new Date().toISOString(),
    mode: "Read-only inventory. Only leading bracketed diagram descriptions/references are reported; normal instructions are excluded.",
    linkedRecordCount: rows.length,
    removableBracketedTopNoteCount: removable.length,
    byType: removable.reduce((counts, row) => ({ ...counts, [row.noteType]: (counts[row.noteType] ?? 0) + 1 }), {}),
    records: removable,
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, linkedRecordCount: report.linkedRecordCount, removableBracketedTopNoteCount: report.removableBracketedTopNoteCount, byType: report.byType, records: removable.map(({ id, externalId, note, questionAfterRemovingNote, diagramUrl }) => ({ id, externalId, note, questionAfterRemovingNote, diagramUrl })) }, null, 2));
} finally {
  await connection.end();
}
