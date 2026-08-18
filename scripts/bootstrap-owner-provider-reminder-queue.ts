import { eq } from "drizzle-orm";
import { getDb, refreshProviderScheduledReminders } from "../server/db";
import { users } from "../drizzle/schema";

const db = await getDb();
const ownerOpenId = process.env.OWNER_OPEN_ID;

if (!db || !ownerOpenId) {
  throw new Error("Owner reminder bootstrap requires the configured database and owner identity.");
}

const [owner] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.openId, ownerOpenId)).limit(1);
if (!owner) throw new Error("The configured owner does not have a JAMB Quest user record.");

const dashboard = await refreshProviderScheduledReminders(owner.id, owner.name ?? null);
console.log(JSON.stringify({
  userId: owner.id,
  scheduledCount: dashboard.reminder.providerQueue.scheduledCount,
  nextScheduledAt: dashboard.reminder.providerQueue.nextScheduledAt?.toISOString() ?? null,
  horizonDays: dashboard.reminder.providerQueue.horizonDays,
}, null, 2));

process.exit(0);
