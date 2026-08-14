const templateLabels = /(^|\n)\s*(Concept|Mechanism|Observation|Distinction|Therefore|Answer|Core idea|Topic focus|Reasoning step|Check the alternatives|Exam takeaway)\s*:/i;
const templatePhrases = ["this question tests your understanding", "read the key wording", "before moving to the next question", "revisit "];

function sentences(text: string) {
  return text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter((sentence) => sentence.split(/\s+/).length >= 5);
}

function normalise(sentence: string) {
  return sentence.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function naturalExplanationReasons(text: string): string[] {
  const reasons: string[] = [];
  const lower = text.toLowerCase();
  if (templateLabels.test(text)) reasons.push("template label");
  if (templatePhrases.some((phrase) => lower.includes(phrase))) reasons.push("template phrase");
  const sourceSentences = sentences(text.replace(/(^|\n)\s*(Concept|Mechanism|Observation|Distinction|Therefore|Answer|Core idea|Topic focus|Reasoning step|Check the alternatives|Exam takeaway)\s*:\s*/gi, "$1"));
  const exactCounts = new Map<string, number>();
  const stemCounts = new Map<string, number>();
  for (const sentence of sourceSentences) {
    const cleaned = normalise(sentence);
    if (!cleaned) continue;
    exactCounts.set(cleaned, (exactCounts.get(cleaned) ?? 0) + 1);
    const stem = cleaned.split(" ").slice(0, 7).join(" ");
    if (stem.split(" ").length >= 5) stemCounts.set(stem, (stemCounts.get(stem) ?? 0) + 1);
  }
  if (Array.from(exactCounts.values()).some((count) => count > 1)) reasons.push("duplicated sentence");
  if (Array.from(stemCounts.values()).some((count) => count > 1)) reasons.push("repeated sentence stem");
  return reasons;
}
