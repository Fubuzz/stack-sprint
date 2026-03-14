# Stack Sprint Mobile Fix Pass Plan

## Objective
Make Stack Sprint feel intentionally designed for phones by prioritizing the playable area, removing blocking tutorial chrome, simplifying the HUD on mobile, and preserving desktop quality.

## Scope
- Mobile-first layout pass for start screen, in-game shell, and HUD
- Reposition or collapse tutorial/help content so it does not cover gameplay on phones
- Reduce non-essential above-the-fold chrome on small screens
- Preserve desktop presentation and mechanics
- Update README if needed
- Commit locally for Watchdog review

## Files Likely To Change
- `index.html`
- `style.css`
- `app.js`
- `README.md`
- `PROGRESS.md`

## Key Risks / Unknowns
- Canvas is fixed at 16:9, so mobile space gains must come from surrounding UI and viewport sizing rather than changing core rendering logic too aggressively
- Need to simplify HUD without hiding critical game state
- Manual validation is mostly smoke + layout reasoning unless browser automation is available

## Validation Plan
- `node --check app.js`
- Local static server smoke check
- Manual mobile-focused layout review via browser snapshot if available
- Verify desktop layout still looks intact
