import { describe, expect, it } from "vitest";

describe("OneSignal production credentials", () => {
  it("authenticates against the app metadata endpoint when configured", async () => {
    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_APP_API_KEY;
    if (!appId || !apiKey) return;

    const response = await fetch(`https://api.onesignal.com/apps/${encodeURIComponent(appId)}`, {
      headers: { Authorization: `Key ${apiKey}` },
    });

    expect(response.status).toBe(200);
    const payload = await response.json() as { id?: string };
    expect(payload.id).toBe(appId);
  }, 15_000);
});

export {};
