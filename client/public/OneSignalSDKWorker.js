/* OneSignal must load first; the JAMB Quest PWA behavior is then added at root scope.
 * This follows the provider's documented combined-worker ordering. */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
importScripts("/sw.js?onesignalRootWorker=1");
