type OneSignalApi = {
  init: (options: { appId: string; serviceWorkerPath: string; serviceWorkerParam: { scope: string } }) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout?: () => Promise<void>;
  Notifications: { requestPermission: () => Promise<void> };
  User: { PushSubscription: { optedIn: boolean; optIn: () => Promise<void> } };
};

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
          serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: "/push/onesignal/" },
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

export async function enableOneSignal(appId: string, externalId: number) {
  const oneSignal = await getOneSignal(appId);
  await oneSignal.login(String(externalId));
  await oneSignal.Notifications.requestPermission();
  // A browser permission alone can belong to the legacy VAPID worker. Explicitly
  // opt in through the OneSignal worker before treating the provider route as ready.
  await oneSignal.User.PushSubscription.optIn();
  if (!oneSignal.User.PushSubscription.optedIn) throw new Error("OneSignal did not create a subscribed Web Push device.");
}
