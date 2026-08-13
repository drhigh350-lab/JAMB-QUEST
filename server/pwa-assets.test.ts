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
      expect.objectContaining({ sizes: "192x192", type: "image/png" }),
      expect.objectContaining({ sizes: "512x512", type: "image/png" }),
      expect.objectContaining({ purpose: "maskable" }),
    ]));
  });

  it("keeps offline cache behavior and push notification behavior in one worker", () => {
    const worker = readFileSync(resolve(publicDirectory, "sw.js"), "utf8");

    expect(worker).toContain('self.addEventListener("install"');
    expect(worker).toContain('self.addEventListener("fetch"');
    expect(worker).toContain('self.addEventListener("push"');
    expect(worker).toContain('self.addEventListener("notificationclick"');
    expect(worker).toContain('self.addEventListener("message"');
    expect(worker).toContain('"SKIP_WAITING"');
    expect(worker).toContain('const APP_SHELL = ["/", "/manifest.webmanifest", "/favicon.svg"]');
  });
});
