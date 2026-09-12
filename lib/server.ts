import { headers } from "next/headers";

/**
 * Gets the base URL for the application
 */
export async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost:3000";
  return `${protocol}://${host}`;
}

/**
 * Gets user info from request (if using authentication)
 */
export async function getUserFromHeaders() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  return userId ? { id: userId } : null;
}
