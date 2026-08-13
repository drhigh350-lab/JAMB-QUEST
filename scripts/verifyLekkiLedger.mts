import { eq } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const label = "The Lekki Headmaster — DailyEd Likely UTME Questions · Verification Pending";
const [source] = await db.select().from(questionSources).where(eq(questionSources.label, label)).limit(1);
if (!source) throw new Error("Lekki Headmaster source ledger entry missing");
const items = await db.select().from(questionItems).where(eq(questionItems.sourceId, source.id));
const ids = items.map((item) => item.externalId);
const uniqueIds = new Set(ids);
const badLearnerLabels = items.filter((item) => item.questionText.includes("Verification Pending") || item.questionText.includes("DailyEd"));
if (items.length !== 126) throw new Error(`Expected 126 imported items, found ${items.length}`);
if (uniqueIds.size !== items.length) throw new Error("Duplicate Lekki Headmaster external IDs found");
if (source.sourceType !== "authorised") throw new Error(`Unexpected source type ${source.sourceType}`);
if (badLearnerLabels.length) throw new Error("Internal provenance leaked into learner question text");
console.log(JSON.stringify({ verified: true, sourceId: source.id, sourceLabel: source.label, sourceType: source.sourceType, questionCount: items.length, uniqueExternalIds: uniqueIds.size, sample: items.slice(0, 2).map((item) => ({ externalId: item.externalId, topic: item.topic, explanation: item.explanation })) }, null, 2));
