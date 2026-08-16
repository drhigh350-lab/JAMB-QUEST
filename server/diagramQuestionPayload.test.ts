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
    expect(db).toContain("diagram_url: row.diagramUrl");
  });
});
