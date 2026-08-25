import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const reportPath = path.join(projectRoot, "reports", "learner_diagram_inventory_20260825.json");
const modelBankUrl = "https://jambquiz-kmqgtf9m.manus.space/manus-storage/jamb_high_yield_practice_bank_1000_model_v5_explanations_reviewed_688e6cd1.json";

const diagramCue = /\b(diagram|figure|graph|chart|illustration|illustrated|following\s+(?:diagram|figure|graph|chart)|shown\s+(?:above|below|in)|represented\s+by|label(?:led)?\s+(?:[IVX]+|[A-Z]|\d+)|points?\s+to|curve\s+[A-Z])\b/i;
const visuallyRequiredCue = /\b(diagram|figure|graph|chart|illustration|illustrated|following\s+(?:diagram|figure|graph|chart)|shown\s+(?:above|below)|represented\s+by|points?\s+to)\b/i;

function normalize(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function classify(record) {
  const text = normalize(record.questionText ?? record.question);
  const diagramUrl = normalize(record.diagramUrl ?? record.diagram_url);
  const hasDiagram = Boolean(diagramUrl);
  const hasCue = diagramCue.test(text);
  const visuallyRequired = visuallyRequiredCue.test(text);
  return {
    ...record,
    questionText: text,
    diagramUrl: diagramUrl || null,
    hasDiagram,
    hasCue,
    visuallyRequired,
    inventoryClass: hasDiagram ? "linked_asset" : visuallyRequired ? "possible_missing_asset" : "visual_cue_review",
  };
}

function summarize(records) {
  const bySubject = {};
  const byClass = {};
  for (const record of records) {
    bySubject[record.subject] ??= { total: 0, linkedAsset: 0, possibleMissingAsset: 0, visualCueReview: 0 };
    bySubject[record.subject].total += 1;
    if (record.inventoryClass === "linked_asset") bySubject[record.subject].linkedAsset += 1;
    if (record.inventoryClass === "possible_missing_asset") bySubject[record.subject].possibleMissingAsset += 1;
    if (record.inventoryClass === "visual_cue_review") bySubject[record.subject].visualCueReview += 1;
    byClass[record.inventoryClass] = (byClass[record.inventoryClass] ?? 0) + 1;
  }
  return { bySubject, byClass };
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [authorisedRows] = await connection.execute(`
    SELECT
      qi.id,
      qi.externalId,
      qi.subject,
      qi.topic,
      qi.questionText,
      qi.optionsJson,
      qi.answerIndex,
      qi.diagramUrl,
      qs.slug AS sourceSlug,
      qs.label AS sourceLabel
    FROM questionItems qi
    INNER JOIN questionSources qs ON qs.id = qi.sourceId
    WHERE qs.isActive = 1
      AND qi.explanationStatus = 'approved'
      AND (
        qi.diagramUrl IS NOT NULL
        OR LOWER(qi.questionText) REGEXP 'diagram|figure|graph|chart|illustration|illustrated|shown above|shown below|following diagram|following figure|following graph|represented by|points to|labelled|labeled'
      )
    ORDER BY qi.subject, qs.slug, qi.externalId
  `);

  const modelResponse = await fetch(modelBankUrl);
  if (!modelResponse.ok) throw new Error(`Model-bank inventory fetch failed with ${modelResponse.status}`);
  const modelPayload = await modelResponse.json();
  const modelQuestions = Array.isArray(modelPayload.questions) ? modelPayload.questions : [];

  const authorised = authorisedRows.map((row) => classify({
    bank: "authorised",
    id: `authorised-${row.id}`,
    externalId: row.externalId,
    subject: row.subject,
    topic: row.topic,
    questionText: row.questionText,
    options: JSON.parse(row.optionsJson),
    answerIndex: row.answerIndex,
    diagramUrl: row.diagramUrl,
    sourceSlug: row.sourceSlug,
    sourceLabel: row.sourceLabel,
  }));
  const model = modelQuestions
    .filter((question) => question && typeof question === "object")
    .map((question) => classify({
      bank: "model",
      id: question.id,
      externalId: question.id,
      subject: question.subject,
      topic: question.topic,
      questionText: question.question,
      options: question.options,
      answerIndex: question.answer_index,
      diagramUrl: question.diagram_url,
      sourceSlug: "model-v5",
      sourceLabel: "JAMB-Aligned High-Yield Practice Bank v5",
    }))
    .filter((question) => question.hasDiagram || question.hasCue);

  const allRecords = [...authorised, ...model];
  const report = {
    generatedAt: new Date().toISOString(),
    scope: "Read-only learner-bank diagram inventory. A visual cue is not proof that an image is required; it must be classified with source evidence before any learner asset mapping changes.",
    counts: {
      authorisedCandidates: authorised.length,
      modelCandidates: model.length,
      totalCandidates: allRecords.length,
      ...summarize(allRecords),
    },
    records: allRecords,
  };

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, counts: report.counts }, null, 2));
} finally {
  await connection.end();
}
