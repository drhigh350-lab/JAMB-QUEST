# JAMB Quest Notification Schedule Audit — 17 August 2026

## Finding

The morning Heartbeat job existed and was enabled, but it was configured as `0 0 7 * * *`. Heartbeat cron expressions are UTC, while JAMB Quest computes learner reminder dates using `Africa/Lagos` by default. Nigeria is UTC+1, so the configured job ran at 8:00 a.m. in the learner’s local time rather than the displayed 7:00 a.m. reminder time.

A successful manual test therefore confirmed browser permission and push delivery, but it did not prove that the scheduled morning window was aligned with the learner’s local clock.

## Correction

The morning job `jamb-quest-comeback-morning` / task UID `Et2qh8vakipKt66nVeBqN7` was updated to `0 0 6 * * *` UTC, which corresponds to 7:00 a.m. in Africa/Lagos. Its description now explicitly states `Morning 7am Africa/Lagos`.

The afternoon and evening jobs were not changed. The reminder sender remains idempotent, uses the learner profile timezone for local date keys, skips completed daily minimums, and records a send date only after at least one device reports delivery.

## Verification boundary

The permanent morning schedule returns its next execution as `2026-08-18T06:00:00Z`. A first attempt to create a one-time 8:00 a.m. test using a date-specific cron was disabled after inspection showed the scheduler interpreted it as an annual date. It was replaced with a short-lived 60-second test schedule expiring at `2026-08-17T06:22:00Z`; its callback is the existing morning endpoint and its idempotent sender can deliver at most one morning push for the local date. Browser permission and manual test delivery have already been confirmed by the learner. The real-device receipt from this short-lived test remains the final delivery-evidence item; no delivery receipt has been fabricated.
