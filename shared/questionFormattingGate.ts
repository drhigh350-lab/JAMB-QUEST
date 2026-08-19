export type FormattingGateInput = {
  subject: string;
  topic?: string | null;
  question: string;
  options: string[];
  explanation?: string | null;
  diagramUrl?: string | null;
};

export type FormattingGateResult = {
  status: "ready" | "needs_review";
  reasons: string[];
  hasAsciiExponent: boolean;
  hasLegacyEnglishGap: boolean;
};

const sourceIncompleteMarker = /\[(?:continues|passage|question stem|context|diagram|figure|graph|table|structure|apparatus)[^\]]*(?:cut off|missing|unavailable|partial|not shown)/i;
const shortUnderscoreGap = /(?<!_)_{1,4}(?!_)/;
const visualReferenceWithoutAsset = /\b(?:diagram|figure|graph|table|structure|apparatus)\s+(?:above|below|shown|following)\b/i;

/**
 * Intake checks only evidence visible in the supplied record. Missing wording,
 * context, and visual references are never invented from a topic label:
 * explicit source-loss markers go to review, while ordinary short blanks remain
 * display-safe.
 */
export function evaluateQuestionFormatting(input: FormattingGateInput): FormattingGateResult {
  const subject = input.subject.trim();
  const question = input.question ?? "";
  const text = [question, ...input.options, input.explanation ?? ""].join("\n");
  const hasAsciiExponent = /(?<=[A-Za-z0-9)\]])\^[0-9+-]+/.test(text);
  const hasLegacyEnglishGap = subject === "Use of English" && (/ {2,}/.test(question) || shortUnderscoreGap.test(question));
  const reasons: string[] = [];

  if (!question.trim()) reasons.push("question text is missing");
  if (sourceIncompleteMarker.test(question)) {
    reasons.push("source context, question stem, or required visual is explicitly incomplete");
  }
  if (visualReferenceWithoutAsset.test(question) && !input.diagramUrl?.trim()) {
    reasons.push("question references a visual but no linked visual asset is supplied");
  }

  return {
    status: reasons.length ? "needs_review" : "ready",
    reasons,
    hasAsciiExponent,
    hasLegacyEnglishGap,
  };
}
