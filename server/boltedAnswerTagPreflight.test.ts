import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("bolted answer-tag preflight", () => {
  it("requires a substantive body and a terminal tag that exactly restates the stored keyed option", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/preflightBoltedAnswerTagRepair.mjs"), "utf8");
    expect(script).toContain("Correct answer|Answer");
    expect(script).toContain("tagAnswer.toLowerCase() === expectedAnswer.toLowerCase()");
    expect(script).toContain("exactKeyRestatement");
    expect(script).toContain("^([A-E])\\s*\\(\\s*(.+?)\\s*\\)$");
    expect(script).toContain("body.split(/\\s+/).length >= 8");
    expect(script).toContain("lekki headmaster");
    expect(script).not.toContain("UPDATE questionItems");
    expect(script).not.toContain("INSERT INTO");
  });
});
