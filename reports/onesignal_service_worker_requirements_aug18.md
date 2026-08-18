# OneSignal Service-Worker Requirements for JAMB Quest

OneSignal’s current documentation states that a PWA may host the OneSignal worker in a dedicated subdirectory such as `/push/onesignal/`, provided the SDK is initialized with the matching `serviceWorkerPath` and scope. The worker must be publicly accessible over HTTPS, served as JavaScript from the same origin, and the same path must be configured in the OneSignal Web settings when custom paths are used.

The current JAMB Quest worker is publicly available at `/push/onesignal/OneSignalSDKWorker.js` with the matching client-side path and scope. The provider still returned 404 for learner external ID `1` after the learner opened the app, so the unresolved issue is provider-side enrollment rather than the scheduled job clock: the 7:00 a.m. Heartbeat callback executed at 06:07 UTC and reported one send.

Sources: [OneSignal service worker documentation](https://documentation.onesignal.com/docs/en/onesignal-service-worker) and [OneSignal Web SDK setup](https://documentation.onesignal.com/docs/en/web-sdk-setup).

## Provider configuration diagnosis

On 18 August, the OneSignal app API returned HTTP 200 but reported `chrome_web_origin: null`, `site_name: null`, and no configured Chrome Web keys. This means the credentials belong to a OneSignal app that has not been configured as a Web push app for the JAMB Quest production origin. As a result, learner external ID `1` returned HTTP 404 after the app opening, so the provider cannot have a valid web-push subscription to target.

Official OneSignal documentation identifies the remediation: update the app’s `chrome_web_origin` to the site URL using the [Update an app API](https://documentation.onesignal.com/reference/update-an-app), or configure the Web platform in the dashboard. The web-push FAQ explicitly recommends the Update an app API when retaining the same OneSignal App ID while changing or setting the web origin: [Web push setup FAQ](https://documentation.onesignal.com/docs/en/web-push-setup-faq).
