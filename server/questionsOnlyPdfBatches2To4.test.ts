import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";

const AUDIT_PATH = "/home/ubuntu/jamb-quiz-game/reports/pdf_owner_batches_2_to_4_answer_match_audit.json";
const STAGED_PATH = "/home/ubuntu/jamb-import-staging/pdf_owner_batches_2_to_4_answer_matched_eligible.json";

describe("questions-only PDF batches 2–4 gate", () => {
  it("matches exactly the declared English and Biology source ranges without inventing learner content", () => {
    const audit = JSON.parse(readFileSync(AUDIT_PATH, "utf8")) as {
      declaredRecordCount: number;
      eligibleCount: number;
      heldCount: number;
      held: unknown[];
      perRange: Array<{ range: string; parsedAnswerCount: number; stagedSourceCount: number; eligibleCount: number; heldCount: number }>;
      releasePolicy: string;
    };
    const staged = JSON.parse(readFileSync(STAGED_PATH, "utf8")) as Array<{
      externalId: string;
      subject: "Use of English" | "Biology";
      topic: string;
      question: string;
      options: string[];
      answerIndex: number;
      explanation: string;
      sourceLabel: string;
    }>;

    expect(audit.declaredRecordCount).toBe(300);
    expect(audit.eligibleCount).toBe(300);
    expect(audit.heldCount).toBe(0);
    expect(audit.held).toEqual([]);
    expect(audit.perRange).toMatchObject([
      { range: "Use of English 101–200", parsedAnswerCount: 100, stagedSourceCount: 100, eligibleCount: 100, heldCount: 0 },
      { range: "Use of English 201–250", parsedAnswerCount: 50, stagedSourceCount: 50, eligibleCount: 50, heldCount: 0 },
      { range: "Biology 1–50", parsedAnswerCount: 50, stagedSourceCount: 50, eligibleCount: 50, heldCount: 0 },
      { range: "Biology 51–150", parsedAnswerCount: 100, stagedSourceCount: 100, eligibleCount: 100, heldCount: 0 },
    ]);
    expect(audit.releasePolicy).toContain("does not import, approve, or expose");
    expect(staged).toHaveLength(300);
    expect(new Set(staged.map((record) => record.externalId)).size).toBe(300);
    expect(staged.filter((record) => record.subject === "Use of English")).toHaveLength(150);
    expect(staged.filter((record) => record.subject === "Biology")).toHaveLength(150);

    for (const record of staged) {
      expect(resolveSyllabusTopic(record.subject, record.topic)).toBe(record.topic);
      expect(record.question.trim().length).toBeGreaterThanOrEqual(8);
      expect(record.options.length).toBeGreaterThanOrEqual(4);
      expect(record.options.length).toBeLessThanOrEqual(5);
      expect(new Set(record.options.map((option) => option.normalize("NFKC").toLowerCase().trim())).size).toBe(record.options.length);
      expect(record.answerIndex).toBeGreaterThanOrEqual(0);
      expect(record.answerIndex).toBeLessThan(record.options.length);
      expect(record.explanation.split(/\r?\n/).filter(Boolean).length).toBeLessThanOrEqual(5);
      expect([record.question, ...record.options, record.explanation].join(" ")).not.toMatch(/```|\\(?:frac|text|begin|end|sqrt)\b/i);
    }
  });

  it("uses a narrow release guard that changes only approval status for the four source labels", () => {
    const release = readFileSync("scripts/releaseQuestionsOnlyPdfBatches2To4.mts", "utf8");
    expect(release).toContain('set({ explanationStatus: "approved" })');
    expect(release).toContain('updatedFields: ["explanationStatus"]');
    expect(release).toContain("preservedProtectedFields");
    expect(release).toContain("source-verified, unapproved records");
  });
});
