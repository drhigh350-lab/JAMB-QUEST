# Direct Browser-Push Delivery Receipt — August 18, 2026

JAMB Quest retired the learner-facing OneSignal route after its browser service worker repeatedly failed to evaluate on the owner’s Brave device. The app now uses the direct VAPID browser-push subscription stored by JAMB Quest itself.

| Evidence | Result |
|---|---|
| Controlled direct delivery | Accepted by the browser push service for owner user ID 1; 11 active stored subscriptions were available to the test transport. |
| Device receipt | Owner confirmed visible receipt of the controlled JAMB Quest direct push on August 18, 2026. |
| Ongoing trigger | One active managed task, `JAMB Quest direct browser reminders`. |
| Timing | `0 0 7,13,19 * * *` in `Africa/Lagos`: 7:00 a.m., 1:00 p.m., and 7:00 p.m. daily. |
| Endpoint | Cron-only `POST /api/scheduled/direct-browser-reminder`, which maps the three UTC moments to the appropriate Lagos reminder copy and bypasses OneSignal completely. |
| Schedule lifetime | Active through August 18, 2030. |

The daily job preserves the existing safety rules: no more than one reminder per learner per window per Lagos date, no reminder after the learner completes the day’s minimum, and a stale/invalid VAPID endpoint is disabled on a 404 or 410 response.
