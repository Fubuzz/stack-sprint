const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerValue = document.getElementById('playerValue');
const scoreValue = document.getElementById('scoreValue');
const bestValue = document.getElementById('bestValue');
const comboValue = document.getElementById('comboValue');
const phaseValue = document.getElementById('phaseValue');
const finalPlayer = document.getElementById('finalPlayer');
const finalScore = document.getElementById('finalScore');
const finalBest = document.getElementById('finalBest');
const gameOverTitle = document.getElementById('gameOverTitle');
const rankLine = document.getElementById('rankLine');
const eventBanner = document.getElementById('eventBanner');
const leaderboardList = document.getElementById('leaderboardList');
const playerNameInput = document.getElementById('playerNameInput');

const startOverlay = document.getElementById('startOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startButton = document.getElementById('startButton');
const resumeButton = document.getElementById('resumeButton');
const restartButton = document.getElementById('restartButton');
const restartTopButton = document.getElementById('restartTopButton');
const pauseRestartButton = document.getElementById('pauseRestartButton');
const homeButton = document.getElementById('homeButton');
const pauseHomeButton = document.getElementById('pauseHomeButton');
const gameOverHomeButton = document.getElementById('gameOverHomeButton');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 590;
const PLAYER_X = 220;
const GRAVITY = 2550;
const JUMP_FORCE = 925;
const BASE_SCROLL = 420;
const MAX_DT = 1 / 30;
const STORAGE_KEY = 'stack-sprint-leaderboard';
const PLAYER_KEY = 'stack-sprint-player-name';
const LEADERBOARD_LIMIT = 5;

const palette = {
  white: '#f5f8ff',
  cyan: '#72f6ff',
  cyanSoft: '#b3fbff',
  violet: '#8a7dff',
  violetSoft: '#b7afff',
  gold: '#ffd968',
  coral: '#ff7a93',
  danger: '#ff627e',
  lime: '#7dffb0',
  ink: '#050814',
};

const phases = [
  {
    name: 'Neon Warmup',
    start: 0,
    obstacleInterval: [1.2, 1.55],
    pickupInterval: [1.1, 1.45],
    powerupInterval: [11, 15],
    patterns: ['single', 'single', 'single', 'sparkLine'],
    themeTop: '#091329',
    themeBottom: '#04070f',
    glow: 'rgba(114,246,255,0.32)',
    accent: '#72f6ff',
    label: 'Learn the rhythm. Build the first streak.',
  },
  {
    name: 'Rush Hour',
    start: 15,
    obstacleInterval: [0.95, 1.25],
    pickupInterval: [0.95, 1.3],
    powerupInterval: [10, 13],
    patterns: ['single', 'single', 'double', 'sparkLine', 'highLow'],
    themeTop: '#120f31',
    themeBottom: '#060713',
    glow: 'rgba(138,125,255,0.32)',
    accent: '#8a7dff',
    label: 'Traffic thickens. Mixed heights start showing up.',
  },
  {
    name: 'Sky Bridge',
    start: 30,
    obstacleInterval: [0.82, 1.1],
    pickupInterval: [0.88, 1.2],
    powerupInterval: [9, 12],
    patterns: ['double', 'single', 'highLow', 'barrierPair', 'sparkArc'],
    themeTop: '#1d1131',
    themeBottom: '#080b18',
    glow: 'rgba(255,217,104,0.26)',
    accent: '#ffd968',
    label: 'Higher pressure. Patterns demand cleaner jumps.',
  },
  {
    name: 'Overdrive',
    start: 45,
    obstacleInterval: [0.72, 0.96],
    pickupInterval: [0.8, 1.08],
    powerupInterval: [8.5, 11],
    patterns: ['double', 'highLow', 'barrierPair', 'pulseWall', 'sparkArc'],
    themeTop: '#2a1028',
    themeBottom: '#09060f',
    glow: 'rgba(255,122,147,0.28)',
    accent: '#ff7a93',
    label: 'Full sprint. The city wakes up and the lane bites back.',
  },
];

const powerupMeta = {
  shield: { color: '#72f6ff', label: 'Shield', banner: 'Shield up. One collision is forgiven.' },
  magnet: { color: '#ffd968', label: 'Magnet', banner: 'Coin magnet live. Sparks pull toward you.' },
  double: { color: '#7dffb0', label: 'Double Score', banner: 'Double score active. Cash in your streak.' },
  slow: { color: '#b7afff', label: 'Slow-Mo', banner: 'Slow-mo engaged. The lane chills out briefly.' },
};

const state = {
  mode: 'start',
  score: 0,
  best: 0,
  streak: 0,
  speed: BASE_SCROLL,
  time: 0,
  distance: 0,
  playerName: '',
  leaderboard: loadLeaderboard(),
  phaseIndex: 0,
  lanes: [GROUND_Y - 72, GROUND_Y - 186],
  obstacles: [],
  pickups: [],
  powerups: [],
  particles: [],
  popups: [],
  stars: makeStars(),
  skyline: makeSkyline(),
  hills: makeHills(),
  shards: makeShards(),
  player: createPlayer(),
  lastTimestamp: 0,
  audioUnlocked: false,
  audioCtx: null,
  musicClock: 0,
  musicStep: 0,
  nextObstacleAt: 0,
  nextPickupAt: 0,
  nextPowerupAt: 0,
  bannerText: 'Thread the gaps. Grab sparks. Don’t hit crates.',
  bannerTimer: 0,
  justSavedRank: null,
};

state.best = state.leaderboard[0]?.score || 0;
state.playerName = loadPlayerName();
playerNameInput.value = state.playerName;

function createPlayer() {
  return {
    x: PLAYER_X,
    y: GROUND_Y - 72,
    w: 58,
    h: 72,
    vy: 0,
    jumps: 0,
    maxJumps: 2,
    coyote: 0,
    onGround: true,
    jumpBuffer: 0,
    trailClock: 0,
    squash: 0,
    alive: true,
    fever: 0,
    flash: 0,
    shield: 0,
    magnet: 0,
    doubleScore: 0,
    slowmo: 0,
    hitFlash: 0,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function currentPhase() {
  return phases[state.phaseIndex] || phases[phases.length - 1];
}

function getPhaseIndexForTime(time) {
  let index = 0;
  for (let i = 0; i < phases.length; i += 1) {
    if (time >= phases[i].start) index = i;
  }
  return index;
}

function loadPlayerName() {
  return (localStorage.getItem(PLAYER_KEY) || '').trim();
}

function savePlayerName(name) {
  localStorage.setItem(PLAYER_KEY, name);
}

function loadLeaderboard() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) => entry && typeof entry.name === 'string' && Number.isFinite(entry.score))
      .map((entry) => ({ name: entry.name.slice(0, 18), score: Math.floor(entry.score) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, LEADERBOARD_LIMIT);
  } catch {
    return [];
  }
}

function saveLeaderboard() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.leaderboard));
}

