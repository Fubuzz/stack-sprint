# Stack Sprint

Stack Sprint is a fast, one-button browser arcade game: jump between collapsing platforms, scoop coins, build combo, and survive as the speed ramps up.

## Features
- Plain HTML/CSS/JS, no build step
- Space / click / tap controls
- Start, pause, game over, restart
- Score + best score persistence with `localStorage`
- Combo scoring for clean landings and coin pickups
- Increasing difficulty over time
- Responsive, mobile-friendly canvas layout
- Synthesized sound effects and simple looping chiptune-style music via Web Audio

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
- **Jump:** `Space`, click, or tap
- **Pause/Resume:** `P` or `Esc`
- **Restart after game over:** `R`

## Scoring
- Clean landings increase combo and award bonus points
- Coins also extend combo and add score
- Survive longer to increase pace and passive score gain

## Notes
- Audio starts after the first user interaction because browsers block autoplay by default
- Best score is stored locally in the browser only
