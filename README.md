# Stack Sprint

Stack Sprint is now a faster, clearer one-button browser arcade runner: enter your name, dodge incoming hazards within the first seconds, collect sparks, build a streak, and post a named score to the local leaderboard.

## What's improved in this fix pass
- Proper home/start flow with player name entry before a run begins
- Local named leaderboard (top 5 runs saved in `localStorage`)
- Immediate gameplay pressure: crates and hazards spawn almost instantly
- Clearer reward loop: obstacle clears + spark pickups build streak and temporary fever scoring
- Visible restart and quit/home buttons in gameplay, pause, and game-over states
- Responsive polished UI for desktop and mobile play
- Synthesized sound effects and reactive chiptune-style music via Web Audio

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

## Scoring and leaderboard
- You must enter a player name before starting so runs can be saved properly
- Clearing obstacles awards bonus score and builds your streak
- Collecting sparks boosts the streak and can trigger a temporary fever score boost
- Surviving longer increases speed and passive score gain
- Top 5 named scores are stored locally in the browser only

## Notes
- Audio starts after the first user interaction because browsers block autoplay by default
- Leaderboard data and last-used player name are stored per browser via `localStorage`
