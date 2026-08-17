import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(readFileSync("reports/biology_diagram_questions_aug17.json", "utf8")) as {
  questions: Array<{ externalId: string; subject: string; options: string[]; answerIndex: number; explanation: string; topic: string; diagramUrl: string }>;
};

describe("owner Biology diagram questions · August 2026", () => {
  it("contains nine keyed four-option questions with concise explanations and deployed visuals", () => {
    expect(manifest.questions).toHaveLength(9);
    expect(new Set(manifest.questions.map((question) => question.externalId)).size).toBe(9);
    for (const question of manifest.questions) {
      expect(question.subject).toBe("Biology");
      expect(question.options).toHaveLength(4);
      expect(question.answerIndex).toBeGreaterThanOrEqual(0);
      expect(question.answerIndex).toBeLessThan(4);
      expect(question.explanation.split(/\n+/).filter(Boolean).length).toBeLessThanOrEqual(5);
      expect(question.topic.length).toBeGreaterThan(3);
      expect(question.diagramUrl).toMatch(/^\/manus-storage\//);
    }
  });

  it("preserves the supplied answer choices for the two explicitly checked records", () => {
    expect(manifest.questions.find((question) => question.externalId.endsWith("001"))).toMatchObject({ answerIndex: 3 });
    expect(manifest.questions.find((question) => question.externalId.endsWith("007"))).toMatchObject({ answerIndex: 3 });
  });
});
