export type QuestionPresentation = {
  prompt: string;
  contextLabel: string | null;
  context: string | null;
};

/**
 * Separates source-supplied reading material from its question prompt without
 * changing a single word. Ordinary questions retain their original text and
 * embedded line breaks for the card to render faithfully.
 */
export function splitQuestionPresentation(rawQuestion: string | null | undefined): QuestionPresentation {
  const question = rawQuestion?.trim() || "Question text is unavailable.";
  const passageMatch = /^(passage(?:\s+excerpt)?):\s*[“"]([\s\S]+?)[”"]\s*([\s\S]+)$/i.exec(question);
  if (passageMatch) {
    return { contextLabel: passageMatch[1].replace(/\s+excerpt/i, "").toUpperCase(), context: passageMatch[2].trim(), prompt: passageMatch[3].trim() };
  }

  const sentenceMatch = /^(read the sentence):\s*[‘“'"]([\s\S]+?)[’”'"]\s*([\s\S]+)$/i.exec(question);
  if (sentenceMatch) {
    return { contextLabel: `${sentenceMatch[1].toUpperCase()}:`, context: sentenceMatch[2].trim(), prompt: sentenceMatch[3].trim() };
  }

  return { contextLabel: null, context: null, prompt: question };
}
