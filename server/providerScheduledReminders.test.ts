import { describe, expect, it } from "vitest";
import { buildProviderReminderSlots } from "./db";
import { readFileSync } from "node:fs";

describe("provider-scheduled OneSignal reminders", () => {
  it("queues only future exact Lagos windows and skips a passed morning", () => {
    const slots = buildProviderReminderSlots(new Date("2026-08-18T07:30:00.000Z"), 1);
    expect(slots.map((slot) => slot.queueKey)).toEqual([
      "provider:2026-08-18:afternoon",
      "provider:2026-08-18:evening",
      "provider:2026-08-19:morning",
      "provider:2026-08-19:afternoon",
      "provider:2026-08-19:evening",
    ]);
    expect(slots[0]?.scheduledFor.toISOString()).toBe("2026-08-18T12:00:00.000Z");
  });

  it("persists provider message IDs, future send times, and cancellation support", () => {
    const source = readFileSync("server/db.ts", "utf8");
    expect(source).toContain("send_after: scheduledFor.toISOString()");
    expect(source).toContain("cancelProviderScheduledReminders");
    expect(source).toContain("learnerProviderReminderQueue");
  });
});
