import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("OneSignal recovery enrollment", () => {
  it("relinks an authenticated device that already granted notification permission without requiring a second gesture", () => {
    const app = readFileSync("client/src/App.tsx", "utf8");
    expect(app).toContain('Notification.permission !== "granted"');
    expect(app).toContain("enableOneSignal(oneSignalAppIdQuery.data, user.id)");
    expect(app).toContain("confirmProviderEnrollment.mutateAsync()");
    expect(app).toContain("providerEnrollmentAttempt.current === attemptKey");
    expect(app).toContain('setPushStatus("provider-pending");\n          return;');
    const providerBranch = app.slice(app.indexOf("if (oneSignalAppIdQuery.data && user?.id)"), app.indexOf("if (!pushKeyQuery.data)"));
    expect(providerBranch).toContain('setPushStatus("provider-pending");\n          return;');
    expect(providerBranch).not.toContain("enablePush.mutate");
    const adapter = readFileSync("client/src/lib/onesignal.ts", "utf8");
    expect(adapter).toContain("User.PushSubscription.optIn()");
    expect(adapter).toContain("PushSubscription.optedIn");
  });
});
