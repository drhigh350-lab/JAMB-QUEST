const OPENING_SESSION_KEY = "jamb-quest-opening-complete-v1";

type SessionStore = Pick<Storage, "getItem" | "setItem">;

export function shouldShowQuestOpening(search: string, store?: SessionStore): boolean {
  if (new URLSearchParams(search).get("skipOpening") === "1") return false;
  try {
    const sessionStore = store ?? window.sessionStorage;
    return sessionStore.getItem(OPENING_SESSION_KEY) !== "1";
  } catch {
    // Private or restricted storage should not block the opening experience.
    return true;
  }
}

export function markQuestOpeningComplete(store?: SessionStore): void {
  try {
    const sessionStore = store ?? window.sessionStorage;
    sessionStore.setItem(OPENING_SESSION_KEY, "1");
  } catch {
    // The app remains usable even when session storage is unavailable.
  }
}