function updateLeaderboard(score) {
  const entry = { name: state.playerName, score: Math.floor(score) };
  state.leaderboard.push(entry);
  state.leaderboard = state.leaderboard
    .sort((a, b) => b.score - a.score)
    .slice(0, LEADERBOARD_LIMIT);
  saveLeaderboard();
  state.best = state.leaderboard[0]?.score || 0;
  const rank = state.leaderboard.findIndex((item) => item.name === entry.name && item.score === entry.score);
  return rank >= 0 ? rank + 1 : null;
}

function renderLeaderboard() {
  leaderboardList.innerHTML = '';
  if (!state.leaderboard.length) {
    const empty = document.createElement('li');
    empty.innerHTML = '<span class="rank">—</span><span class="name">No runs yet. Start the lane.</span><span class="score">0</span>';
    leaderboardList.appendChild(empty);
    return;
  }

  state.leaderboard.forEach((entry, index) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <span class="rank">#${index + 1}</span>
      <span class="name">${escapeHtml(entry.name)}</span>
      <span class="score">${entry.score}</span>
    `;
    leaderboardList.appendChild(item);
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function makeStars() {
  return Array.from({ length: 42 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * 280,
    r: Math.random() * 2 + 0.5,
    drift: Math.random() * 12 + 12,
    alpha: Math.random() * 0.5 + 0.2,
  }));
}

function makeSkyline() {
  return Array.from({ length: 10 }, (_, i) => ({
    x: i * 170,
    w: 110 + Math.random() * 90,
    h: 120 + Math.random() * 190,
    pulse: Math.random() * Math.PI * 2,
  }));
}

function makeHills() {
  return Array.from({ length: 7 }, (_, i) => ({
    x: i * 240,
    w: 220 + Math.random() * 80,
    h: 60 + Math.random() * 60,
  }));
}

function makeShards() {
  return Array.from({ length: 18 }, () => ({
    x: Math.random() * WIDTH,
    y: 100 + Math.random() * 260,
    size: 16 + Math.random() * 24,
    drift: 12 + Math.random() * 24,
    sway: Math.random() * Math.PI * 2,
  }));
}

function resetRun() {
  state.score = 0;
  state.streak = 0;
  state.speed = BASE_SCROLL;
  state.time = 0;
  state.distance = 0;
  state.musicClock = 0;
  state.musicStep = 0;
  state.phaseIndex = 0;
  state.obstacles = [];
  state.pickups = [];
  state.powerups = [];
  state.particles = [];
  state.popups = [];
  state.justSavedRank = null;
  state.player = createPlayer();
  state.nextObstacleAt = 0.75;
  state.nextPickupAt = 0.42;
  state.nextPowerupAt = 9.5;
  setBanner(`${currentPhase().name}: ${currentPhase().label}`, 3.2);
  syncHud();
}

function ensurePlayerName() {
  const name = (playerNameInput.value || '').trim().slice(0, 18);
  if (!name) {
    playerNameInput.focus();
    setBanner('Enter your name first so your run can hit the leaderboard.', 2.6);
    return false;
  }
  state.playerName = name;
  savePlayerName(name);
  return true;
}

function syncHud() {
  playerValue.textContent = state.playerName || 'Guest';
  scoreValue.textContent = Math.floor(state.score);
  bestValue.textContent = Math.floor(state.best);
  comboValue.textContent = `×${Math.max(1, state.streak + 1)}`;
  phaseValue.textContent = currentPhase().name;
  eventBanner.textContent = state.bannerText;
}

function setOverlay(overlay, visible) {
  overlay.classList.toggle('visible', visible);
}

function setBanner(text, duration = 2.4) {
  state.bannerText = text;
  state.bannerTimer = duration;
  eventBanner.textContent = text;
}

function startGame() {
  if (!ensurePlayerName()) return;
  unlockAudio();
  resetRun();
  state.mode = 'playing';
  setOverlay(startOverlay, false);
  setOverlay(gameOverOverlay, false);
  setOverlay(pauseOverlay, false);
}

function goHome() {
  state.mode = 'start';
  setOverlay(startOverlay, true);
  setOverlay(gameOverOverlay, false);
  setOverlay(pauseOverlay, false);
  setBanner('Ready for another run? Enter a name and start.', 2.8);
  syncHud();
  renderLeaderboard();
}

function pauseGame() {
  if (state.mode !== 'playing') return;
  state.mode = 'paused';
  setOverlay(pauseOverlay, true);
}

function resumeGame() {
  if (state.mode !== 'paused') return;
  state.mode = 'playing';
  setOverlay(pauseOverlay, false);
}

function endGame(reason = 'You clipped a crate.') {
  state.mode = 'gameover';
  state.player.alive = false;
  state.justSavedRank = updateLeaderboard(state.score);
  syncHud();
  renderLeaderboard();
  finalPlayer.textContent = state.playerName;
  finalScore.textContent = Math.floor(state.score);
  finalBest.textContent = Math.floor(state.best);
  gameOverTitle.textContent = reason;
  rankLine.textContent = state.justSavedRank ? `Leaderboard rank: #${state.justSavedRank}` : 'Score saved to leaderboard';
  setOverlay(gameOverOverlay, true);
  playSfx('lose');
}

function togglePause() {
  if (state.mode === 'playing') pauseGame();
  else if (state.mode === 'paused') resumeGame();
}

function requestJump() {
  unlockAudio();
  if (state.mode === 'start' || state.mode === 'gameover') return;
  if (state.mode !== 'playing') return;
  state.player.jumpBuffer = 0.12;
}

function performJump() {
  const player = state.player;
  const canUseGround = player.onGround || player.coyote > 0;
  if (canUseGround) {
    player.vy = -JUMP_FORCE;
    player.onGround = false;
    player.coyote = 0;
    player.jumps = 1;
  } else if (player.jumps < player.maxJumps) {
    player.vy = -JUMP_FORCE * 0.9;
    player.jumps += 1;
  } else {
    return false;
  }
  player.jumpBuffer = 0;
  player.squash = 0.22;
  emitBurst(player.x + player.w * 0.25, player.y + player.h, palette.cyan, 8, 150);
  playSfx('jump');
  return true;
}

function addObstacle(type, lane, x = WIDTH + 120) {
  const specs = {
    crate: { w: 64, h: 72 },
    barrier: { w: 84, h: 108 },
    drone: { w: 76, h: 44 },
    pulse: { w: 118, h: 34 },
  };
  const spec = specs[type];
  const y = type === 'drone' ? state.lanes[1] + 10 : type === 'pulse' ? state.lanes[1] + 78 : state.lanes[lane];
  state.obstacles.push({
    type,
    lane,
    x,
    y,
    w: spec.w,
    h: spec.h,
    pulse: Math.random() * Math.PI * 2,
    scored: false,
  });
}

function spawnObstaclePattern() {
  const phase = currentPhase();
  const patterns = phase.patterns;
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  const baseX = WIDTH + 120;

  if (pattern === 'single') {
    const roll = Math.random();
    if (roll < 0.55) addObstacle('crate', 0, baseX);
    else if (roll < 0.82) addObstacle('barrier', 0, baseX);
    else addObstacle('drone', 1, baseX);
  } else if (pattern === 'double') {
    addObstacle('crate', 0, baseX);
    addObstacle(Math.random() < 0.5 ? 'crate' : 'barrier', 0, baseX + 200 + Math.random() * 40);
  } else if (pattern === 'highLow') {
    addObstacle('crate', 0, baseX);
    addObstacle('drone', 1, baseX + 165 + Math.random() * 25);
  } else if (pattern === 'barrierPair') {
    addObstacle('barrier', 0, baseX);
    addObstacle('drone', 1, baseX + 220);
  } else if (pattern === 'pulseWall') {
    addObstacle('pulse', 1, baseX);
    addObstacle('crate', 0, baseX + 210);
  } else if (pattern === 'sparkLine') {
    addObstacle('crate', 0, baseX);
    spawnPickupGroup('line', baseX + 100);
  } else if (pattern === 'sparkArc') {
    addObstacle('barrier', 0, baseX);
    spawnPickupGroup('arc', baseX + 80);
  }

  const interval = randomBetween(phase.obstacleInterval[0], phase.obstacleInterval[1]);
  state.nextObstacleAt = state.time + interval;
}

function spawnPickup(type = 'spark', x = WIDTH + 150, lane = Math.random() < 0.45 ? 1 : 0) {
  state.pickups.push({
    type,
    x,
    y: state.lanes[lane] + 16,
    r: 15,
    lane,
    bob: Math.random() * Math.PI * 2,
    taken: false,
  });
}

function spawnPickupGroup(kind, startX) {
  if (kind === 'line') {
    for (let i = 0; i < 4; i += 1) spawnPickup('spark', startX + i * 54, 1);
  } else if (kind === 'arc') {
    for (let i = 0; i < 5; i += 1) {
      const pickup = {
        type: 'spark',
        x: startX + i * 56,
        y: state.lanes[i < 2 ? 1 : 0] - (i === 2 ? 30 : 0) + 24,
        r: 15,
        lane: 0,
        bob: Math.random() * Math.PI * 2,
        taken: false,
      };
      state.pickups.push(pickup);
    }
  }
}

function spawnPassivePickup() {
  spawnPickup('spark');
  const interval = randomBetween(currentPhase().pickupInterval[0], currentPhase().pickupInterval[1]);
  state.nextPickupAt = state.time + interval;
}

function spawnPowerup() {
  const keys = Object.keys(powerupMeta);
  const type = keys[Math.floor(Math.random() * keys.length)];
  const lane = Math.random() < 0.5 ? 1 : 0;
  state.powerups.push({
    type,
    x: WIDTH + 180,
    y: state.lanes[lane] + 18,
    r: 18,
    bob: Math.random() * Math.PI * 2,
    taken: false,
  });
  const interval = randomBetween(currentPhase().powerupInterval[0], currentPhase().powerupInterval[1]);
  state.nextPowerupAt = state.time + interval;
}

function activatePowerup(type) {
  const player = state.player;
  if (type === 'shield') player.shield = Math.max(player.shield, 8);
  if (type === 'magnet') player.magnet = Math.max(player.magnet, 8);
  if (type === 'double') player.doubleScore = Math.max(player.doubleScore, 7);
  if (type === 'slow') player.slowmo = Math.max(player.slowmo, 5.5);
  player.flash = 0.24;
  setBanner(powerupMeta[type].banner, 2.4);
  playSfx('power');
}

function update(dt) {
  state.time += dt;
  if (state.bannerTimer > 0) {
    state.bannerTimer = Math.max(0, state.bannerTimer - dt);
    if (state.bannerTimer === 0 && state.mode === 'playing') {
      setBanner(`${currentPhase().name}: push the streak and watch for power-ups.`, 999);
    }
  }

  updateBackground(dt);
  updateParticles(dt);
  updatePopups(dt);

  if (state.mode !== 'playing') return;

  const nextPhaseIndex = getPhaseIndexForTime(state.time);
  if (nextPhaseIndex !== state.phaseIndex) {
    state.phaseIndex = nextPhaseIndex;
    setBanner(`${currentPhase().name}: ${currentPhase().label}`, 3.1);
    emitBurst(190, 170, currentPhase().accent, 18, 200);
    playSfx('phase');
  }

  const player = state.player;
  const slowFactor = player.slowmo > 0 ? 0.72 : 1;
  state.speed = (BASE_SCROLL + Math.min(290, state.time * 17) + Math.min(135, state.streak * 10)) * slowFactor;
  state.distance += state.speed * dt;

  const feverBoost = player.fever > 0 ? 2.25 : 1;
  const scoreBoost = player.doubleScore > 0 ? 2 : 1;
  state.score += dt * (18 + state.streak * 6) * feverBoost * scoreBoost;

  if (state.time >= state.nextObstacleAt) spawnObstaclePattern();
  if (state.time >= state.nextPickupAt) spawnPassivePickup();
  if (state.time >= state.nextPowerupAt) spawnPowerup();

  updateObstacles(dt);
  updatePickups(dt);
  updatePowerups(dt);
  updatePlayer(dt);
  updateMusic(dt);
  syncHud();
}

function updateBackground(dt) {
  state.stars.forEach((star) => {
    star.x -= star.drift * dt;
    if (star.x < -5) star.x = WIDTH + 5;
  });

  state.shards.forEach((shard) => {
    shard.x -= shard.drift * dt;
    shard.sway += dt * 1.8;
    if (shard.x < -40) shard.x = WIDTH + 80;
  });
}

function updateObstacles(dt) {
  const player = state.player;
  for (const obstacle of state.obstacles) {
    obstacle.x -= state.speed * dt;

    if (!obstacle.scored && obstacle.x + obstacle.w < player.x - 14) {
      obstacle.scored = true;
      state.streak += 1;
      const gain = (10 + state.streak * 5) * (player.doubleScore > 0 ? 2 : 1);
      state.score += gain;
      addPopup(obstacle.x + obstacle.w / 2, obstacle.y - 14, `clear +${gain}`, palette.lime);
      emitBurst(obstacle.x + obstacle.w / 2, obstacle.y + obstacle.h * 0.4, palette.lime, 7, 120);
      if (state.streak === 1) setBanner('Nice. Clears increase your streak multiplier.', 2.1);
      if (state.streak === 4) {
        player.fever = 3.2;
        setBanner('FEVER! Your score gain is juiced for a few seconds.', 2.4);
        playSfx('fever');
      } else {
        playSfx('clear');
      }
    }

    if (rectsOverlap(player.x + 6, player.y + 4, player.w - 12, player.h - 8, obstacle.x, obstacle.y, obstacle.w, obstacle.h)) {
      if (player.shield > 0) {
        player.shield = 0;
        player.hitFlash = 0.3;
        obstacle.x = -999;
        state.streak = Math.max(0, state.streak - 1);
        addPopup(player.x + player.w / 2, player.y - 10, 'shield save!', palette.cyan);
        emitBurst(player.x + player.w / 2, player.y + player.h / 2, palette.cyan, 16, 240);
        setBanner('Shield popped. You stayed alive.', 2);
        playSfx('shield');
        continue;
      }
      endGame(obstacle.type === 'barrier' ? 'Barrier slammed the run.' : obstacle.type === 'drone' ? 'Drone clipped your line.' : 'You clipped a crate.');
      return;
    }
  }
  state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.w > -120);
}

