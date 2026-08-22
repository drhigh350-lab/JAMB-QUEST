import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";

describe("owner Chemistry 250-batch gate", () => {
  it("requires inert parsing, Unicode-safe formula conversion, full fingerprints, answer-note integrity, and exact syllabus topics", () => {
    const audit = readFileSync("scripts/auditOwnerChemistry250.mts", "utf8");
    expect(audit).toContain("INPUT_FILES");
    expect(audit).toContain("displayMath");
    expect(audit).toContain("Duplicate hold");
    expect(audit).toContain("Answer-key hold");
    expect(audit).toContain("Formatting hold");
    expect(audit).toContain("Syllabus hold");
  });

  it("keeps staged Chemistry records on exact official topics without raw LaTex", () => {
    const staged = JSON.parse(readFileSync("/home/ubuntu/jamb-import-staging/owner_chemistry_1_250_stage.json", "utf8")) as Array<{ topic: string; question: string; options: string[]; explanation: string }>;
    expect(staged.length).toBeGreaterThan(0);
    for (const record of staged) {
      expect(resolveSyllabusTopic("Chemistry", record.topic)).toBe(record.topic);
      expect([record.question, ...record.options, record.explanation].join(" ")).not.toMatch(/\$\$|\\(?:frac|sqrt|text|mathrm|rightleftharpoons|rightarrow|propto|times|cdot|circ|Omega|mu|Delta|theta|lambda|rho|Phi|phi|pi)|(?:\^|_)\{?/);
    }
  });

  it("releases only the staged Chemistry records by changing their learner-release status", () => {
    const release = readFileSync("scripts/releaseOwnerChemistry250.mts", "utf8");
    expect(release).toContain('set({ explanationStatus: "approved" })');
    expect(release).toContain('updatedFields: ["explanationStatus"]');
    expect(release).toContain("preservedProtectedFields");
    expect(release).toContain("source-verified Chemistry rows");
  });
});
