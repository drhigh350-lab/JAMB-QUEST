import { eq, inArray } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const externalIds = ["LEKKI-CH01-034", "LEKKI-CH01-035", "LEKKI-CH05-016", "LEKKI-CH05-017", "LEKKI-CH11-047", "LEKKI-CH13-002"];
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({
  externalId: questionItems.externalId,
  sourceLabel: questionSources.label,
  sourceActive: questionSources.isActive,
  question: questionItems.questionText,
}).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(inArray(questionItems.externalId, externalIds));
console.log(JSON.stringify(rows, null, 2));
