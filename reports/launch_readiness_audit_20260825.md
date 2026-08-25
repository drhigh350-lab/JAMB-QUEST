# JAMB Quest Launch-Readiness Audit — 25 August 2026

## Production shell and installation evidence

The published production domain `https://jambquiz-kmqgtf9m.manus.space` returned an HTTP 200 app shell and presented the main learner entry experience. The root response is no-cache, the active model-bank JSON responds as `application/json`, the service worker responds as `application/javascript`, and `/manifest.webmanifest` responds as `application/manifest+json`.

The production manifest identifies the app as **JAMB Quest**, uses `standalone` display mode, and declares 192px and 512px standard plus maskable icon entries. A fresh production browser registration has an active root-scope service worker. It also has a waiting worker, which is expected after the latest release: the existing app design exposes a learner-controlled update and does not activate that worker automatically or while a question is active. The audit intentionally did not activate, reload, or disturb that waiting worker.

## Production learner surface

The production Practice screen exposes the intended compact path: Standard CBT, core-subject practice, optional Lekki, and separate Topic Drill, Syllabus Journey, and Game Arcade tools. The required four core subjects are visible and Mathematics is absent.

The public production authorised-question API responded successfully with 8,360 learner-playable authorised records: Biology 2,501, Chemistry 2,393, Physics 1,935, and Use of English 1,531. It reported 84 valid five-option records and zero invalid option shapes. Together with the active 1,000-record model bank, the learner interface displays a reconciled total of **9,360 practice questions**. A production practice review confirmed that Standard CBT advertises the correct 180-question, two-hour 60/40/40/40 mix and that optional Lekki remains separated from the four core subjects.

The current four-tab Practice-first screen was also captured at 390px width. Core cards remain vertically separated, readable, and reachable; no clipped controls, overlapping labels, or hidden core route was observed. The newest 120 production-log window contains only normal OAuth/server-startup messages and no error, exception, fatal, or HTTP 5xx signature.

The Standard CBT control is present and enabled in production. Its ready-check opens before an exam starts and accurately states the 180-question 60/40/40/40 mix, two-hour timer, question palette, flags, calculator, answer/position persistence, and accidental-exit confirmation. The audit did not select **Start 2-hour CBT**, so it created no test attempt and did not disturb a learner session.

## Operational signals and residual risks

The latest production runtime-log window contains normal starts only, with no current error or 5xx signature. Privacy-safe direct-browser reminder telemetry also records four recent scheduled callbacks as `sent`, including the morning window on 25 August at 07:07 UTC; every recorded window shows one enabled device, one send, zero skip, and `direct-browser` transport. The audit did not manually invoke a scheduler or notification.

Two observations remain intentionally outside this audit’s automatic checks. First, a real existing installed/browser session should naturally surface the waiting **Update JAMB Quest** control before any owner declares that old-session update discovery fully verified; the audit saw a waiting worker but deliberately did not activate it. Second, callback telemetry proves the push service accepted the scheduled send, not that a particular device visibly displayed it; continue normal device observation rather than forcing an extra test before launch.

## Launch-day operator checklist

| Check | Owner action | Expected result |
|---|---|---|
| Open the public link | Open `https://jambquiz-kmqgtf9m.manus.space` on a phone and one desktop browser. | The JAMB Quest entry screen loads; Practice, Progress, Profile, and About remain reachable. |
| Run a no-pressure Practice smoke check | Open Practice and start one short subject study round; answer one question and leave normally. | Question, four to five options, explanation, Previous/Next, and palette render without overlap. |
| Inspect CBT before starting | Open Standard CBT and stop at the ready check unless you want to practise a full exam. | The 180-question, two-hour mix and safety checklist are visible. |
| Check Profile installation/update state | On the same device, open Profile’s app/offline area. | Install guidance is available where supported. If **Update JAMB Quest** appears, choose it only when no question or CBT is active. |
| Observe reminders normally | Leave the device opted in through its normal 7 a.m., 1 p.m., and 7 p.m. Lagos windows. | Record whether the notification is visibly received; do not create an extra manual send for launch validation. |
| Keep known content holds closed | Do not release the 44 held Physics PDF records without new source evidence. | Physics 77 remains held until its conflicting option/key source is resolved; duplicates and wrapper variants stay out of gameplay. |
