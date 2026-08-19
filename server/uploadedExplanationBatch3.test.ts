import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { QUESTION_BANK_URL } from "../client/src/game/questionBank";
import { questionExplanationLines } from "../client/src/game/explanation";

describe("uploaded explanation batch 3", () => {
  it("uses the managed 100-record explanation asset and invalidates stale offline packs", () => {
    const offlinePack = readFileSync("client/src/lib/offlineStudyPack.ts", "utf8");
    const worker = readFileSync("client/public/sw.js", "utf8");

    expect(QUESTION_BANK_URL).toContain("jamb_high_yield_practice_bank_1000_explanations_batch3_v1_8baa41e3.json");
    expect(offlinePack).toContain('jamb-quest-study-pack-v3');
    expect(worker).toContain('jamb-quest-study-pack-v3');
  });

  it("keeps a supplied rich explanation free of the generic fallback ending", () => {
    const lines = questionExplanationLines({
      id: "ENG-203",
      subject: "Use of English",
      topic: "Oral English",
      question: "Which word starts with a three-consonant cluster?",
      options: ["Bread", "Frog", "Plane", "Splash"],
      answer_index: 3,
      answer_text: "Splash",
      explanation: "Splash begins with the consonant cluster /spl/, three consonant sounds in a row before the vowel, making it correct. Bread and frog begin with only two-consonant clusters, and plane also has only two. This tests recognising consonant cluster size at the start of English words, a phonetics concept tested in oral English. Three-consonant clusters commonly begin with /s/ followed by a voiceless stop and a liquid or glide, as in splash, spring, and street.",
    });

    expect(lines.join(" ")).not.toContain("compare each option with the exact condition in the question");
  });
});