function pickupCollision(player, px, py, radius) {
  const nearestX = Math.max(player.x, Math.min(px, player.x + player.w));
  const nearestY = Math.max(player.y, Math.min(py, player.y + player.h));
  const dx = px - nearestX;
  const dy = py - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

function updatePickups(dt) {
  const player = state.player;
  for (const pickup of state.pickups) {
    pickup.x -= state.speed * dt;
    pickup.bob += dt * 6;

    let px = pickup.x;
    let py = pickup.y + Math.sin(pickup.bob) * 10;

    if (player.magnet > 0) {
      const dx = player.x + player.w / 2 - px;
      const dy = player.y + player.h / 2 - py;
      const dist = Math.hypot(dx, dy);
      if (dist < 230 && dist > 0.001) {
        px += (dx / dist) * dt * 240;
        py += (dy / dist) * dt * 240;
        pickup.x = px;
        pickup.y = py;
      }
    }

    if (!pickup.taken && pickupCollision(player, px, py, pickup.r)) {
      pickup.taken = true;
      state.streak += 1;
      const gain = (20 + state.streak * 6) * (player.doubleScore > 0 ? 2 : 1);
      state.score += gain;
      player.flash = 0.18;
      if (state.streak >= 3) player.fever = Math.max(player.fever, 2.2);
      emitBurst(px, py, palette.gold, 12, 220);
      addPopup(px, py - 10, `spark +${gain}`, palette.gold);
      playSfx('coin');
      if (state.streak === 2) setBanner('Sparks raise the multiplier. Stack them with obstacle clears.', 2.2);
    }
  }
  state.pickups = state.pickups.filter((pickup) => pickup.x > -60 && !pickup.taken);
}

function updatePowerups(dt) {
  const player = state.player;
  for (const power of state.powerups) {
    power.x -= state.speed * dt;
    power.bob += dt * 5;
    const py = power.y + Math.sin(power.bob) * 12;
    if (!power.taken && pickupCollision(player, power.x, py, power.r)) {
      power.taken = true;
      activatePowerup(power.type);
      emitBurst(power.x, py, powerupMeta[power.type].color, 14, 220);
      addPopup(power.x, py - 8, powerupMeta[power.type].label, powerupMeta[power.type].color);
    }
  }
  state.powerups = state.powerups.filter((power) => power.x > -80 && !power.taken);
}

function updatePlayer(dt) {
  const player = state.player;
  const prevBottom = player.y + player.h;

  player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  player.coyote = Math.max(0, player.coyote - dt);
  player.trailClock += dt;
  player.squash = Math.max(0, player.squash - dt * 1.8);
  player.fever = Math.max(0, player.fever - dt);
  player.flash = Math.max(0, player.flash - dt);
  player.hitFlash = Math.max(0, player.hitFlash - dt);
  player.shield = Math.max(0, player.shield - dt);
  player.magnet = Math.max(0, player.magnet - dt);
  player.doubleScore = Math.max(0, player.doubleScore - dt);
  player.slowmo = Math.max(0, player.slowmo - dt);

  if (player.jumpBuffer > 0) performJump();

  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;

  if (player.y + player.h >= GROUND_Y) {
    player.y = GROUND_Y - player.h;
    if (!player.onGround && prevBottom < GROUND_Y + 2 && player.vy > 220) {
      if (state.streak > 0) {
        state.streak = Math.max(0, state.streak - 1);
        addPopup(player.x + player.w / 2, GROUND_Y - 30, 'rough landing - streak', palette.coral);
      }
      emitBurst(player.x + player.w / 2, GROUND_Y - 2, palette.coral, 8, 140);
    }
    player.onGround = true;
    player.vy = 0;
    player.jumps = 0;
  } else {
    if (player.onGround && prevBottom >= GROUND_Y - 1) player.coyote = 0.1;
    player.onGround = false;
  }

  if (player.y > HEIGHT + 180) {
    endGame('Missed the lane.');
  }

  if (player.trailClock > 0.04 && (!player.onGround || player.fever > 0 || player.slowmo > 0)) {
    player.trailClock = 0;
    state.particles.push({
      x: player.x + 18,
      y: player.y + player.h - 6,
      vx: -40 - Math.random() * 30,
      vy: -20 - Math.random() * 20,
      life: 0.36,
      maxLife: 0.36,
      color: player.fever > 0 ? palette.gold : player.slowmo > 0 ? palette.violetSoft : palette.cyanSoft,
      size: 4 + Math.random() * 4,
    });
  }
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function updateParticles(dt) {
  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 380 * dt;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
}

function updatePopups(dt) {
  for (const popup of state.popups) {
    popup.life -= dt;
    popup.y -= 22 * dt;
  }
  state.popups = state.popups.filter((popup) => popup.life > 0);
}

function addPopup(x, y, text, color) {
  state.popups.push({ x, y, text, color, life: 0.9 });
}

function emitBurst(x, y, color, count, power) {
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI + Math.random() * Math.PI;
    const speed = power * (0.45 + Math.random() * 0.65);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.3,
      maxLife: 0.8,
      color,
      size: 3 + Math.random() * 5,
    });
  }
}

