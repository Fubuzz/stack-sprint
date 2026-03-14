const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreValue = document.getElementById('scoreValue');
const bestValue = document.getElementById('bestValue');
const comboValue = document.getElementById('comboValue');
const finalScore = document.getElementById('finalScore');
const finalBest = document.getElementById('finalBest');
const gameOverTitle = document.getElementById('gameOverTitle');

const startOverlay = document.getElementById('startOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startButton = document.getElementById('startButton');
const resumeButton = document.getElementById('resumeButton');
const restartButton = document.getElementById('restartButton');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 590;
const PLAYER_X = 270;
const GRAVITY = 2400;
const BASE_SCROLL = 345;
const MAX_DT = 1 / 30;
const STORAGE_KEY = 'stack-sprint-best';

const palette = {
  bgTop: '#0c1734',
  bgBottom: '#050812',
  cyan: '#72f6ff',
  violet: '#8a7dff',
  violetSoft: '#b7afff',
  gold: '#ffd968',
  coral: '#ff7a93',
  white: '#f5f8ff',
  slate: '#7d8cb5',
  glow: 'rgba(114,246,255,0.35)',
};

const state = {
  mode: 'start',
  score: 0,
  best: Number(localStorage.getItem(STORAGE_KEY) || 0),
  combo: 0,
  speed: BASE_SCROLL,
  distance: 0,
  time: 0,
  platforms: [],
  coins: [],
  particles: [],
  popups: [],
  skyline: makeSkyline(),
  stars: makeStars(),
  player: createPlayer(),
  lastTimestamp: 0,
  audioUnlocked: false,
  audioCtx: null,
  musicClock: 0,
  musicStep: 0,
  nextSpawnX: 0,
};

function createPlayer() {
  return {
    x: PLAYER_X,
    y: GROUND_Y - 72,
    w: 54,
    h: 72,
    vy: 0,
    jumps: 0,
    maxJumps: 2,
    coyote: 0,
    onPlatform: null,
    onGround: true,
    jumpBuffer: 0,
    trailClock: 0,
    squash: 0,
    alive: true,
  };
}

function makeStars() {
  return Array.from({ length: 40 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * 280,
    r: Math.random() * 2 + 0.5,
    drift: Math.random() * 10 + 10,
    alpha: Math.random() * 0.5 + 0.2,
  }));
}

function makeSkyline() {
  return Array.from({ length: 9 }, (_, i) => ({
    x: i * 170,
    w: 110 + Math.random() * 90,
    h: 120 + Math.random() * 190,
    pulse: Math.random() * Math.PI * 2,
  }));
}

function resetRun() {
  state.score = 0;
  state.combo = 0;
  state.speed = BASE_SCROLL;
  state.distance = 0;
  state.time = 0;
  state.musicClock = 0;
  state.musicStep = 0;
  state.platforms = [];
  state.coins = [];
  state.particles = [];
  state.popups = [];
  state.nextSpawnX = 420;
  state.player = createPlayer();
  seedPlatforms();
  syncHud();
}

function seedPlatforms() {
  state.platforms.push(makePlatform(0, GROUND_Y, 460, false));
  state.platforms.push(makePlatform(470, 520, 165, true));
  state.platforms.push(makePlatform(720, 470, 150, true));
  state.platforms.push(makePlatform(955, 560, 180, true));
  state.platforms.push(makePlatform(1200, 500, 170, true));
  state.nextSpawnX = 1450;
  state.platforms.forEach((platform, index) => {
    if (index > 0 && Math.random() > 0.28) spawnCoinAbove(platform);
  });
}

function makePlatform(x, y, width, collapsing = true) {
  return {
    x,
    y,
    width,
    height: 22,
    collapsing,
    touched: false,
    collapseTimer: 0,
    fallSpeed: 0,
    shake: 0,
    scored: false,
  };
}

function spawnPlatform() {
  const minGap = 140;
  const maxGap = 250 + Math.min(state.time * 1.8, 120);
  const gap = minGap + Math.random() * (maxGap - minGap);
  const width = 110 + Math.random() * 95 - Math.min(state.time * 0.3, 20);
  const y = 430 + Math.random() * 150;
  const platform = makePlatform(state.nextSpawnX + gap, y, Math.max(92, width), true);
  state.platforms.push(platform);
  state.nextSpawnX = platform.x + platform.width;
  if (Math.random() < 0.85) spawnCoinAbove(platform);
}

