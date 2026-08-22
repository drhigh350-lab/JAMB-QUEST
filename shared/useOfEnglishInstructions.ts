export type UseOfEnglishInstructionDecision = {
  instruction: string;
  questionText: string;
  changed: boolean;
};

function startsWithExplicitInstruction(questionText: string) {
  return /^(?:read (?:the )?(?:passage|text)|choose|which option|consider the sentence|in the sentence|complete the sentence|select the)/i.test(questionText.trim());
}

export function useOfEnglishInstruction(topic: string, questionText: string) {
  const prompt = questionText.trim();
  const value = `${topic} ${prompt}`.toLowerCase();
  if (startsWithExplicitInstruction(prompt)) return "";
  if (topic === "Synonyms") return "Choose the option nearest in meaning to the key word or expression in the sentence.";
  if (topic === "Antonyms") return "Choose the option opposite in meaning to the key word or expression in the sentence.";
  if (topic === "Lexis and idioms") return "Choose the option that best explains the word, expression, or usage in the question.";
  if (topic === "Sentence meaning" || value.includes("sentence interpretation") || value.includes("idiom")) return "Choose the option that best explains the expression in the sentence.";
  if (topic === "Cloze passages" || prompt.includes("______")) return "Choose the option that best completes the gap in the sentence or passage.";
  if (topic === "Mechanics") {
    if (value.includes("punctuat")) return "Choose the option that is correctly punctuated.";
    if (value.includes("spelt") || value.includes("spelling")) return "Choose the option that is correctly spelt.";
    return "Choose the option that is correct in standard written English.";
  }
  if (topic === "Vowels") return "Choose the option with the same vowel sound as the indicated word.";
  if (topic === "Consonants") return "Choose the option with the required consonant sound.";
  if (topic === "Rhymes and homophones") return "Choose the option that has the required rhyme or sound relationship.";
  if (topic === "Word stress") return "Choose the option that correctly identifies the stressed syllable.";
  if (topic === "Emphatic stress") return "Choose the option that states the meaning conveyed by the stressed word.";
  if (topic === "Comprehension passages") return "Read the passage carefully and choose the option best supported by it.";
  if (topic === "Comprehension and summary" || topic === "Original reading-text skills") return "Read the passage or excerpt carefully and choose the option that best answers the question.";
  if (topic === "Grammar and sentence structure") return "Choose the option that correctly completes or improves the sentence.";
  if (topic === "Oral forms") {
    if (/vowel/i.test(value)) return "Choose the option with the required vowel sound.";
    if (/consonant/i.test(value)) return "Choose the option with the required consonant sound.";
    if (/stress|syllable/i.test(value)) return "Choose the option that correctly identifies the stressed syllable.";
    if (/rhyme|homophone/i.test(value)) return "Choose the option with the required sound relationship.";
    return "Choose the option that correctly answers the oral English question.";
  }
  return "Choose the option that best completes or correctly answers the question.";
}

export function withUseOfEnglishInstruction(topic: string, questionText: string): UseOfEnglishInstructionDecision {
  const instruction = useOfEnglishInstruction(topic, questionText);
  return instruction
    ? { instruction, questionText: `${instruction}\n\n${questionText.trim()}`, changed: true }
    : { instruction: "", questionText: questionText.trim(), changed: false };
}
