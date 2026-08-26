import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Tutor Dave option-D leak preflight", () => {
  it("requires an exact four-option parser signature and stored-key match without updating data", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/preflightTutorDaveOptionDLeakRepair.mjs"), "utf8");
    expect(script).toContain("sourceIds = [420003, 420004]");
    expect(script).toContain("Correct Answer:");
    expect(script).toContain("Explanation:");
    expect(script).toContain("(?:\\s+©[\\s\\S]*?)?");
    expect(script).toContain("leakedAnswerLetter === expectedLetter");
    expect(script).toContain("options.length === 4");
    expect(script).toContain("protectedSnapshot");
    expect(script).not.toContain("UPDATE questionItems");
    expect(script).not.toContain("INSERT INTO");
    expect(script).not.toContain("DELETE FROM");
  });
});