function spawnCoinAbove(platform) {
  const count = Math.random() < 0.35 ? 2 : 1;
  for (let i = 0; i < count; i += 1) {
    state.coins.push({
      x: platform.x + platform.width * (count === 1 ? 0.5 : 0.33 + i * 0.34),
      y: platform.y - 42 - i * 16,
      r: 10,
      bob: Math.random() * Math.PI * 2,
      taken: false,
    });
  }
}

function syncHud() {
  scoreValue.textContent = Math.floor(state.score);
  bestValue.textContent = Math.floor(state.best);
  comboValue.textContent = `×${Math.max(1, state.combo + 1)}`;
}

function setOverlay(overlay, visible) {
  overlay.classList.toggle('visible', visible);
}

function startGame() {
  unlockAudio();
  resetRun();
  state.mode = 'playing';
  setOverlay(startOverlay, false);
  setOverlay(gameOverOverlay, false);
  setOverlay(pauseOverlay, false);
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

function endGame(reason = 'You fell.') {
  state.mode = 'gameover';
  state.player.alive = false;
  state.best = Math.max(state.best, Math.floor(state.score));
  localStorage.setItem(STORAGE_KEY, String(state.best));
  syncHud();
  finalScore.textContent = Math.floor(state.score);
  finalBest.textContent = Math.floor(state.best);
  gameOverTitle.textContent = reason;
  setOverlay(gameOverOverlay, true);
  playSfx('lose');
}

function togglePause() {
  if (state.mode === 'playing') pauseGame();
  else if (state.mode === 'paused') resumeGame();
}

function requestJump() {
  unlockAudio();
  if (state.mode === 'start') {
    startGame();
  }
  if (state.mode === 'gameover') {
    startGame();
  }
  if (state.mode !== 'playing') return;
  state.player.jumpBuffer = 0.12;
}

function performJump() {
  const player = state.player;
  const canUseGround = player.onGround || player.coyote > 0;
  if (canUseGround) {
    player.vy = -900;
    player.onGround = false;
    player.onPlatform = null;
    player.coyote = 0;
    player.jumps = 1;
  } else if (player.jumps < player.maxJumps) {
    player.vy = -820;
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

function update(dt) {
  state.time += dt;
  if (state.mode !== 'playing') return;

  state.speed = BASE_SCROLL + Math.min(210, state.time * 8.5);
  state.distance += state.speed * dt;
  state.score += dt * (10 + state.combo * 2.2);

  updateBackground(dt);
  updatePlatforms(dt);
  updateCoins(dt);
  updatePlayer(dt);
  updateParticles(dt);
  updatePopups(dt);
  updateMusic(dt);

  while (state.nextSpawnX < WIDTH + 420) {
    spawnPlatform();
  }

  syncHud();
}

function updateBackground(dt) {
  state.stars.forEach((star) => {
    star.x -= star.drift * dt;
    if (star.x < -5) star.x = WIDTH + 5;
  });
}

function updatePlatforms(dt) {
  for (const platform of state.platforms) {
    platform.x -= state.speed * dt;
    if (platform.touched && platform.collapsing) {
      platform.collapseTimer += dt;
      platform.shake = Math.sin(platform.collapseTimer * 50) * 3;
      if (platform.collapseTimer > 0.34) {
        platform.fallSpeed += 2200 * dt;
        platform.y += platform.fallSpeed * dt;
      }
    }
  }
  state.platforms = state.platforms.filter((platform) => platform.x + platform.width > -240 && platform.y < HEIGHT + 260);
}

function updateCoins(dt) {
  const player = state.player;
  for (const coin of state.coins) {
    coin.x -= state.speed * dt;
    coin.bob += dt * 5;
    if (coin.taken) continue;
    const cx = coin.x;
    const cy = coin.y + Math.sin(coin.bob) * 6;
    const nearestX = Math.max(player.x, Math.min(cx, player.x + player.w));
    const nearestY = Math.max(player.y, Math.min(cy, player.y + player.h));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    if (dx * dx + dy * dy < coin.r * coin.r) {
      coin.taken = true;
      state.combo += 1;
      const gain = 15 + state.combo * 3;
      state.score += gain;
      emitBurst(cx, cy, palette.gold, 12, 220);
      addPopup(cx, cy - 10, `+${Math.floor(gain)}`, palette.gold);
      playSfx('coin');
    }
  }
  state.coins = state.coins.filter((coin) => coin.x > -60 && !coin.taken);
}

function updatePlayer(dt) {
  const player = state.player;
  const prevY = player.y;
  const prevBottom = prevY + player.h;

  player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  player.coyote = Math.max(0, player.coyote - dt);
  player.trailClock += dt;
  player.squash = Math.max(0, player.squash - dt * 1.8);

  if (player.jumpBuffer > 0) {
    performJump();
  }

  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;

  let landed = false;
  let support = null;

  if (player.vy >= 0) {
    for (const platform of state.platforms) {
      const top = platform.y;
      const left = platform.x;
      const right = platform.x + platform.width;
      const playerLeft = player.x + 10;
      const playerRight = player.x + player.w - 10;
      const nowBottom = player.y + player.h;
      if (prevBottom <= top && nowBottom >= top && playerRight > left && playerLeft < right) {
        landed = true;
        support = platform;
        player.y = top - player.h;
        player.vy = 0;
        player.jumps = 0;
        player.onGround = false;
        player.coyote = 0.1;
        break;
      }
    }
  }

  if (landed) {
    handleLanding(support);
    player.onPlatform = support;
  } else {
    if (player.onPlatform && !isStillSupported(player, player.onPlatform)) {
      player.onPlatform = null;
      player.coyote = 0.1;
    }

    if (!player.onPlatform) {
      player.onGround = false;
    }
  }

  if (player.y + player.h >= GROUND_Y) {
    player.y = GROUND_Y - player.h;
    if (!player.onGround && prevBottom < GROUND_Y + 2) {
      state.combo = 0;
      emitBurst(player.x + player.w / 2, GROUND_Y - 2, palette.coral, 10, 160);
      addPopup(player.x + player.w / 2, GROUND_Y - 30, 'combo broke', palette.coral);
    }
    player.onGround = true;
    player.onPlatform = null;
    player.vy = 0;
    player.jumps = 0;
  }

  if (player.y > HEIGHT + 180) {
    endGame('Missed the stack.');
  }

  if (player.trailClock > 0.04 && (player.onPlatform || !player.onGround)) {
    player.trailClock = 0;
    state.particles.push({
      x: player.x + 18,
      y: player.y + player.h - 6,
      vx: -40 - Math.random() * 30,
      vy: -20 - Math.random() * 20,
      life: 0.36,
      maxLife: 0.36,
      color: palette.violetSoft,
      size: 4 + Math.random() * 4,
    });
  }
}

function isStillSupported(player, platform) {
  const playerLeft = player.x + 12;
  const playerRight = player.x + player.w - 12;
  return player.y + player.h === platform.y && playerRight > platform.x && playerLeft < platform.x + platform.width;
}

function handleLanding(platform) {
  const player = state.player;
  player.squash = 0.18;
  emitBurst(player.x + player.w / 2, player.y + player.h, palette.cyan, 10, 180);

  if (!platform.scored) {
    platform.scored = true;
    state.combo += 1;
    const gain = 12 + state.combo * 4;
    state.score += gain;
    addPopup(player.x + player.w / 2, player.y - 8, `clean x${state.combo + 1}`, palette.cyan);
    playSfx('land');
  }

  if (platform.collapsing && !platform.touched) {
    platform.touched = true;
    platform.collapseTimer = 0;
  }
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
  state.popups.push({ x, y, text, color, life: 0.85 });
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
  drawPlatforms();
  drawCoins();
  drawPlayer();
  drawParticles();
  drawPopups();
  drawWorldHud();
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, palette.bgTop);
  grad.addColorStop(1, palette.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  state.stars.forEach((star) => {
    ctx.globalAlpha = star.alpha + Math.sin(state.time * 2 + star.y) * 0.08;
    ctx.fillStyle = palette.white;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  state.skyline.forEach((building, i) => {
    const baseX = ((building.x - state.distance * (0.1 + i * 0.004)) % (WIDTH + 320)) - 140;
    const glow = 0.18 + (Math.sin(state.time * 1.2 + building.pulse) + 1) * 0.08;
    ctx.fillStyle = `rgba(138,125,255,${0.08 + glow * 0.35})`;
    ctx.fillRect(baseX, HEIGHT - 150 - building.h, building.w, building.h);
    for (let y = HEIGHT - 140 - building.h; y < HEIGHT - 150; y += 28) {
      for (let x = baseX + 14; x < baseX + building.w - 10; x += 24) {
        ctx.fillStyle = Math.random() > 0.55 ? 'rgba(114,246,255,0.09)' : 'rgba(255,217,104,0.08)';
        ctx.fillRect(x, y, 8, 12);
      }
    }
  });

  const horizon = ctx.createLinearGradient(0, GROUND_Y - 90, 0, HEIGHT);
  horizon.addColorStop(0, 'rgba(114,246,255,0)');
  horizon.addColorStop(1, 'rgba(114,246,255,0.1)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, GROUND_Y - 90, WIDTH, 160);
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

function drawPlatforms() {
  state.platforms.forEach((platform) => {
    const glow = platform.touched ? palette.coral : palette.cyan;
    ctx.save();
    ctx.translate(platform.shake, 0);
    ctx.shadowColor = glow;
    ctx.shadowBlur = platform.touched ? 14 : 24;
    const body = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
    body.addColorStop(0, platform.touched ? '#ff8da1' : '#9af8ff');
    body.addColorStop(1, platform.touched ? '#ff5f7f' : '#46d6f2');
    roundRect(platform.x, platform.y, platform.width, platform.height, 12, body);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(platform.x + 10, platform.y + 5, platform.width - 20, 3);
    ctx.restore();
  });
}

function drawCoins() {
  state.coins.forEach((coin) => {
    const y = coin.y + Math.sin(coin.bob) * 6;
    ctx.save();
    ctx.translate(coin.x, y);
    ctx.rotate(state.time * 6 + coin.bob);
    ctx.shadowColor = 'rgba(255,217,104,0.5)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = palette.gold;
    ctx.beginPath();
    ctx.arc(0, 0, coin.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-2, -6, 4, 12);
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

  ctx.shadowColor = palette.violet;
  ctx.shadowBlur = 22;
  const body = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
  body.addColorStop(0, '#b7afff');
  body.addColorStop(1, '#6f61ff');
  roundRect(p.x, p.y + 10, p.w, p.h - 10, 18, body);

  ctx.fillStyle = palette.white;
  ctx.fillRect(p.x + 13, p.y + 18, 11, 12);
  ctx.fillRect(p.x + 30, p.y + 18, 11, 12);
  ctx.fillStyle = '#11152a';
  ctx.fillRect(p.x + 16, p.y + 21, 5, 7);
  ctx.fillRect(p.x + 33, p.y + 21, 5, 7);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(p.x + 10, p.y + 14, p.w - 20, 5);
  ctx.restore();

  ctx.fillStyle = 'rgba(114,246,255,0.25)';
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
    ctx.globalAlpha = Math.min(1, popup.life / 0.85);
    ctx.fillStyle = popup.color;
    ctx.fillText(popup.text, popup.x, popup.y);
  });
  ctx.restore();
}

function drawWorldHud() {
  if (state.mode !== 'playing') return;
  ctx.save();
  ctx.fillStyle = 'rgba(7,11,22,0.55)';
  roundRect(28, 24, 250, 82, 20, 'rgba(7,11,22,0.55)');
  ctx.fillStyle = palette.white;
  ctx.font = '700 18px Inter';
  ctx.fillText('Speed', 52, 54);
  ctx.fillText('Rush', 52, 86);
  ctx.fillStyle = palette.cyan;
  ctx.fillRect(118, 42, Math.min(130, (state.speed - BASE_SCROLL) * 0.6 + 22), 10);
  ctx.fillStyle = state.combo > 2 ? palette.gold : palette.violetSoft;
  ctx.fillRect(118, 74, Math.min(130, state.combo * 16 + 18), 10);
  ctx.restore();
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
    land: [220, 330, 0.08, 'square'],
    coin: [880, 1320, 0.12, 'triangle'],
    lose: [220, 140, 0.35, 'sawtooth'],
  };

  const [from, to, duration, wave] = tones[type] || tones.jump;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1600;

  osc.type = wave;
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(to, now + duration);

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
  const stepLength = 0.22;
  if (state.musicClock < stepLength) return;
  state.musicClock -= stepLength;
  const pattern = [262, 330, 392, 523, 392, 330, 294, 330];
  const bass = [131, 131, 147, 147, 165, 165, 147, 131];
  const note = pattern[state.musicStep % pattern.length];
  const low = bass[state.musicStep % bass.length];
  state.musicStep += 1;
  playMusicNote(note, 0.08, 'square', 0.018);
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
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();
    requestJump();
  }
  if (event.code === 'KeyP' || event.code === 'Escape') {
    event.preventDefault();
    togglePause();
  }
  if (event.code === 'KeyR' && state.mode === 'gameover') {
    event.preventDefault();
    startGame();
  }
});

canvas.addEventListener('pointerdown', handlePointer);
startButton.addEventListener('click', startGame);
resumeButton.addEventListener('click', resumeGame);
restartButton.addEventListener('click', startGame);

bestValue.textContent = state.best;
requestAnimationFrame(frame);
render();
