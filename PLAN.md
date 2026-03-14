# Stack Sprint Fix Pass Plan

## Objective
Repair Stack Sprint so gameplay becomes interactive and fun within the first few seconds, add a proper player-name entry/start flow with a named leaderboard, provide obvious restart/home controls, and preserve polished responsive presentation.

## Scope
- Inspect current single-page game architecture
- Rework gameplay pacing and event/obstacle loop
- Add menu/start screen with player name input
- Improve score + leaderboard UX around named entries
- Add restart and quit/home controls in the right states
- Update README if behavior/setup notes changed
- Commit locally for Watchdog review

## Files Likely To Change
- `index.html`
- `style.css`
- `app.js`
- `README.md`

## Risks / Unknowns
- Existing game loop may be tightly coupled and need a larger refactor
- Need to keep visuals polished while making mechanics more legible
- No automated test suite; validation will rely on smoke testing and code sanity checks

## Validation Plan
- Static JS syntax check
- Manual game-flow verification: home/name entry → start → immediate interaction → score feedback → hit obstacle/game over → leaderboard name save → restart/home
- Responsive spot check in browser
