# PWA Update Verification

## Purpose

This check confirms that a learner who already has an older JAMB Quest app shell cached receives the current app shell—and its fixed **Practice**, **Progress**, **Profile**, and **About** navigation—without clearing browser storage.

## Production verification result

On 13 August 2026, the live domain was tested in a clean Chromium profile using a controlled legacy service-worker route. The legacy worker first controlled the page. The app then loaded the normal route, registered the current worker, and automatically refreshed into the latest shell. The current worker took control, the visible fixed tab controls were found, and an offline reload retained the cached app shell and **Profile** tab control.

| Check | Result |
|---|---|
| Legacy cached shell can control a page | Passed |
| Current worker replaces legacy worker automatically | Passed |
| Fixed Practice and About controls appear after upgrade | Passed |
| Offline reload retains the fixed navigation | Passed |

The application now forces an updated worker to activate, claims clients, and refreshes open pages once so existing browser and installed-app sessions receive new navigation without manual cache clearing.
