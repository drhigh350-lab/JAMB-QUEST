import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("CBT Exam Safety Net", () => {
  it("persists active CBT changes immediately and protects back, reload, and explicit exit", () => {
    const game = readFileSync("client/src/game/useQuizGame.ts", "utf8");
    expect(game).toContain("const persistActiveCbt");
    expect(game).toContain("persistActiveCbt({ answers: next })");
    expect(game).toContain("persistActiveCbt({ currentIndex: index })");
    expect(game).toContain("persistActiveCbt({ flaggedIds: next })");
    expect(game).toContain("persistActiveCbt({ isPaused: next })");
    const app = readFileSync("client/src/App.tsx", "utf8");
    expect(app).toContain('window.addEventListener("beforeunload", protectExit)');
    expect(app).toContain('window.addEventListener("popstate", protectBack)');
    expect(app).not.toContain("window.location.reload()");
    const worker = readFileSync("client/public/sw.js", "utf8");
    expect(worker).toContain('"jamb-quest-shell-v8"');
    expect(worker).not.toContain('then(() => self.skipWaiting())');
    expect(worker).not.toContain("client.navigate(client.url)");
    const shell = readFileSync("client/src/components/QuizShell.tsx", "utf8");
    expect(shell).toContain("Leave this CBT?");
    expect(shell).toContain("Save and exit");
    expect(shell).toContain("Continue exam");
  });
});
