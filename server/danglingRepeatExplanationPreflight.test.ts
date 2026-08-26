import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("dangling repeat explanation preflight", () => {
  it("requires one exact same-content counterpart explanation and excludes Lekki Headmaster before any repair", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/preflightDanglingRepeatExplanationRepair.mjs"), "utf8");
    expect(script).toContain("This is a repeat of Question");
    expect(script).toContain("nonLekkiRows.filter((row) => isDangling(normalizeExplanation(row.explanation)))");
    expect(script).toContain("qi.questionText = ?");
    expect(script).toContain("qi.optionsJson = ?");
    expect(script).toContain("qi.answerIndex = ?");
    expect(script).toContain("uniqueExplanations.length === 1");
    expect(script).toContain("lekki headmaster");
    expect(script).not.toContain("UPDATE questionItems");
    expect(script).not.toContain("INSERT INTO");
  });
});
