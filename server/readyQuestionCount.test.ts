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
  examHistory: [],
  weakTopics: [],
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
    const html = renderToStaticMarkup(React.createElement(Home, { ...baseProps, questionCount: 1975, questionCountReady: true }));
    expect(html).toContain('data-testid="ready-question-count"');
    expect(html).toContain('data-ready="true"');
    expect(html).toContain("JAMB Quest ready");
    expect(html).toContain("1,975");
    expect(html).toContain("practice questions");
    expect(html).not.toContain("1,975 practice questions");
  });

  it("marks the count as unsettled while the authorised-question query is still loading", () => {
    const html = renderToStaticMarkup(React.createElement(Home, { ...baseProps, questionCount: 1000, questionCountReady: false }));
    expect(html).toContain('data-ready="false"');
    expect(html).toContain("Preparing JAMB Quest");
    expect(html).not.toContain("1,000");
  });

  it("uses the official four-part slanted JAMB Quest mark in the top-left header", () => {
    const html = renderToStaticMarkup(React.createElement(Home, { ...baseProps, questionCount: 3118, questionCountReady: true }));
    expect(html).toContain('class="brand-symbol"');
    expect(html).toContain('<i></i><i></i><i></i><i></i>');
    expect(html).toContain('Your study system');
  });
});
