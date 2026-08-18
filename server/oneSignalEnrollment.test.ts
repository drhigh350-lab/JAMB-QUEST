import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("OneSignal recovery enrollment", () => {
  it("relinks an authenticated device that already granted notification permission without requiring a second gesture", () => {
    const app = readFileSync("client/src/App.tsx", "utf8");
    expect(app).toContain('Notification.permission !== "granted"');
    expect(app).toContain("enableOneSignal(oneSignalAppIdQuery.data, user.id)");
    expect(app).toContain("updateReminder.mutate({ enabled: true })");
  });
});
