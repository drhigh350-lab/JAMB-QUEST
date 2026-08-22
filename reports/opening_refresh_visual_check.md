# Opening Refresh Check — 22 August 2026

## First-visit observation

In a browser session without the new completion marker, JAMB Quest displayed the full system-led opening sequence with the official mark, typewriter story, and Skip intro control. After the opening completed, the app handed off to the normal Practice home screen.

## Refresh observation

After the opening handed off to JAMB Quest, a normal refresh in the same browser session opened the Practice home screen directly. The opening sequence and Skip intro control did not reappear.

The opening completion marker uses session storage. It therefore survives refreshes in the current browser session while allowing a new browser session to receive the opening sequence again.
