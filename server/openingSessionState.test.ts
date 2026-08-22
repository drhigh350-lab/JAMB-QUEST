import { describe, expect, it } from "vitest";
import { markQuestOpeningComplete, shouldShowQuestOpening } from "../client/src/lib/openingSessionState";

function createSessionStore() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("JAMB Quest opening-session state", () => {
  it("shows the intro for a first visit and skips it after completion during a normal refresh", () => {
    const session = createSessionStore();
    expect(shouldShowQuestOpening("", session)).toBe(true);

    markQuestOpeningComplete(session);
    expect(shouldShowQuestOpening("", session)).toBe(false);
  });

  it("keeps the explicit test skip query independent of session completion", () => {
    const session = createSessionStore();
    expect(shouldShowQuestOpening("?skipOpening=1", session)).toBe(false);
    expect(shouldShowQuestOpening("", session)).toBe(true);
  });
});
