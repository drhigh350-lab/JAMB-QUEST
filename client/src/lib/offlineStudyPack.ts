import type { BankQuestion } from "@/game/types";

const STUDY_PACK_CACHE = "jamb-quest-study-pack-v7";
const STUDY_PACK_DATA_URL = "/__jamb-quest__/offline-study-pack-v7.json";
const STUDY_PACK_META_URL = "/__jamb-quest__/offline-study-pack-v7.meta.json";

export type OfflineStudyPackInfo = {
  savedAt: number;
  questionCount: number;
  visualCount: number;
  persistentStorage: boolean;
};

export type OfflineStudyPackSnapshot = {
  info: OfflineStudyPackInfo | null;
  questions: BankQuestion[];
};

function supportsOfflinePack() {
  return typeof window !== "undefined" && "caches" in window;
}

function isSafeVisualUrl(url: string) {
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

export async function loadOfflineStudyPack(): Promise<OfflineStudyPackSnapshot> {
  if (!supportsOfflinePack()) return { info: null, questions: [] };
  const cache = await caches.open(STUDY_PACK_CACHE);
  const [dataResponse, metaResponse] = await Promise.all([
    cache.match(STUDY_PACK_DATA_URL),
    cache.match(STUDY_PACK_META_URL),
  ]);
  if (!dataResponse || !metaResponse) return { info: null, questions: [] };
  try {
    const [questions, info] = await Promise.all([
      dataResponse.json() as Promise<BankQuestion[]>,
      metaResponse.json() as Promise<OfflineStudyPackInfo>,
    ]);
    return Array.isArray(questions) && typeof info?.questionCount === "number" ? { questions, info } : { info: null, questions: [] };
  } catch {
    return { info: null, questions: [] };
  }
}

export async function downloadOfflineStudyPack(questions: BankQuestion[]): Promise<OfflineStudyPackInfo> {
  if (!supportsOfflinePack()) throw new Error("This browser cannot save an offline study pack.");
  if (!questions.length) throw new Error("The online question bank is not ready to download yet.");
  const cache = await caches.open(STUDY_PACK_CACHE);
  const visualUrls = Array.from(new Set(questions.map((question) => question.diagram_url).filter((url): url is string => Boolean(url && isSafeVisualUrl(url)))));
  let visualCount = 0;

  for (const url of visualUrls) {
    try {
      const response = await fetch(url, { cache: "reload" });
      if (!response.ok) continue;
      await cache.put(url, response.clone());
      visualCount += 1;
    } catch {
      // The question itself remains available; a temporarily unavailable visual is not treated as a completed asset.
    }
  }

  let persistentStorage = false;
  try {
    persistentStorage = await navigator.storage?.persist?.() ?? false;
  } catch {
    persistentStorage = false;
  }
  const info: OfflineStudyPackInfo = { savedAt: Date.now(), questionCount: questions.length, visualCount, persistentStorage };
  await Promise.all([
    cache.put(STUDY_PACK_DATA_URL, new Response(JSON.stringify(questions), { headers: { "Content-Type": "application/json" } })),
    cache.put(STUDY_PACK_META_URL, new Response(JSON.stringify(info), { headers: { "Content-Type": "application/json" } })),
  ]);
  return info;
}

export async function clearOfflineStudyPack() {
  if (!supportsOfflinePack()) return;
  await caches.delete(STUDY_PACK_CACHE);
}
