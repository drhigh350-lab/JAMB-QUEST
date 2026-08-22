import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("questions-only PDF staging gate", () => {
  it("stages source questions without creating answer keys, explanations, topic labels, or a release path", () => {
    const parser = readFileSync("scripts/stageQuestionsOnlyPdf.mts", "utf8");
    expect(parser).toContain('answerStatus: "awaiting_owner_answer_batch"');
    expect(parser).toContain('explanationStatus: "awaiting_owner_answer_batch"');
    expect(parser).toContain('releaseStatus: "staged_not_playable"');
    expect(parser).toContain("The parser does not infer, generate, or repair answers");
    expect(parser).not.toContain("answerIndex:");
  });
});
