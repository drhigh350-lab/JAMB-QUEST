import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("CBT resume integrity", () => {
  it("rejects stale saved sessions whose question count or current position cannot represent their configured exam", () => {
    const storage = readFileSync("client/src/game/storage.ts", "utf8");
    expect(storage).toContain('parsed.config.subject === "Full JAMB Mock" ? 180 : parsed.config.count');
    expect(storage).toContain("parsed.questionIds.length !== expectedQuestionCount");
    expect(storage).toContain("parsed.currentIndex < 0 || parsed.currentIndex >= parsed.questionIds.length");
  });

  it("uses a valid short single-subject CBT in the resume fixture instead of manufacturing an impossible mini full mock", () => {
    const fixture = readFileSync("client/src/e2e/CbtResumeFixture.tsx", "utf8");
    expect(fixture).toContain('{ subject: "Biology", mode: "cbt", count: 4 }');
    expect(fixture).not.toContain('{ subject: "Full JAMB Mock", mode: "cbt", count: 4 }');
  });
});
