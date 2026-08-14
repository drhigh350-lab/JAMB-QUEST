import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { QuestionCard } from "../client/src/components/QuestionCard";
import { getDb } from "../server/db";
import { questionItems, questionSources } from "../drizzle/schema";

describe("Lekki Headmaster imported record", () => {
  it("keeps inactive verification-pending provenance while using the shared learner card", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [source] = await db.select().from(questionSources).where(eq(questionSources.label, "The Lekki Headmaster — DailyEd Likely UTME Questions · Verification Pending")).limit(1);
    expect(source?.sourceType).toBe("authorised");
    expect(source?.isActive).toBe(0);
    const [item] = await db.select().from(questionItems).where(eq(questionItems.sourceId, source.id)).limit(1);
    expect(item?.externalId).toMatch(/^LEKKI-/);
    const question = { id: item.externalId, subject: item.subject, topic: item.topic, question: item.questionText, options: JSON.parse(item.optionsJson), answer_index: item.answerIndex, explanation: item.explanation ?? "" };
    const html = renderToStaticMarkup(React.createElement(QuestionCard, { question, index: 0, total: 10, selectedIndex: 0, answered: true, answer: { selectedIndex: 0, correct: true, timedOut: false }, onSelect: () => {}, onSubmit: () => {}, onNext: () => {} }));
    expect(html).toContain("Topic: The Lekki Headmaster");
    expect(html).not.toContain("DailyEd");
    expect(html).not.toContain("Verification Pending");
    expect((html.match(/class=\"explanation-block\"[^>]*>[\s\S]*?<\/div>/)?.[0].match(/<p>/g) ?? []).length).toBe(1);
  });
});
