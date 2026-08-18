/* Root compatibility entry point required by the provider's current Web settings.
 * It deliberately imports the JAMB Quest root worker, which already imports the
 * OneSignal worker and retains PWA cache, push, and notification-click behavior.
 */
importScripts("/sw.js");
