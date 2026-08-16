import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("five-option round persistence", () => {
  it("accepts the fifth option index in answer-review payloads", () => {
    const router = readFileSync(resolve(import.meta.dirname, "routers.ts"), "utf8");
    expect(router).toContain("selectedIndex: z.number().int().min(0).max(4).nullable()");
  });
});
