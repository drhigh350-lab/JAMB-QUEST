import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(readFileSync("reports/final_biology_diagram_questions_aug17.json", "utf8")) as {
  questions: Array<{ externalId: string; subject: string; options: string[]; answerIndex: number; explanation: string; topic: string; diagramUrl: string }>;
  duplicateAnswerKeyEntriesHeld: number[];
};

describe("final owner Biology diagram questions · August 2026", () => {
  it("contains thirteen unique keyed four-option questions with concise explanations and deployed visuals", () => {
    expect(manifest.questions).toHaveLength(13);
    expect(new Set(manifest.questions.map((question) => question.externalId)).size).toBe(13);
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

  it("records the two repeated answer-key entries as held rather than duplicating gameplay records", () => {
    expect(manifest.duplicateAnswerKeyEntriesHeld).toEqual([14, 15]);
  });
});
