# Profile and Auth Verification Notes

## Initial checks

The managed preview rendered the authenticated profile affordance with a learner name and showed the profile-sync microcopy, while the sandbox browser correctly rendered the signed-out fallback with the `Save my marks` control. The public provenance strip listed the existing set as `MODEL` and stated that the questions are original JAMB-aligned practice rather than copied past-paper wording.

The personal-browser connector was enabled to support a real-session verification. Its first page load remained in the expected `Checking profile` state before the auth query settled; no account data was changed during this check.
