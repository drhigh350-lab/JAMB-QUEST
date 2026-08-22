import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("owner-supplied English pasted batch gate", () => {
  it("requires full question-and-option duplicate matching, source context, exact official topics, and the known Oral English hold", () => {
    const audit = readFileSync("scripts/auditOwnerEnglishPastedBatch.mts", "utf8");
    const receipt = readFileSync("reports/owner_english_pasted_batch_audit.json", "utf8");

    expect(audit).toContain("function fingerprint(question: string, options: string[])");
    expect(audit).toContain("comprehensionPassageA");
    expect(audit).toContain("libraryReadingText");
    expect(audit).toContain("clozePrompts");
    expect(audit).toContain("question.number === 74");
    expect(audit).toContain("stone’ and ‘gone’ do not rhyme");
    expect(audit).toContain("Cloze passages");
    expect(audit).toContain("Comprehension passages");
    expect(receipt).toContain('"parsedCount": 125');
    expect(receipt).toContain('"eligibleCount": 124');
    expect(receipt).toContain('"heldCount": 1');
    expect(receipt).toContain('"questionNumber": 74');
  });
});
