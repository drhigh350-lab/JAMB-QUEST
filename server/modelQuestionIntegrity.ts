const EMBEDDED_OPTION_METADATA = /(?:✓|©|\bcorrect\s+answer\s*:|\bexplanation\s*:|\bwhy\s+others?\s+are\s+wrong\s*:)/i;

type ModelQuestionForIntegrity = {
  question?: unknown;
  options?: unknown;
  answer_index?: unknown;
  answer_text?: unknown;
};

function normalise(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

export function modelQuestionIntegrityReasons(question: ModelQuestionForIntegrity) {
  const reasons: string[] = [];
  if (typeof question.question !== "string" || !question.question.trim()) reasons.push("missing question text");
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    reasons.push("must contain exactly four options");
    return reasons;
  }
  if (question.options.some((option) => typeof option !== "string" || !option.trim())) reasons.push("empty or non-text option");
  const optionTexts = question.options.filter((option): option is string => typeof option === "string");
  if (new Set(optionTexts.map(normalise)).size !== optionTexts.length) reasons.push("duplicate option");
  if (optionTexts.some((option) => EMBEDDED_OPTION_METADATA.test(option))) reasons.push("embedded answer or explanation metadata in option");
  if (!Number.isInteger(question.answer_index) || (question.answer_index as number) < 0 || (question.answer_index as number) > 3) {
    reasons.push("answer index outside A-D range");
    return reasons;
  }
  if (typeof question.answer_text !== "string" || !question.answer_text.trim()) {
    reasons.push("missing answer text");
  } else if (normalise(question.answer_text) !== normalise(optionTexts[question.answer_index as number] ?? "")) {
    reasons.push("answer text does not match indexed option");
  }
  return reasons;
}
