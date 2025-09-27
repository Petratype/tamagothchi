/* Tamagothchi - full game script (replace your old script.js) */
/* Features: start overlay, stats, feed/play/sleep, music/effects,
   pause (greys everything + shows || symbol + pauses music + stops game loop),
   restart, grow/win/dead logic. */

const GROW_SECONDS = 30;
const WIN_SECONDS = 120;
const TICK_MS = 1000;
const DECAY_PER_TICK = 1;

/* STATE */
let hunger = 50;
let happiness = 50;
let energy = 50;
let ageSeconds = 0;

let isStarted = false;
let isDead = false;
let hasWon = false;
let isPaused = false;

let gameInterval = null;
let pendingActionTimeout = null;

/* DOM */
const petImg = document.getElementById('pet');

const hungerFill = document.getElementById('hunger-fill');
const happinessFill = document.getElementById('happiness-fill');
const energyFill = document.getElementById('energy-fill');

const statusText = document.getElementById('status');
const hintText = document.getElementById('hint');

const controlsWrapper = document.getElementById('controls');
const restartWrapper = document.getElementById('restart');

const startBtn = document.getElementById('startBtn');
const feedBtn = document.getElementById('feedBtn');
const playBtn = document.getElementById('playBtn');
const sleepBtn = document.getElementById('sleepBtn');
const restartBtn = document.getElementById('restartBtn');

const musicBtn = document.getElementById('musicBtn');
const effectsBtn = document.getElementById('effectsBtn');
const pauseBtn = document.getElementById('pauseBtn');
const pauseSymbol = document.getElementById('pauseSymbol');

const bars = document.querySelectorAll('.bar');
const fills = document.querySelectorAll('.fill');
const labels = [
  document.getElementById('hunger-label'),
  document.getElementById('happiness-label'),
  document.getElementById('energy-label')
];

/* AUDIO */
const bgMusic = new Audio('Tamagothchi-Song.mp3'); bgMusic.loop = true; bgMusic.volume = 0.5;
const eatSound = new Audio('eat-sound.mp3'); eatSound.volume = 0.25;
const funSound = new Audio('fun-sound.mp3');
const sleepSound = new Audio('sleep-sound.mp3');
const deadSound = new Audio('dead-sound.mp3');
const winMusic = new Audio('win-music.mp3'); winMusic.loop = true;
const growSound = new Audio('grow-effect.mp3');

let musicEnabled = true;
let effectsEnabled = true;

/* HELPERS */
function clamp(v, a = 0, b = 100) { return Math.max(a, Math.min(b, v)); }

function updateStatBars() {
  hungerFill.style.width = `${clamp(hunger)}%`;
  happinessFill.style.width = `${clamp(happiness)}%`;
  energyFill.style.width = `${clamp(energy)}%`;
}

function currentStageName() {
  return ageSeconds >= GROW_SECONDS ? 'adult' : 'baby';
}

