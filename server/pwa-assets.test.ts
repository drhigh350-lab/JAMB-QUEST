import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const publicDirectory = resolve(import.meta.dirname, "../client/public");

describe("JAMB Quest PWA assets", () => {
  it("declares an installable standalone app with an icon", () => {
    const manifest = JSON.parse(readFileSync(resolve(publicDirectory, "manifest.webmanifest"), "utf8")) as {
      name: string;
      short_name: string;
      display: string;
      start_url: string;
      icons: Array<{ src: string }>;
    };

    expect(manifest.name).toContain("JAMB Quest");
    expect(manifest.short_name).toBe("JAMB Quest");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192", type: "image/png", src: expect.stringContaining("jamb-quest-final-app-cover-192") }),
      expect.objectContaining({ sizes: "512x512", type: "image/png", src: expect.stringContaining("jamb-quest-final-app-cover-512") }),
      expect.objectContaining({ purpose: "maskable", src: expect.stringContaining("jamb-quest-final-app-cover") }),
    ]));
  });

  it("keeps offline cache behavior and push notification behavior in one worker", () => {
    const worker = readFileSync(resolve(publicDirectory, "sw.js"), "utf8");
    expect(worker).not.toContain("OneSignalSDK.sw.js");
    expect(worker).toContain('self.addEventListener("install"');
    expect(worker).toContain('self.addEventListener("fetch"');
    expect(worker).toContain('self.addEventListener("push"');
    expect(worker).toContain('self.addEventListener("notificationclick"');
    expect(worker).toContain('self.addEventListener("message"');
    expect(worker).toContain('"SKIP_WAITING"');
    expect(worker).toContain('const APP_SHELL = ["/", "/manifest.webmanifest", "/favicon.svg", "/manus-storage/jamb-quest-final-app-cover-192_7f5f7f7b.png"]');
  });

  it("requests a prominent scheduled reminder and upgrades its active worker cache", () => {
    const worker = readFileSync(resolve(publicDirectory, "sw.js"), "utf8");

    expect(worker).toContain('"jamb-quest-shell-v9"');
    expect(worker).toContain('icon: "/manus-storage/jamb-quest-final-app-cover-192_7f5f7f7b.png"');
    expect(worker).toContain('fetch(request, { cache: "no-store" })');
    const app = readFileSync(resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");
    expect(app).toContain('updateViaCache: "none"');
    expect(worker).toContain("try {");
    expect(worker).toContain("payload = {};");
    expect(worker).toContain('tag: "jamb-quest-daily-reminder"');
    expect(worker).toContain("renotify: true");
    expect(worker).toContain("requireInteraction: true");
    expect(worker).toContain("vibrate: [200, 100, 200]");
    const serverEntry = readFileSync(resolve(import.meta.dirname, "_core/index.ts"), "utf8");
    expect(serverEntry).toContain('app.post("/api/scheduled/direct-browser-reminder"');
    expect(serverEntry).toContain("sendDailyDirectBrowserReminders(window)");

    const liveLagosCallback = serverEntry.split("const scheduledReminder")[1]?.split('app.post("/api/scheduled/comeback-morning"')[0] ?? "";
    expect(liveLagosCallback).toContain("sendDailyDirectBrowserReminders(window)");
    expect(liveLagosCallback).not.toContain("sendDailyComebackReminders(window)");
  });
});
