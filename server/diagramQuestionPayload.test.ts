import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("instructional diagram question payload", () => {
  it("keeps diagram URLs optional and renders them only when attached to a question", () => {
    const types = readFileSync(resolve(import.meta.dirname, "../client/src/game/types.ts"), "utf8");
    const card = readFileSync(resolve(import.meta.dirname, "../client/src/components/QuestionCard.tsx"), "utf8");
    const db = readFileSync(resolve(import.meta.dirname, "db.ts"), "utf8");
    expect(types).toContain("diagram_url?: string");
    expect(card).toContain("question.diagram_url");
    expect(card).toContain("question-diagram");
    expect(db).toContain("diagram_url: row.diagramUrl");
    const styles = readFileSync(resolve(import.meta.dirname, "../client/src/index.css"), "utf8");
    expect(styles).toContain(".question-diagram");
    expect(styles).toContain(".question-diagram figcaption");
    expect(styles).toContain("max-height: min(52vh, 440px)");
    expect(styles).not.toContain(".question-diagram img { display: block; width: 100%; height: auto; aspect-ratio: 1");
  });

  it("keeps a fixture-only route for every audited diagram shape and the no-diagram fallback", () => {
    const fixture = readFileSync(resolve(import.meta.dirname, "../client/src/e2e/DiagramRenderingFixture.tsx"), "utf8");
    const main = readFileSync(resolve(import.meta.dirname, "../client/src/main.tsx"), "utf8");
    const card = readFileSync(resolve(import.meta.dirname, "../client/src/components/QuestionCard.tsx"), "utf8");
    for (const variant of ["svg", "source", "sourceGraph", "thermoregulation", "beak", "vertebra", "broken", "wide", "portrait", "none"]) expect(fixture).toContain(`${variant}:`);
    expect(fixture).toContain("owner-phy-diagram-2026-008-source-panel_acaa185f.png");
    expect(fixture).toContain("jamb-quest-potometer_0ff84706.svg");
    expect(fixture).toContain("chemistry-energy-profile-original_3e1f7670.png");
    expect(fixture).toContain("jamb-quest-biology-digestive-system_e222260a.png");
    expect(fixture).toContain("biology-0396-schoolngr-source-panel_658f04ef.png");
    expect(fixture).toContain("biology-0518-myschool-original_32575fb8.png");
    expect(fixture).toContain("biology-1102-myschool-source-panel_41a60dd5.png");
    expect(fixture).toContain("biology-1020-quizzerweb-original_595264ba.webp");
    expect(card).toContain("onError={() => setDiagramFailed(true)}");
    expect(card).toContain("Diagram unavailable.");
    expect(main).toContain("e2eDiagramFixture");
    expect(main).toContain("<DiagramRenderingFixture variant={diagramFixtureVariant} />");
  });
});