function safePlay(audio) {
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playEffect(audio) {
  if (!effectsEnabled) return;
  safePlay(audio);
}

/* PET GIF / ACTIONS */
function changePetGif(action) {
  if (isDead || hasWon || isPaused) return;
  const stage = currentStageName();
  const file = `${stage}-ghost-${action}.gif`;
  if (pendingActionTimeout) {
    clearTimeout(pendingActionTimeout);
    pendingActionTimeout = null;
  }
  petImg.src = file;
  // keep class for CSS animations if needed
  pendingActionTimeout = setTimeout(() => {
    pendingActionTimeout = null;
    if (isDead || hasWon || isPaused) return;
    petImg.src = `${stage}-ghost-mov.gif`;
  }, 3000);
}

function animateButton(btn) {
  btn.classList.add('btn-press');
  setTimeout(() => btn.classList.remove('btn-press'), 160);
}

/* UI helpers for dead/win */
function setDeadUI() {
  bars.forEach(b => b.classList.add('gray'));
  fills.forEach(f => f.classList.add('gray'));
  labels.forEach(l => l.classList.add('gray'));
  hintText.classList.remove('visible');
}

function restoreUI() {
  bars.forEach(b => b.classList.remove('gray'));
  fills.forEach(f => f.classList.remove('gray'));
  labels.forEach(l => l.classList.remove('gray'));
}

/* ACTIONS */
function handleFeed() {
  if (!isStarted || isDead || hasWon || isPaused) return;
  hunger = clamp(hunger + 20);
  energy = clamp(energy - 5);
  changePetGif('eat');
  playEffect(eatSound);
  animateButton(feedBtn);
  updateStatBars();
  statusText.textContent = 'You fed your goth.';
}

function handlePlay() {
  if (!isStarted || isDead || hasWon || isPaused) return;
  happiness = clamp(happiness + 20);
  hunger = clamp(hunger - 10);
  energy = clamp(energy - 10);
  changePetGif('fun');
  playEffect(funSound);
  animateButton(playBtn);
  updateStatBars();
  statusText.textContent = 'Playtime — mood up.';
}

function handleSleep() {
  if (!isStarted || isDead || hasWon || isPaused) return;
  energy = clamp(energy + 30);
  hunger = clamp(hunger - 5);
  changePetGif('sleep');
  playEffect(sleepSound);
  animateButton(sleepBtn);
  updateStatBars();
  statusText.textContent = 'Nap taken — energy rising.';
}

/* GAME STATE */
function die() {
  if (isDead) return;
  isDead = true;
  clearInterval(gameInterval);
  gameInterval = null;
  if (pendingActionTimeout) { clearTimeout(pendingActionTimeout); pendingActionTimeout = null; }
  petImg.src = 'grave.gif';
  statusText.textContent = '💀 Your goth has faded away…';
  playEffect(deadSound);
  controlsWrapper.style.display = 'none';
  restartWrapper.style.display = 'block';
  setDeadUI();
  bgMusic.pause();
}

function win() {
  if (hasWon) return;
  hasWon = true;
  clearInterval(gameInterval);
  gameInterval = null;
  if (pendingActionTimeout) { clearTimeout(pendingActionTimeout); pendingActionTimeout = null; }
  petImg.src = 'ghost-win.gif';
  statusText.textContent = '🎉 Your goth threw a ghost rave!';
  controlsWrapper.style.display = 'none';
  restartWrapper.style.display = 'block';
  winMusic.currentTime = 0;
  winMusic.play().catch(()=>{});
  bgMusic.pause();
}

function restartGame() {
  winMusic.pause();
  bgMusic.pause();
  hunger = 50;
  happiness = 50;
  energy = 50;
  ageSeconds = 0;
  isDead = false;
  hasWon = false;
  isPaused = false;

  updateStatBars();
  petImg.src = 'baby-ghost-mov.gif';
  statusText.textContent = 'Your baby goth is alive 👻';
  controlsWrapper.style.display = 'flex';
  restartWrapper.style.display = 'none';
  restoreUI();

  pauseSymbol.style.display = 'none';
  document.body.classList.remove('paused-overlay');

  if (isStarted && !gameInterval) {
    gameInterval = setInterval(mainTick, TICK_MS);
  }
  if (musicEnabled) safePlay(bgMusic);
}

/* MAIN LOOP */
function mainTick() {
  if (!isStarted || isDead || hasWon || isPaused) return;

  const beforeStage = currentStageName();
  ageSeconds++;
  const afterStage = currentStageName();
  if (beforeStage !== afterStage) {
    // play grow effect exactly when stage changes
    playEffect(growSound);
  }

  hunger = Math.max(0, hunger - DECAY_PER_TICK);
  happiness = Math.max(0, happiness - DECAY_PER_TICK);
  energy = Math.max(0, energy - DECAY_PER_TICK);

  updateStatBars();

  if (hunger <= 0 || happiness <= 0 || energy <= 0) {
    die();
    return;
  }

  if (ageSeconds >= WIN_SECONDS) {
    win();
    return;
  }

  statusText.textContent = `Your ${currentStageName()} goth is alive 👻`;
}

/* START & TOGGLES */
function startGame() {
  if (isStarted) return;
  isStarted = true;

  const overlay = document.getElementById('startOverlay');
  if (overlay) {
    overlay.classList.add('overlay-fade');
    setTimeout(()=>{ overlay.style.display = 'none'; }, 620);
  }

  petImg.style.opacity = 1;
  controlsWrapper.querySelectorAll('button').forEach(b => b.disabled = false);

  if (!gameInterval) gameInterval = setInterval(mainTick, TICK_MS);

  if (musicEnabled) safePlay(bgMusic);

  if (hintText) {
    setTimeout(()=> {
      hintText.classList.add('visible');
      setTimeout(()=> hintText.classList.remove('visible'), 6000);
    }, 10000);
  }
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  musicBtn.textContent = musicEnabled ? '♪ Music: On' : '♪ Music: Off';
  if (musicEnabled && !isPaused) safePlay(bgMusic);
  else bgMusic.pause();
}

function toggleEffects() {
  effectsEnabled = !effectsEnabled;
  effectsBtn.textContent = effectsEnabled ? '🔊 Effects: On' : '🔇 Effects: Off';
}

/* PAUSE: grey everything, stop loop actions, pause music, show || symbol */
function togglePause() {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Play' : 'Pause';

  if (isPaused) {
    document.body.classList.add('paused-overlay');
    pauseSymbol.style.display = 'block';
    bgMusic.pause();
  } else {
    document.body.classList.remove('paused-overlay');
    pauseSymbol.style.display = 'none';
    if (musicEnabled) safePlay(bgMusic);
  }
}

/* EVENTS */
feedBtn.addEventListener('click', handleFeed);
playBtn.addEventListener('click', handlePlay);
sleepBtn.addEventListener('click', handleSleep);

restartBtn.addEventListener('click', restartGame);
startBtn.addEventListener('click', startGame);

musicBtn.addEventListener('click', toggleMusic);
effectsBtn.addEventListener('click', toggleEffects);
pauseBtn.addEventListener('click', togglePause);

/* INIT */
updateStatBars();
controlsWrapper.querySelectorAll('button').forEach(b => b.disabled = true);
