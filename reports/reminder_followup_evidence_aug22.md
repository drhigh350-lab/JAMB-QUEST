# Direct Browser Reminder Follow-up — 22 August 2026

## Verified schedule state

All three project-level reminder callbacks are enabled and use the direct browser callback routes. They are configured for **08:00**, **13:00**, and **21:00 Africa/Lagos** during the current test schedule: 07:00 UTC, 12:00 UTC, and 20:00 UTC respectively.

| Window | Task UID | Latest observed scheduled execution | Callback result |
| --- | --- | --- | --- |
| Morning | `me56gJTKY9rsAquZKzqZff` | 22 August 2026, 07:10 UTC | Successful HTTP callback; recent runs report a direct-browser send for the one enabled preference. |
| Afternoon | `nD2Z59WxeeWXtUx6RfV3Kd` | 22 August 2026, 12:19 UTC | Successful HTTP callback with `sent: 1`, `skipped: 0`, and `transport: direct-browser`. |
| Evening | `mRHcHM5DsSFsiSsaZ3zpTC` | 21 August 2026, 20:05 UTC | Successful HTTP callback with `sent: 1`, `skipped: 0`, and `transport: direct-browser`. |

## Interpretation and remaining evidence

The current results demonstrate that the hosted scheduled callbacks reached the JAMB Quest backend and that the VAPID provider accepted a message for the enabled subscription. They do **not** independently prove that Android presented every notification; presentation depends on the device and operating-system notification state after provider acceptance.

The callback code records a privacy-safe outcome after every authenticated scheduled run and preserves the established one-request direct-VAPID flow. No manual notification, browser automation, OneSignal request, or schedule change was made during this inspection.

The remaining verification is intentionally open: retain evidence of two real scheduled windows on the opted-in device, including a valid no-duplicate skip when the same window is retried or the learner has completed the minimum. Historical explanation regeneration remains blocked until an owner-supplied provenance basis or explicit answer-safe enrichment brief is available; no question content was rewritten during this follow-up.
