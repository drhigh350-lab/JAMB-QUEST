# Direct Reminder Telemetry Repair — 23 August 2026

## What the audit found

The `directReminderCallbackAudits` table exists in the deployed database but contained zero rows. The three enabled reminder jobs were still targeting the legacy `/api/scheduled/comeback-morning`, `/comeback-afternoon`, and `/comeback-evening` endpoints rather than the newer `/api/scheduled/direct-browser-reminder` path. Those legacy endpoints sent through the same direct-browser transport but did not write callback telemetry, which explains the empty audit table.

Recent schedule execution logs confirm that the morning and evening jobs returned successful 200 responses with `transport: "direct-browser"`, `sent: 1`, `skipped: 0`, and `totalEnabled: 1` on their most recent runs. This is callback-transport evidence only; it does not prove that a visible notification appeared on the device.

## Safe repair

The active legacy callback wrapper now writes the same privacy-safe aggregate audit row as the direct callback: cron task UID, window, UTC hour, sent/skipped totals, enabled count, transport, and a failure/outside-window outcome where applicable. The audit writer already swallows its own storage failures, so telemetry failure cannot turn a successful send into a 5xx retry or duplicate notification.

No schedule was changed, no callback was manually invoked, and no notification was sent as part of this repair.

## What remains to verify

The next naturally scheduled morning, afternoon, or evening callback must create an audit row. After that, real-device confirmation is still needed: the opted-in, incomplete learner must observe one scheduled notification, and a later completed-goal run must yield a skipped/no-duplicate result. These two outcomes cannot be proven safely from source code or server telemetry alone.
