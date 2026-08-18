import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("direct browser-push enrollment", () => {
  it("uses a VAPID subscription and does not make OneSignal a requirement for learner reminders", () => {
    const app = readFileSync("client/src/App.tsx", "utf8");
    expect(app).toContain('navigator.serviceWorker.register("/sw.js")');
    expect(app).toContain("registration.pushManager.subscribe");
    expect(app).toContain("await enablePush.mutateAsync");
    expect(app).toContain("await updateReminder.mutateAsync({ enabled: true })");
    expect(app).not.toContain("enableOneSignal(");
    expect(app).not.toContain("confirmProviderEnrollment.mutateAsync()");
    const profile = readFileSync("client/src/pages/Home.tsx", "utf8");
    expect(profile).toContain("JAMB Quest sends browser reminders directly to this device");
    expect(profile).toContain("Direct browser reminders ready");
    expect(profile).not.toContain("Retry OneSignal setup");
  });
});
