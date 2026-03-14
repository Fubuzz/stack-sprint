# DECISIONS
- Core loop prioritizes readability over procedural complexity: fixed player X, auto-scrolling platforms, one-button jump with forgiving coyote time and double jump.
- Combo advances on clean platform landings and coin pickups to reinforce risk/reward and short-run score-chasing.
- Platforms collapse shortly after landing to create movement pressure and prevent camping.
- Audio is synthesized with Web Audio to avoid assets and keep the game standalone.
- Falling to the bottom of the screen ends the run; touching the base floor is allowed but breaks combo, creating a soft-fail state before full death.
