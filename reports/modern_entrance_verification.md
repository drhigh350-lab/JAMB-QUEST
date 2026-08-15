# Modern entrance verification

Phone and desktop previews were checked on 15 August 2026 after adding the home-screen entrance choreography. The hero now presents a visible typewriter line beneath the primary message; it begins typing immediately on phone entry and completes with the data-backed readiness message on desktop. The header, hero, mission card, and compact action panels appear in a short staggered sequence rather than as a single static page.

The entrance uses opacity and transform only, with the longest panel delay at 250 ms. It therefore does not defer button availability. The JavaScript typewriter and all CSS entrance motion resolve immediately to complete text and no transition for users with reduced-motion preference.
