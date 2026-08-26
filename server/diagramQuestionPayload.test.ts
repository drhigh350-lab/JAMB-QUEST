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
    for (const variant of ["svg", "source", "sourceGraph", "thermoregulation", "lizardGraph", "osmosis", "fermentation", "variation", "ovary", "embryo", "beak", "vertebra", "digestive0413", "euglena0749", "beak1225", "kclo3Oxygen", "idealGas", "photosynthesis0562", "emulsification0551", "plantation0583", "aquatic0574", "digestive0552", "raptor0569", "broken", "wide", "portrait", "none"]) expect(fixture).toContain(`${variant}:`);
    expect(fixture).toContain("owner-phy-diagram-2026-008-source-panel_acaa185f.png");
    expect(fixture).toContain("jamb-quest-potometer_0ff84706.svg");
    expect(fixture).toContain("chemistry-energy-profile-original_3e1f7670.png");
    expect(fixture).toContain("jamb-quest-biology-digestive-system_e222260a.png");
    expect(fixture).toContain("biology-0396-schoolngr-source-panel_658f04ef.png");
    expect(fixture).toContain("biology-0518-myschool-original_32575fb8.png");
    expect(fixture).toContain("biology-0600-schoolngr-original_413d60ab.png");
    expect(fixture).toContain("biology-0645-myschool-original_3340a9ed.jpg");
    expect(fixture).toContain("biology-0649-myschool-original_0ce93479.jpg");
    expect(fixture).toContain("biology-0870-myschool-original_c780fc2d.jpeg");
    expect(fixture).toContain("biology-0905-schoolngr-original_705e2a37.png");
    expect(fixture).toContain("biology-1102-myschool-source-panel_41a60dd5.png");
    expect(fixture).toContain("biology-1020-quizzerweb-original_595264ba.webp");
    expect(fixture).toContain("biology-0413-schoolngr-source-only-v2_75d0867c.png");
    expect(fixture).toContain("biology-0749-schoolngr-original_64d08afe.png");
    expect(fixture).toContain("biology-1225-myschool-original_353283bf.png");
    expect(fixture).toContain("chemistry-kclo3-schoolngr-original_4374f259.png");
    expect(fixture).toContain("chemistry-ideal-gas-schoolngr-original_002271ae.png");
    expect(fixture).toContain("biology-0562-testdriller-original_301dd58c.png");
    expect(fixture).toContain("biology-0551-testdriller-original_7dc25806.png");
    expect(fixture).toContain("biology-0583-testdriller-original_99e7eb08.png");
    expect(fixture).toContain("biology-0574-testdriller-original_23e441c0.png");
    expect(fixture).toContain("biology-0552-testdriller-original_2097df8d.png");
    expect(fixture).toContain("biology-0569-testdriller-original_ec8a36e9.png");
    expect(card).toContain("onError={() => setDiagramFailed(true)}");
    expect(card).toContain("Diagram unavailable.");
    expect(main).toContain("e2eDiagramFixture");
    expect(main).toContain("<DiagramRenderingFixture variant={diagramFixtureVariant} />");
  });
});
