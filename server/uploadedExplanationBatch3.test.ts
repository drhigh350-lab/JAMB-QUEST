import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { QUESTION_BANK_URL } from "../client/src/game/questionBank";
import { questionExplanationLines } from "../client/src/game/explanation";

describe("uploaded explanation batches 2 through 7 plus the clean batch-nine model subset", () => {
  it("uses the managed combined explanation asset and invalidates stale offline packs", () => {
    const offlinePack = readFileSync("client/src/lib/offlineStudyPack.ts", "utf8");
    const worker = readFileSync("client/public/sw.js", "utf8");

    expect(QUESTION_BANK_URL).toContain("jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v1_00288b3a.json");
    expect(offlinePack).toContain("jamb-quest-study-pack-v8");
    expect(worker).toContain("jamb-quest-study-pack-v8");
  });

  it("keeps rich supplied explanations free of the generic fallback ending", () => {
    const lines = questionExplanationLines({
      id: "ENG-102",
      subject: "Use of English",
      topic: "Lexis and Structure",
      question: "What is the opposite in meaning to seldom?",
      options: ["Rarely", "Occasionally", "Frequently", "Often"],
      answer_index: 2,
      answer_text: "Frequently",
      explanation: "Seldom means rarely or infrequently, so its antonym must express the opposite idea of frequency, making frequently correct. Rarely and occasionally are close synonyms of seldom, not opposites, and often is close to frequent but frequently is the more precise match. This tests antonym recognition where several distractors are synonym traps rather than genuine opposites. Always check whether a tempting option is actually a synonym in disguise before selecting it as the antonym.",
    });

    expect(lines.join(" ")).not.toContain("compare each option with the exact condition in the question");
  });
});
