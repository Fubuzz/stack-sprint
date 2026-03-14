# PLAN

## Objective
Build Stack Sprint: a standalone, highly replayable browser runner where the player times one-button jumps onto collapsing platforms, collects coins, maintains combo, and chases score.

## Scope Boundaries
- Plain HTML/CSS/JS only
- Single page, no backend, no external assets
- Include start/pause/game-over/restart, best score persistence, responsive UI, original synthesized audio if practical
- Do not push anywhere

## Files
- index.html
- style.css
- app.js
- README.md
- lightweight orchestration notes during build

## Key Risks / Unknowns
- Making the loop feel readable and fair without overcomplication
- Collision/platform logic with collapsing platforms
- Mobile input + canvas scaling polish
- Audio must degrade gracefully if autoplay is blocked

## Validation Plan
- JS syntax check
- Browser smoke test: start, jump, pause, game over, restart, responsive rendering
- Verify localStorage best score path in code
- Quick gameplay balance pass
