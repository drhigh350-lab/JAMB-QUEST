import { writeFile } from "node:fs/promises";

const originalUrl = "http://127.0.0.1:3000/manus-storage/jamb_high_yield_practice_bank_1000_biology_batches_1_5_759ba726.json";
const activeUrl = "http://127.0.0.1:3000/manus-storage/jamb_high_yield_practice_bank_1000_natural_explanations_817e6822.json";

async function load(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load ${url}: ${response.status}`);
  return response.json();
}

const [original, active] = await Promise.all([load(originalUrl), load(activeUrl)]);
const originalQuestions = Array.isArray(original.questions) ? original.questions : [];
const activeQuestions = Array.isArray(active.questions) ? active.questions : [];
if (originalQuestions.length !== 1000 || activeQuestions.length !== 1000) {
  throw new Error(`Expected two 1,000-question assets; found ${originalQuestions.length} and ${activeQuestions.length}.`);
}

const activeById = new Map(activeQuestions.map((question) => [question.id, question]));
const labelRepairedIds: string[] = [];
const nonExplanationChanges: string[] = [];
for (const originalQuestion of originalQuestions) {
  const activeQuestion = activeById.get(originalQuestion.id);
  if (!activeQuestion) throw new Error(`Active asset is missing ${originalQuestion.id}.`);
  const { explanation: originalExplanation, ...originalWithoutExplanation } = originalQuestion;
  const { explanation: activeExplanation, ...activeWithoutExplanation } = activeQuestion;
  if (JSON.stringify(originalWithoutExplanation) !== JSON.stringify(activeWithoutExplanation)) nonExplanationChanges.push(originalQuestion.id);
  if (originalExplanation !== activeExplanation) labelRepairedIds.push(originalQuestion.id);
}
if (nonExplanationChanges.length) throw new Error(`Unexpected question/answer changes: ${nonExplanationChanges.join(", ")}`);
if (labelRepairedIds.length !== 8) throw new Error(`Expected 8 label-only explanation repairs; found ${labelRepairedIds.length}.`);

const sourceValues = [...new Set(originalQuestions.map((question) => question.source))];
const report = {
  auditedAt: new Date().toISOString(),
  originalAsset: originalUrl,
  activeAsset: activeUrl,
  originalMetadata: original.metadata ?? null,
  records: {
    total: originalQuestions.length,
    sourceValues,
    labelRepaired: labelRepairedIds.length,
    labelRepairedIds,
    unmodifiedExplanationRecords: originalQuestions.length - labelRepairedIds.length,
    withheldFromActiveAsset: 0,
    nonExplanationChanges,
  },
  classification: {
    sourceSet: "Original JAMB-aligned model practice bank",
    officialPastQuestionStatus: "not official and not copied from past papers, according to source metadata",
    historicAiWritingStatus: "unproven: neither asset metadata nor per-question source fields identify an AI writer or generation run",
    learnerContentTreatment: "Eight records received label-only explanation repair; the other 992 explanations were retained unchanged.",
    remainingEvidenceNeeded: "A separate answer-correctness review and an owner-approved depth/provenance decision for 838 short explanations remain open.",
  },
};

await writeFile("reports/model_bank_provenance_audit.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
