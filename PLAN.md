# Stack Sprint v2 Improvement Pass Plan

## Objective
Push Stack Sprint from a decent arcade runner to a noticeably more varied, dynamic, mobile-friendly experience without losing the strong neon feel, audio, combo loop, and sprint identity.

## Scope
- Make runs evolve clearly within the first minute
- Add gameplay variety via pacing phases, hazard mixes, and lane event changes
- Introduce multiple meaningful power-ups beyond raw speed
- Upgrade background/world progression so each run feels more alive
- Fix the signup/start overlay for mobile screens
- Refresh README if needed
- Commit locally for Watchdog review

## Files Likely To Change
- `app.js`
- `style.css`
- `index.html`
- `README.md`
- `PROGRESS.md`

## Key Risks / Unknowns
- Single-file game logic can get messy if power-ups and progression are bolted on carelessly
- Need to preserve fairness while increasing variety
- No automated gameplay test suite, so validation is mostly syntax + manual smoke reasoning

## Validation Plan
- `node --check app.js`
- Serve locally and verify files load
- Spot-check progression logic via code review and lightweight runtime smoke checks
- Ensure mobile overlay CSS uses viewport-safe sizing and scrollable card behavior
