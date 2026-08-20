# Internal audit workspace

This directory holds internal intake receipts, diagnostic output, provenance notes, and quality-audit artefacts. They are retained in GitHub because selected regression tests verify important safety and source-handling evidence from them. These files are **not** learner-facing question banks and are not consumed by the deployed JAMB Quest application.

The single managed learner-facing model-bank reference is defined in [`client/src/game/questionBank.ts`](../client/src/game/questionBank.ts). The active versioned JSON asset is served through managed storage and loaded as one bank in the learner experience. Authorised database questions are separately retrieved by the application, but are combined into the same learner-facing JAMB Quest question pool without showing learners source packages or output files.

When a verified JAMB Quest checkpoint is published, its source changes are also pushed to the `main` branch of `drhigh350-lab/JAMB-QUEST`.
