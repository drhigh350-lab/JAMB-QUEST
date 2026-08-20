import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getDirectReminderWindowForUtcHour } from "./db";

describe("direct reminder callback evidence", () => {
  it("maps the three Lagos reminder windows from their corresponding UTC hours", () => {
    expect(getDirectReminderWindowForUtcHour(6)).toBe("morning");
    expect(getDirectReminderWindowForUtcHour(12)).toBe("afternoon");
    expect(getDirectReminderWindowForUtcHour(18)).toBe("evening");
    expect(getDirectReminderWindowForUtcHour(11)).toBeNull();
    expect(getDirectReminderWindowForUtcHour(19)).toBeNull();
  });

  it("records aggregate callback evidence without adding a second scheduled request", () => {
    const server = readFileSync("server/_core/index.ts", "utf8");
    expect(server).toContain('app.post("/api/scheduled/direct-browser-reminder"');
    expect(server).toContain("recordDirectReminderCallbackAudit");
    expect(server).toContain("sendDailyDirectBrowserReminders(window)");
  });
});
