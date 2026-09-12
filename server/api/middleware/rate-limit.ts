import { NextRequest } from "next/server";

/**
 * Rate limiting configuration
 */
const REQUESTS_PER_MINUTE = 60;
const requestCounts = new Map<string, number[]>();

export function checkRateLimit(req: NextRequest): boolean {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const requests = requestCounts.get(ip)!;
  const recentRequests = requests.filter((time) => time > oneMinuteAgo);

  if (recentRequests.length >= REQUESTS_PER_MINUTE) {
    return false;
  }

  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);
  return true;
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  for (const [ip, requests] of requestCounts.entries()) {
    const recent = requests.filter((time) => time > fiveMinutesAgo);
    if (recent.length === 0) {
      requestCounts.delete(ip);
    } else {
      requestCounts.set(ip, recent);
    }
  }
}, 5 * 60 * 1000);
