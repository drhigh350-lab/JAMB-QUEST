import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("model-bank English instruction repair", () => {
  it("uses a deterministic instruction-only transformation with protected question fields unchanged", () => {
    const script = readFileSync("scripts/prepareModelBankEnglishInstructionRepair.mts", "utf8");
    expect(script).toContain('question.subject !== "Use of English"');
    expect(script).toContain("withUseOfEnglishInstruction");
    expect(script).toContain("Question count changed during instruction-only repair");
    expect(script).toContain("Protected model fields changed");
    expect(script).toContain('"answer_index"');
    expect(script).toContain('"explanation"');
  });
});
