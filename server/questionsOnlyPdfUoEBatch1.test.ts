import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";

const AUDIT_PATH = "/home/ubuntu/jamb-quiz-game/reports/pdf_owner_uoe_001_to_100_answer_match_audit.json";
const STAGE_PATH = "/home/ubuntu/jamb-import-staging/pdf_owner_uoe_001_to_100_answer_matched_eligible.json";

describe("questions-only PDF Use of English batch 1 gate", () => {
  it("matches only source-backed keys, holds the contradictory key, and preserves learner-bank constraints", async () => {
    const [auditRaw, stageRaw] = await Promise.all([readFile(AUDIT_PATH, "utf8"), readFile(STAGE_PATH, "utf8")]);
    const audit = JSON.parse(auditRaw) as {
      parsedAnswerCount: number;
      stagedSourceCount: number;
      eligibleCount: number;
      held: Array<{ externalId: string; questionNumber: number; reason: string }>;
      releasePolicy: string;
    };
    const stage = JSON.parse(stageRaw) as Array<{
      externalId: string;
      subject: string;
      topic: string;
      question: string;
      options: string[];
      answerIndex: number;
      explanation: string;
    }>;

    expect(audit.parsedAnswerCount).toBe(100);
    expect(audit.stagedSourceCount).toBe(100);
    expect(audit.eligibleCount).toBe(99);
    expect(audit.held).toEqual([{
      externalId: "PDF-OWNER-20260822-ENG-031",
      questionNumber: 31,
      reason: "Answer-key hold: the explanation states a different answer letter from the supplied answer heading.",
    }]);
    expect(audit.releasePolicy).toContain("does not import, approve, or expose");
    expect(stage).toHaveLength(99);
    expect(stage.some((record) => record.externalId === "PDF-OWNER-20260822-ENG-031")).toBe(false);
    expect(new Set(stage.map((record) => record.externalId)).size).toBe(99);

    for (const record of stage) {
      expect(record.subject).toBe("Use of English");
      expect(resolveSyllabusTopic("Use of English", record.topic)).toBe(record.topic);
      expect(record.question.length).toBeGreaterThanOrEqual(8);
      expect(record.options).toHaveLength(4);
      expect(new Set(record.options.map((option) => option.toLowerCase().trim())).size).toBe(4);
      expect(record.answerIndex).toBeGreaterThanOrEqual(0);
      expect(record.answerIndex).toBeLessThan(record.options.length);
      expect(record.explanation.split(/\r?\n/).filter(Boolean)).toHaveLength(1);
      expect(record.explanation).not.toMatch(/```|\\(?:frac|text|begin|end|sqrt)\b/i);
    }
  });

  it("keeps the approval step source-scoped and updates only learner-release status", () => {
    const release = require("node:fs").readFileSync("scripts/releaseQuestionsOnlyPdfUoEBatch1.mts", "utf8") as string;
    expect(release).toContain('set({ explanationStatus: "approved" })');
    expect(release).toContain('updatedFields: ["explanationStatus"]');
    expect(release).toContain("preservedProtectedFields");
    expect(release).toContain("PDF-OWNER-20260822-ENG-031");
    expect(release).toContain("source-verified, unapproved Use of English rows");
  });
});
