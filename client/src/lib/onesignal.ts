type OneSignalApi = {
  init: (options: { appId: string; serviceWorkerPath: string; serviceWorkerParam: { scope: string } }) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout?: () => Promise<void>;
  Notifications: { requestPermission: () => Promise<void> };
  User: { onesignalId?: string | null; externalId?: string | null; PushSubscription: { id?: string | null; optedIn: boolean; optIn: () => Promise<void> } };
};

export type OneSignalDiagnostic = { sdkReady: boolean; permission: NotificationPermission | "unsupported"; externalId: string | null; oneSignalId: string | null; subscriptionId: string | null; optedIn: boolean; error: string | null };

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalApi) => void | Promise<void>>;
  }
}

let sdkPromise: Promise<OneSignalApi> | null = null;

export function getOneSignal(appId: string) {
  if (typeof window === "undefined") return Promise.reject(new Error("OneSignal requires a browser"));
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<OneSignalApi>((resolve, reject) => {
    const deferred = window.OneSignalDeferred ?? [];
    window.OneSignalDeferred = deferred;
    deferred.push(async (oneSignal) => {
      try {
        await oneSignal.init({
          appId,
          serviceWorkerPath: "OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: "/" },
        });
        resolve(oneSignal);
      } catch (error) {
        reject(error);
      }
    });
    if (!document.querySelector('script[data-jamb-quest-onesignal="true"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      script.dataset.jambQuestOnesignal = "true";
      script.onerror = () => reject(new Error("OneSignal SDK failed to load"));
      document.head.appendChild(script);
    }
  });
  return sdkPromise;
}

function snapshot(oneSignal: OneSignalApi, error: string | null = null): OneSignalDiagnostic {
  return { sdkReady: true, permission: typeof Notification === "undefined" ? "unsupported" : Notification.permission, externalId: oneSignal.User.externalId ?? null, oneSignalId: oneSignal.User.onesignalId ?? null, subscriptionId: oneSignal.User.PushSubscription.id ?? null, optedIn: Boolean(oneSignal.User.PushSubscription.optedIn), error };
}

export async function inspectOneSignal(appId: string, externalId?: number): Promise<OneSignalDiagnostic> {
  const permission = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
  try {
    const oneSignal = await getOneSignal(appId);
    if (externalId !== undefined) await oneSignal.login(String(externalId));
    return snapshot(oneSignal);
  } catch (error) {
    return { sdkReady: false, permission, externalId: externalId === undefined ? null : String(externalId), oneSignalId: null, subscriptionId: null, optedIn: false, error: error instanceof Error ? error.message : "OneSignal SDK initialization failed" };
  }
}

export async function enableOneSignal(appId: string, externalId: number): Promise<OneSignalDiagnostic> {
  const oneSignal = await getOneSignal(appId);
  await oneSignal.login(String(externalId));
  if (typeof Notification !== "undefined" && Notification.permission !== "granted") await oneSignal.Notifications.requestPermission();
  // A browser permission alone can belong to the legacy VAPID worker. Explicitly
  // opt in through the OneSignal worker before treating the provider route as ready.
  await oneSignal.User.PushSubscription.optIn();
  const diagnostic = snapshot(oneSignal);
  if (!diagnostic.optedIn || !diagnostic.subscriptionId) diagnostic.error = "OneSignal did not create a provider Web Push subscription for this browser.";
  return diagnostic;
}
