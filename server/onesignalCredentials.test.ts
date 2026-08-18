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
    const payload = await response.json() as { id?: string; chrome_web_origin?: string | null; site_name?: string | null };
    expect(payload.id).toBe(appId);
    expect(payload.chrome_web_origin).toBe("https://jambquiz-kmqgtf9m.manus.space");
    expect(payload.site_name).toBe("JAMB Quest");
  }, 15_000);
});

export {};
