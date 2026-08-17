# JAMB Quest Notification Schedule Audit — 17 August 2026

## Finding

The morning Heartbeat job existed and was enabled, but it was configured as `0 0 7 * * *`. Heartbeat cron expressions are UTC, while JAMB Quest computes learner reminder dates using `Africa/Lagos` by default. Nigeria is UTC+1, so the configured job ran at 8:00 a.m. in the learner’s local time rather than the displayed 7:00 a.m. reminder time.

A successful manual test therefore confirmed browser permission and push delivery, but it did not prove that the scheduled morning window was aligned with the learner’s local clock.

## Corrected schedule definitions

The initial in-place Heartbeat update returned a scheduler context-deadline error. To avoid claiming a successful update that could not be confirmed, the three legacy jobs were replaced with three new enabled definitions. The obsolete jobs were deleted only after all three replacements were created successfully.

| Learner time | UTC cron | Callback | Replacement task UID |
| --- | --- | --- | --- |
| 07:00 Africa/Lagos | `0 0 6 * * *` | `/api/scheduled/comeback-morning` | `me56gJTKY9rsAquZKzqZff` |
| 13:00 Africa/Lagos | `0 0 12 * * *` | `/api/scheduled/comeback-afternoon` | `detynW9Z24BSVinBqDgh5r` |
| 19:00 Africa/Lagos | `0 0 18 * * *` | `/api/scheduled/comeback-evening` | `mRHcHM5DsSFsiSsaZ3zpTC` |

The former afternoon and evening definitions incorrectly used 13:00 UTC and 19:00 UTC, which would have delivered one hour later than the required Africa/Lagos times. The reminder sender remains idempotent, uses the learner profile timezone for local date keys, skips completed daily minimums, and records a send date only after at least one device reports delivery.

## Temporary 8:00 a.m. test reconciliation

The temporary job `jamb-quest-8am-test-20260817` / task UID `8Bao3J5p4T5VRHiVfpouVh` was enabled for `0 0 7 * * *` UTC, equivalent to 8:00 a.m. Africa/Lagos. After its scheduled window, its Heartbeat execution history reported zero runs. A second isolated diagnostic callback at 08:15 Africa/Lagos also recorded zero Heartbeat runs, although the live callback endpoint correctly returned `403` to an unauthenticated public probe. The diagnostic was deleted so it cannot recur.

## Verification boundary

The replacement schedules have been created and are enabled, but no replacement callback has yet executed. Browser permission and manual test delivery have already been confirmed by the learner. A real-device receipt from a recorded scheduled callback is still required before scheduled push delivery can be claimed; no delivery receipt has been fabricated.
