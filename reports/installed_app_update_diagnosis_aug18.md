# Installed-App Update Diagnosis — 18 August 2026

## Learner evidence

The learner’s four phone screenshots show the earlier Profile layout: the PWA panel says **“Keep JAMB Quest in your pocket”** and describes only app-shell/model-bank fallback. This is not the offline-pack UI published in checkpoint `dd1e8972`, which says **“Download your full study bank”** and exposes a download control.

The screenshots also show a zero-count provider queue and a reminder control cycling through **“Setting up”** / **“Enable on this device.”** They are therefore evidence that scheduled provider notifications remain unproven, not evidence of successful OneSignal delivery.

## Production inspection status

The public production URL opened but did not render inspectable interactive content in the sandbox browser. The development preview of the published code was independently verified: it rendered the new Profile panel and completed a real cache write of 4,990 authorised questions and 61 linked question visuals. Further device-side evidence must come from the learner opening the current deployment, not from the prior installed-app screen.

## Post-repair visual validation

After the provider-enrollment state update, the mobile development preview still rendered the Profile tab cleanly. It showed the current **“Download your full study bank”** panel with **4,990 online questions** and **61 question visuals** marked ready offline. The unauthenticated preview correctly retained **“Save reminders with profile”** rather than showing an unproven enabled state.
