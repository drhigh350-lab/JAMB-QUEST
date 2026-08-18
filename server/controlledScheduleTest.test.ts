import { describe, expect, it } from "vitest";
import { CONTROLLED_SCHEDULE_TEST_COPY } from "./db";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("controlled scheduled reminder test", () => {
  it("uses clear test copy and a Profile destination without impersonating a permanent reminder window", () => {
    expect(CONTROLLED_SCHEDULE_TEST_COPY.title).toContain("scheduled reminder test");
    expect(CONTROLLED_SCHEDULE_TEST_COPY.body).toContain("8:30 a.m.");
    expect(CONTROLLED_SCHEDULE_TEST_COPY.url).toBe("/?tab=profile");
  });

  it("mounts a cron-only test callback distinct from the permanent reminder callbacks", () => {
    const source = readFileSync(resolve(process.cwd(), "server/_core/index.ts"), "utf8");
    expect(source).toContain('app.post("/api/scheduled/comeback-controlled-test"');
    expect(source).toContain("sendControlledScheduleTest()");
  });
});
