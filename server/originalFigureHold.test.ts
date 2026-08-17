import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const review = readFileSync("reports/withheld_diagram_question_review_aug17.md", "utf8");
const reconciliation = readFileSync("reports/held_diagram_candidate_reclassification_aug17.md", "utf8");

describe("original-figure-dependent diagram holds", () => {
  it("keeps the only two label-dependent records out of any guessed-diagram workflow", () => {
    const figureRequired = [...review.matchAll(/### \d+\. Biology · ([\w-]+)[\s\S]*?Original source figure required; do not recreate from guesswork\./g)].map((match) => match[1]);
    expect(figureRequired).toEqual(["biology-dr-high-0012", "biology-dr-high-0013"]);
    expect(reconciliation).toContain("`biology-dr-high-0012`");
    expect(reconciliation).toContain("`biology-dr-high-0013`");
    expect(reconciliation).toContain("no guessed replacement visual was created");
  });
});
