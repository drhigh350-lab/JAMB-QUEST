import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home from "../client/src/pages/Home";

const baseProps = {
  loading: false,
  loadError: null,
  progress: { totalAnswered: 0, totalCorrect: 0, bestScore: 0, roundsPlayed: 0, wrongQuestionIds: [], subjectBest: { "Use of English": 0, Biology: 0, Chemistry: 0, Physics: 0 } },
  canReview: false,
  onRetryLoad: vi.fn(),
  onStart: vi.fn(),
  questionSources: [],
  auth: { loading: false, isAuthenticated: false, profileName: "Learner", targetScore: 380, onLogout: vi.fn(), onSaveProfile: vi.fn(), savingProfile: false },
  onUpdateDailyMinimum: vi.fn(),
  onEnablePush: vi.fn(),
  onDisablePush: vi.fn(),
  pushWorking: false,
  pushStatus: "idle" as const,
  pwa: { isOnline: true, canInstall: false, installStatus: "idle" as const, onInstall: vi.fn() },
};

describe("ready question count", () => {
  it("renders the settled approved-only total through a stable ready-count hook", () => {
    const html = renderToStaticMarkup(React.createElement(Home, { ...baseProps, questionCount: 1046, questionCountReady: true }));
    expect(html).toContain('data-testid="ready-question-count"');
    expect(html).toContain('data-ready="true"');
    expect(html).toContain("1,046 questions ready");
  });

  it("marks the count as unsettled while the authorised-question query is still loading", () => {
    const html = renderToStaticMarkup(React.createElement(Home, { ...baseProps, questionCount: 1000, questionCountReady: false }));
    expect(html).toContain('data-ready="false"');
    expect(html).toContain("1,000 questions ready");
  });
});
