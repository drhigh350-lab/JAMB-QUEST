import { getPinnedDailyFocus, type DailyFocus } from "../client/src/game/pinnedDailyFocus";
import { describe, expect, it } from "vitest";

function focus(label: string): DailyFocus {
  return { label, note: `${label} note`, config: { subject: "Biology", mode: "sprint", count: 20, timing: "study" } };
}

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("pinned daily focus", () => {
  it("keeps the first evidence-based priority stable for an unfinished learner day", () => {
    const storage = memoryStorage();
    const first = getPinnedDailyFocus({ learnerKey: "account-1", dateKey: "2026-08-24", completed: false, focus: focus("Repair Genetics"), storage });
    const later = getPinnedDailyFocus({ learnerKey: "account-1", dateKey: "2026-08-24", completed: false, focus: focus("Physics core practice"), storage });
    expect(first.label).toBe("Repair Genetics");
    expect(later.label).toBe("Repair Genetics");
  });

  it("allows a fresh priority after the daily goal is complete or the study date changes", () => {
    const storage = memoryStorage();
    getPinnedDailyFocus({ learnerKey: "account-1", dateKey: "2026-08-24", completed: false, focus: focus("Repair Genetics"), storage });
    expect(getPinnedDailyFocus({ learnerKey: "account-1", dateKey: "2026-08-24", completed: true, focus: focus("Physics core practice"), storage }).label).toBe("Physics core practice");
    expect(getPinnedDailyFocus({ learnerKey: "account-1", dateKey: "2026-08-25", completed: false, focus: focus("Chemistry core practice"), storage }).label).toBe("Chemistry core practice");
  });
});
