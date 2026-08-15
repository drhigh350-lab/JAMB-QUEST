import { describe, expect, it } from "vitest";
import { didDeliverPush, getDailyReminderDecision } from "./db";

describe("daily comeback reminder eligibility", () => {
  const dateKey = "2026-08-13";

  it("suppresses a duplicate reminder already recorded for the learner’s local date", () => {
    expect(getDailyReminderDecision({ lastSentDate: dateKey, dateKey, completedMinimum: false })).toBe("already_sent");
  });

  it("marks a completed daily minimum as skipped without sending a push", () => {
    expect(getDailyReminderDecision({ lastSentDate: null, dateKey, completedMinimum: true })).toBe("minimum_completed");
  });

  it("allows an incomplete learner with no daily send record to receive one reminder", () => {
    expect(getDailyReminderDecision({ lastSentDate: "2026-08-12", dateKey, completedMinimum: false })).toBe("send");
  });

  it("reports delivery only when at least one enabled device accepts the push", () => {
    expect(didDeliverPush([])).toBe(false);
    expect(didDeliverPush([{ delivered: false }])).toBe(false);
    expect(didDeliverPush([{ delivered: false }, { delivered: true }])).toBe(true);
  });
});
