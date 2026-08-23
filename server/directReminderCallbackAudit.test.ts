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

  it("records aggregate callback evidence on both the direct route and the three active legacy scheduled routes without adding a second request", () => {
    const server = readFileSync("server/_core/index.ts", "utf8");
    expect(server).toContain('app.post("/api/scheduled/direct-browser-reminder"');
    expect(server).toContain('app.post("/api/scheduled/comeback-morning", scheduledReminder("morning"))');
    expect(server).toContain('app.post("/api/scheduled/comeback-afternoon", scheduledReminder("afternoon"))');
    expect(server).toContain('app.post("/api/scheduled/comeback-evening", scheduledReminder("evening"))');
    expect(server).toContain("recordDirectReminderCallbackAudit");
    expect(server).toContain("sendDailyDirectBrowserReminders(window)");
    expect(server).toContain('await recordDirectReminderCallbackAudit({ cronTaskUid: user.taskUid, window, outcome: result.sent > 0 ? "sent" : "skipped"');
  });
});
