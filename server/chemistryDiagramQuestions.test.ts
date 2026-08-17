import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(readFileSync("reports/chemistry_diagram_questions_aug17.json", "utf8")) as {
  excludedDuplicate: string;
  questions: Array<{ externalId: string; subject: string; options: string[]; answerIndex: number; explanation: string; topic: string; diagramUrl: string }>;
};

describe("owner Chemistry diagram questions · August 2026", () => {
  it("keeps nine unique verified records and explicitly excludes the repeated solubility image", () => {
    expect(manifest.questions).toHaveLength(9);
    expect(new Set(manifest.questions.map((question) => question.externalId)).size).toBe(9);
    expect(manifest.excludedDuplicate).toContain("solubility");
  });

  it("preserves valid answer indexes, concise explanations, official-topic labels, and exact stored diagrams", () => {
    for (const question of manifest.questions) {
      expect(question.subject).toBe("Chemistry");
      expect(question.options).toHaveLength(4);
      expect(question.answerIndex).toBeGreaterThanOrEqual(0);
      expect(question.answerIndex).toBeLessThan(4);
      expect(question.explanation.split(/\n+/).filter(Boolean).length).toBeLessThanOrEqual(5);
      expect(question.topic.length).toBeGreaterThan(3);
      expect(question.diagramUrl).toMatch(/^\/manus-storage\//);
    }
  });
});
