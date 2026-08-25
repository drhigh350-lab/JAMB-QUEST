import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("owner PDF Physics Batch 8–10 intake", () => {
  it("requires the raw PDF stage, both active-bank duplicate gates, and a deterministic 206-record release subset", () => {
    const stage = readFileSync("scripts/stageOwnerPdfPhysicsAnswerMatchedBatch.mjs", "utf8");
    const release = readFileSync("scripts/releaseOwnerPdfPhysicsAnswerMatchedBatch.mjs", "utf8");

    expect(stage).toContain("jamb_questions_only.pdf");
    expect(stage).toContain("active authorised record");
    expect(stage).toContain("active model-bank record");
    expect(stage).toContain("wrapper variant repeats an earlier PDF concept");
    expect(release).toContain("Expected exactly 206 release-ready Physics records");
    expect(release).toContain("Existing external-ID collision blocks import");
    expect(release).toContain("explanationStatus: \"approved\"");
    expect(release).toContain("Mathematics is not included");
  });
});
