import { and, eq, sql } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb, getPlayableAuthorisedQuestions } from "../server/db";

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const [counts] = await db.select({ activeAuthorised: sql<number>`count(*)` })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1)));
const [approved] = await db.select({ approved: sql<number>`count(*)` })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "approved")));
const playable = await getPlayableAuthorisedQuestions();
if (playable.length !== Number(approved.approved)) throw new Error(`Playable ${playable.length} does not match approved ${approved.approved}`);
console.log(JSON.stringify({ verified: true, activeAuthorised: Number(counts.activeAuthorised), approvedForGameplay: Number(approved.approved), playableReturned: playable.length, heldForReview: Number(counts.activeAuthorised) - Number(approved.approved) }, null, 2));
process.exit(0);