function render() {
  drawBackground();
  drawGround();
  drawLaneHints();
  drawPickups();
  drawPowerups();
  drawObstacles();
  drawPlayer();
  drawParticles();
  drawPopups();
  drawWorldHud();
}

function drawBackground() {
  const phase = currentPhase();
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, phase.themeTop);
  grad.addColorStop(1, phase.themeBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const orbX = WIDTH * 0.72;
  const orbY = 120;
  const orb = ctx.createRadialGradient(orbX, orbY, 10, orbX, orbY, 180);
  orb.addColorStop(0, 'rgba(255,255,255,0.35)');
  orb.addColorStop(0.25, `${phase.accent}66`);
  orb.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(orbX, orbY, 170, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  state.stars.forEach((star) => {
    ctx.globalAlpha = star.alpha + Math.sin(state.time * 2 + star.y) * 0.08;
    ctx.fillStyle = palette.white;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  ctx.save();
  state.shards.forEach((shard) => {
    const y = shard.y + Math.sin(shard.sway) * 16;
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = phase.accent;
    ctx.beginPath();
    ctx.moveTo(shard.x, y - shard.size);
    ctx.lineTo(shard.x + shard.size * 0.8, y);
    ctx.lineTo(shard.x, y + shard.size);
    ctx.lineTo(shard.x - shard.size * 0.8, y);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();

  state.hills.forEach((hill, index) => {
    const baseX = ((hill.x - state.distance * (0.08 + index * 0.01)) % (WIDTH + 320)) - 200;
    ctx.fillStyle = index % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(114,246,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(baseX - 40, GROUND_Y + 10);
    ctx.quadraticCurveTo(baseX + hill.w * 0.3, GROUND_Y - hill.h, baseX + hill.w, GROUND_Y + 14);
    ctx.lineTo(baseX + hill.w, HEIGHT);
    ctx.lineTo(baseX - 40, HEIGHT);
    ctx.closePath();
    ctx.fill();
  });

  state.skyline.forEach((building, i) => {
    const baseX = ((building.x - state.distance * (0.12 + i * 0.005)) % (WIDTH + 320)) - 140;
    const glow = 0.18 + (Math.sin(state.time * 1.2 + building.pulse) + 1) * 0.08;
    ctx.fillStyle = `rgba(138,125,255,${0.08 + glow * 0.35})`;
    ctx.fillRect(baseX, HEIGHT - 150 - building.h, building.w, building.h);
    for (let y = HEIGHT - 140 - building.h; y < HEIGHT - 150; y += 28) {
      for (let x = baseX + 14; x < baseX + building.w - 10; x += 24) {
        ctx.fillStyle = Math.sin(x * 0.1 + y * 0.1 + state.time * 2) > 0
          ? 'rgba(114,246,255,0.11)'
          : 'rgba(255,217,104,0.09)';
        ctx.fillRect(x, y, 8, 12);
      }
    }
  });

  const horizon = ctx.createLinearGradient(0, GROUND_Y - 110, 0, HEIGHT);
  horizon.addColorStop(0, 'rgba(114,246,255,0)');
  horizon.addColorStop(1, phase.glow);
  ctx.fillStyle = horizon;
  ctx.fillRect(0, GROUND_Y - 110, WIDTH, 180);
}

function drawGround() {
  const pit = ctx.createLinearGradient(0, GROUND_Y, 0, HEIGHT);
  pit.addColorStop(0, 'rgba(255,98,126,0.18)');
  pit.addColorStop(1, 'rgba(9,5,15,0.96)');
  ctx.fillStyle = pit;
  ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

  const lineGrad = ctx.createLinearGradient(0, GROUND_Y, 0, HEIGHT);
  lineGrad.addColorStop(0, 'rgba(255,98,126,0.75)');
  lineGrad.addColorStop(1, 'rgba(255,98,126,0)');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(0, GROUND_Y, WIDTH, 10);

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  for (let x = -((state.distance * 0.9) % 80); x < WIDTH + 80; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 18);
    ctx.lineTo(x + 50, HEIGHT);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLaneHints() {
  ctx.save();
  ctx.strokeStyle = 'rgba(114,246,255,0.08)';
  ctx.lineWidth = 2;
  ctx.setLineDash([18, 16]);
  state.lanes.forEach((laneY, index) => {
    const y = laneY + 72;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = '700 16px Inter';
    ctx.fillText(index === 0 ? 'run lane' : 'air lane', 24, y - 12);
  });
  ctx.restore();
}

function drawObstacles() {
  state.obstacles.forEach((obstacle) => {
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    if (obstacle.type === 'barrier') {
      ctx.shadowColor = 'rgba(255,98,126,0.45)';
      ctx.shadowBlur = 20;
      const body = ctx.createLinearGradient(0, 0, 0, obstacle.h);
      body.addColorStop(0, '#ff9aaa');
      body.addColorStop(1, '#ff5b79');
      roundRect(0, 0, obstacle.w, obstacle.h, 18, body);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(12, 22, obstacle.w - 24, 10);
      ctx.fillRect(12, 52, obstacle.w - 24, 10);
    } else if (obstacle.type === 'drone') {
      ctx.shadowColor = 'rgba(255,217,104,0.4)';
      ctx.shadowBlur = 18;
      const body = ctx.createLinearGradient(0, 0, obstacle.w, obstacle.h);
      body.addColorStop(0, '#ffe398');
      body.addColorStop(1, '#ff9d59');
      roundRect(0, 8, obstacle.w, obstacle.h - 8, 18, body);
      ctx.fillStyle = 'rgba(7,11,22,0.9)';
      ctx.fillRect(14, 18, obstacle.w - 28, 8);
      ctx.fillRect(10, 0, obstacle.w - 20, 10);
    } else if (obstacle.type === 'pulse') {
      ctx.globalAlpha = 0.85 + Math.sin(state.time * 10 + obstacle.pulse) * 0.15;
      ctx.shadowColor = 'rgba(114,246,255,0.45)';
      ctx.shadowBlur = 24;
      const body = ctx.createLinearGradient(0, 0, obstacle.w, 0);
      body.addColorStop(0, '#72f6ff');
      body.addColorStop(1, '#8a7dff');
      roundRect(0, 0, obstacle.w, obstacle.h, 20, body);
    } else {
      ctx.shadowColor = 'rgba(114,246,255,0.35)';
      ctx.shadowBlur = 16;
      const body = ctx.createLinearGradient(0, 0, 0, obstacle.h);
      body.addColorStop(0, '#9af8ff');
      body.addColorStop(1, '#3cc8df');
      roundRect(0, 0, obstacle.w, obstacle.h, 14, body);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 3;
      ctx.strokeRect(8, 8, obstacle.w - 16, obstacle.h - 16);
      ctx.beginPath();
      ctx.moveTo(8, 8);
      ctx.lineTo(obstacle.w - 8, obstacle.h - 8);
      ctx.moveTo(obstacle.w - 8, 8);
      ctx.lineTo(8, obstacle.h - 8);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawPickups() {
  state.pickups.forEach((pickup) => {
    const y = pickup.y + Math.sin(pickup.bob) * 10;
    ctx.save();
    ctx.translate(pickup.x, y);
    ctx.rotate(state.time * 6 + pickup.bob);
    ctx.shadowColor = 'rgba(255,217,104,0.5)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = palette.gold;
    ctx.beginPath();
    ctx.arc(0, 0, pickup.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(4, -4);
    ctx.lineTo(11, 0);
    ctx.lineTo(4, 4);
    ctx.lineTo(0, 11);
    ctx.lineTo(-4, 4);
    ctx.lineTo(-11, 0);
    ctx.lineTo(-4, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function drawPowerups() {
  state.powerups.forEach((power) => {
    const y = power.y + Math.sin(power.bob) * 12;
    const meta = powerupMeta[power.type];
    ctx.save();
    ctx.translate(power.x, y);
    ctx.rotate(state.time * 2 + power.bob);
    ctx.shadowColor = `${meta.color}99`;
    ctx.shadowBlur = 22;
    ctx.fillStyle = meta.color;
    ctx.beginPath();
    ctx.arc(0, 0, power.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(5,8,20,0.88)';
    ctx.font = '900 14px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(meta.label[0], 0, 1);
    ctx.restore();
  });
}

function drawPlayer() {
  const p = state.player;
  const squash = 1 + p.squash * 0.28;
  const stretch = 1 - p.squash * 0.18;
  ctx.save();
  ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
  ctx.scale(squash, stretch);
  ctx.translate(-(p.x + p.w / 2), -(p.y + p.h / 2));

  ctx.shadowColor = p.fever > 0 ? palette.gold : p.slowmo > 0 ? palette.violetSoft : palette.violet;
  ctx.shadowBlur = p.hitFlash > 0 ? 40 : p.fever > 0 ? 32 : 22;
  const body = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
  body.addColorStop(0, p.flash > 0 ? '#fff3bf' : '#b7afff');
  body.addColorStop(1, p.fever > 0 ? '#ffb347' : p.slowmo > 0 ? '#8a7dff' : '#6f61ff');
  roundRect(p.x, p.y + 10, p.w, p.h - 10, 18, body);

  ctx.fillStyle = palette.white;
  ctx.fillRect(p.x + 13, p.y + 18, 11, 12);
  ctx.fillRect(p.x + 34, p.y + 18, 11, 12);
  ctx.fillStyle = '#11152a';
  ctx.fillRect(p.x + 16, p.y + 21, 5, 7);
  ctx.fillRect(p.x + 37, p.y + 21, 5, 7);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(p.x + 10, p.y + 14, p.w - 20, 5);
  ctx.restore();

  if (p.shield > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(114,246,255,0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, 42, 52, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = p.fever > 0 ? 'rgba(255,217,104,0.32)' : 'rgba(114,246,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, GROUND_Y + 18, 40, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticles() {
  state.particles.forEach((particle) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawPopups() {
  ctx.save();
  ctx.font = '700 24px Inter';
  ctx.textAlign = 'center';
  state.popups.forEach((popup) => {
    ctx.globalAlpha = Math.min(1, popup.life / 0.9);
    ctx.fillStyle = popup.color;
    ctx.fillText(popup.text, popup.x, popup.y);
  });
  ctx.restore();
}

function drawWorldHud() {
  if (state.mode !== 'playing') return;
  roundRect(28, 24, 360, 132, 20, 'rgba(7,11,22,0.55)');
  ctx.fillStyle = palette.white;
  ctx.font = '700 18px Inter';
  ctx.fillText('Speed', 52, 54);
  ctx.fillText('Streak', 52, 84);
  ctx.fillText('Phase', 52, 114);
  ctx.fillText('Power', 52, 144);

  ctx.fillStyle = palette.cyan;
  ctx.fillRect(132, 42, Math.min(170, (state.speed - BASE_SCROLL) * 0.42 + 28), 10);
  ctx.fillStyle = state.streak > 2 ? palette.gold : palette.violetSoft;
  ctx.fillRect(132, 72, Math.min(170, state.streak * 18 + 18), 10);
  ctx.fillStyle = currentPhase().accent;
  ctx.fillRect(132, 102, Math.min(170, (state.phaseIndex + 1) * 38), 10);

  const active = [];
  if (state.player.shield > 0) active.push('Shield');
  if (state.player.magnet > 0) active.push('Magnet');
  if (state.player.doubleScore > 0) active.push('2x');
  if (state.player.slowmo > 0) active.push('Slow');
  if (state.player.fever > 0) active.push('Fever');

  ctx.font = '700 16px Inter';
  ctx.fillStyle = active.length ? palette.white : 'rgba(255,255,255,0.5)';
  ctx.fillText(active.length ? active.join(' • ') : 'None active', 132, 144);
}

function roundRect(x, y, w, h, r, fillStyle) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.restore();
}

function unlockAudio() {
  if (state.audioUnlocked) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  state.audioCtx = new AudioCtx();
  state.audioUnlocked = true;
}

function playSfx(type) {
  const audio = state.audioCtx;
  if (!audio) return;
  const now = audio.currentTime;

  const tones = {
    jump: [440, 660, 0.09, 'triangle'],
    coin: [880, 1320, 0.12, 'triangle'],
    lose: [220, 140, 0.35, 'sawtooth'],
    clear: [330, 440, 0.08, 'square'],
    fever: [660, 990, 0.14, 'triangle'],
    power: [520, 1040, 0.16, 'triangle'],
    shield: [740, 420, 0.18, 'sine'],
    phase: [392, 523, 0.16, 'square'],
  };

  const [from, to, duration, wave] = tones[type] || tones.jump;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1800;

  osc.type = wave;
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(80, to), now + duration);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(type === 'lose' ? 0.08 : 0.05, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function updateMusic(dt) {
  const audio = state.audioCtx;
  if (!audio || state.mode !== 'playing') return;
  state.musicClock += dt;
  const stepLength = state.player.fever > 0 ? 0.16 : state.player.slowmo > 0 ? 0.28 : 0.22;
  if (state.musicClock < stepLength) return;
  state.musicClock -= stepLength;

  const moodPatterns = [
    [262, 330, 392, 523, 392, 330, 294, 330],
    [294, 370, 440, 554, 440, 370, 330, 370],
    [330, 392, 494, 587, 494, 392, 370, 392],
    [392, 523, 659, 784, 659, 523, 440, 523],
  ];
  const bassPatterns = [
    [131, 131, 147, 147, 165, 165, 147, 131],
    [147, 147, 165, 165, 196, 196, 165, 147],
    [165, 165, 196, 196, 220, 220, 196, 165],
    [196, 196, 220, 220, 247, 247, 220, 196],
  ];

  const phaseIndex = Math.min(moodPatterns.length - 1, state.phaseIndex);
  const melody = state.player.fever > 0 ? moodPatterns[3] : moodPatterns[phaseIndex];
  const bass = bassPatterns[phaseIndex];
  const note = melody[state.musicStep % melody.length];
  const low = bass[state.musicStep % bass.length];
  state.musicStep += 1;
  playMusicNote(note, 0.08, 'square', state.player.fever > 0 ? 0.026 : 0.018);
  if (state.musicStep % 2 === 0) playMusicNote(low, 0.12, 'triangle', 0.012);
}

function playMusicNote(freq, duration, wave, volume) {
  const audio = state.audioCtx;
  if (!audio) return;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function frame(timestamp) {
  if (!state.lastTimestamp) state.lastTimestamp = timestamp;
  const dt = Math.min(MAX_DT, (timestamp - state.lastTimestamp) / 1000);
  state.lastTimestamp = timestamp;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

function handlePointer(event) {
  event.preventDefault();
  requestJump();
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Enter' && state.mode === 'start') {
    event.preventDefault();
    startGame();
  }
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();
    requestJump();
  }
  if (event.code === 'KeyP' || event.code === 'Escape') {
    event.preventDefault();
    togglePause();
  }
  if (event.code === 'KeyR' && (state.mode === 'gameover' || state.mode === 'paused' || state.mode === 'playing')) {
    event.preventDefault();
    startGame();
  }
});

canvas.addEventListener('pointerdown', handlePointer);
startButton.addEventListener('click', startGame);
resumeButton.addEventListener('click', resumeGame);
restartButton.addEventListener('click', startGame);
restartTopButton.addEventListener('click', startGame);
pauseRestartButton.addEventListener('click', startGame);
homeButton.addEventListener('click', goHome);
pauseHomeButton.addEventListener('click', goHome);
gameOverHomeButton.addEventListener('click', goHome);
playerNameInput.addEventListener('input', () => {
  playerNameInput.value = playerNameInput.value.replace(/\s+/g, ' ').slice(0, 18);
});

renderLeaderboard();
syncHud();
setOverlay(startOverlay, true);
requestAnimationFrame(frame);
render();
