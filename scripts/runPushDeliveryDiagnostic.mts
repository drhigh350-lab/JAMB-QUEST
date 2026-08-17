import { ENV } from "../server/_core/env";
import { getUserByOpenId, sendLearnerTestPush } from "../server/db";

const owner = await getUserByOpenId(ENV.ownerOpenId);
if (!owner) throw new Error("The JAMB Quest owner account was not found");

const result = await sendLearnerTestPush(owner.id);
console.log(JSON.stringify({ userId: owner.id, ...result }, null, 2));
