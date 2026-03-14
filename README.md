# Stack Sprint

Stack Sprint is a faster, clearer one-button browser arcade runner: enter your name, dodge incoming hazards, collect sparks, stack combos, grab run-changing power-ups, and post a named score to the local leaderboard.

## What's improved in this v2 improvement pass
- Noticeably less monotonous runs through **4 escalating phases**: Neon Warmup, Rush Hour, Sky Bridge, and Overdrive
- Clear challenge evolution within the first minute via denser spawn pacing, mixed obstacle patterns, and phase callouts
- More dynamic world feel with shifting phase palettes, glowing sky orb, floating shards, layered hills, and livelier skyline motion
- New meaningful power-ups beyond speed:
  - **Shield** — saves you from one collision
  - **Magnet** — pulls sparks toward the player
  - **Double Score** — doubles passive and pickup/clear scoring for a short time
  - **Slow-Mo** — briefly eases world speed for recovery windows
- Better mobile friendliness: the start/signup overlay is viewport-safe, scrollable, and no longer gets blocked on smaller screens
- Preserved strengths: responsive neon look, combo/fever feel, synthesized music, sound effects, and restart/home flow

## Run locally
Because the game is fully static, you can open `index.html` directly in a browser.

For a simple local server, from this folder run either:

### Python
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000`

### Node
```bash
npx serve .
```

## Controls
- **Start run:** Enter your name, then press `Enter` or click **Start Run**
- **Jump:** `Space`, click, or tap
- **Pause/Resume:** `P` or `Esc`
- **Restart:** `R` or click a visible restart button
- **Quit to home:** Click **Quit / Home**

## Scoring and progression
- You must enter a player name before starting so runs can be saved properly
- Clearing obstacles awards bonus score and builds your streak
- Collecting sparks boosts the streak and can trigger temporary fever scoring
- Power-ups create short tactical windows instead of only raw speed boosts
- Surviving longer moves the run through visible phases with tougher patterns and stronger atmosphere
- Top 5 named scores are stored locally in the browser only

## Notes
- Audio starts after the first user interaction because browsers block autoplay by default
- Leaderboard data and last-used player name are stored per browser via `localStorage`
- The game is designed to remain understandable and fair even as phases intensify
