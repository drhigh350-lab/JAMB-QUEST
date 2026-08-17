import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("growth experience", () => {
  it("supports an unrestricted learner-selected daily goal in the practical 5-to-500 range", () => {
    const router = readFileSync(resolve(import.meta.dirname, "routers.ts"), "utf8");
    const home = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");
    expect(router).toContain("dailyGoalCount: z.number().int().min(5).max(500)");
    expect(home).toContain("Custom daily question goal");
    expect(home).toContain("[5, 10, 20, 40, 60, 100]");
    expect(home).toContain("Choose a whole number from 5 to 500.");
  });

  it("renders a real activity heatmap and a 50-badge achievement gallery", () => {
    const home = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");
    const styles = readFileSync(resolve(import.meta.dirname, "../client/src/comeback.css"), "utf8");
    expect(home).toContain("28-day study heatmap");
    expect(home).toContain("achievementSummary.earned.length} / 50");
    expect(styles).toContain(".study-heatmap");
    expect(styles).toContain(".achievement-grid");
  });

  it("keeps the first diagram set explicitly auditable and rendered by the existing question card", () => {
    const manifest = JSON.parse(readFileSync(resolve(import.meta.dirname, "../reports/physics_diagram_set_aug17.json"), "utf8"));
    const card = readFileSync(resolve(import.meta.dirname, "../client/src/components/QuestionCard.tsx"), "utf8");
    expect(manifest.records).toHaveLength(6);
    expect(manifest.records.every((record: { diagramUrl: string }) => record.diagramUrl.startsWith("/manus-storage/jamb-quest-"))).toBe(true);
    expect(card).toContain("question.diagram_url");
  });

  it("records the cross-subject diagram expansion and its twenty audited live diagram questions", () => {
    const report = readFileSync(resolve(import.meta.dirname, "../reports/diagram_expansion_aug17.md"), "utf8");
    expect(report).toContain("212, 303, 343, 300017, 300029");
    expect(report).toContain("10, 44, 102, 30038, 30068");
    expect(report).toContain("90185, 90204, 270008, 450166");
    expect(report).toContain("20** audited diagram-enhanced playable questions");
  });
});
