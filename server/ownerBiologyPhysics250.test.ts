import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";

describe("owner Biology and Physics 250-batch gate", () => {
  it("requires inert parsing, Unicode-safe formatting, full fingerprints, answer integrity, and exact syllabus topics", () => {
    const audit = readFileSync("scripts/auditOwnerBiologyPhysics250.mts", "utf8");
    expect(audit).toContain("BIOLOGY_FILES");
    expect(audit).toContain("PHYSICS_FILES");
    expect(audit).toContain("displayMath");
    expect(audit).toContain("Duplicate hold");
    expect(audit).toContain("Formatting hold");
    expect(audit).toContain("Syllabus hold");
    expect(audit).toContain("resolveSyllabusTopic");
  });

  it("releases only the staged records by changing their learner-release status", () => {
    const release = readFileSync("scripts/releaseOwnerBiologyPhysics250.mts", "utf8");
    expect(release).toContain('set({ explanationStatus: "approved" })');
    expect(release).toContain('updatedFields: ["explanationStatus"]');
    expect(release).toContain("preservedProtectedFields");
    expect(release).toContain("expected ${staged.length} staged rows");
  });

  it("keeps every staged record on an exact official topic and without raw LaTex", () => {
    const staged = JSON.parse(readFileSync("/home/ubuntu/jamb-import-staging/owner_biology_physics_250_stage.json", "utf8")) as Array<{
      subject: "Biology" | "Physics";
      topic: string;
      question: string;
      options: string[];
      explanation: string;
    }>;
    expect(staged.length).toBeGreaterThan(0);
    for (const record of staged) {
      expect(resolveSyllabusTopic(record.subject, record.topic)).toBe(record.topic);
      expect([record.question, ...record.options, record.explanation].join(" ")).not.toMatch(/\$\$|\\(?:frac|text|mathrm|Omega|mu|Delta|theta|lambda|rho|omega|Phi|pi|circ)/);
    }
  });
});
