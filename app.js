// ─── Seeded PRNG (Mulberry32) ───
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashDateString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

function getDailyAffirmations() {
  const today = new Date().toISOString().slice(0, 10);
  const seed = hashDateString(today);
  const rng = mulberry32(seed);
  const indices = Array.from({ length: DAILY_POOL.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, 5).map(i => DAILY_POOL[i]);
}

// ─── State ───
let currentCards = [];
let cardIndex = 0;
let barPercent = 20;
let soundEnabled = true;
let audioCtx = null;
let sessionType = "intro";

// ─── DOM refs ───
const $ = (id) => document.getElementById(id);
const welcomeScreen = $("welcomeScreen");
const gameScreen = $("gameScreen");
const winScreen = $("winScreen");
const cardText = $("cardText");
const cardEl = $("card");
const tapPrompt = $("tapPrompt");
const soundToggle = $("soundToggle");
const cardCounter = $("cardCounter");

// ─── Starfield generation ───
function generateStars(count, layer) {
  const el = document.getElementById(layer);
  const shadows = [];
  for (let i = 0; i < count; i++) {
    const x = Math.random() * 2000;
    const y = Math.random() * 2000;
    shadows.push(`${x}px ${y}px #fff`);
  }
  el.style.boxShadow = shadows.join(", ");
}

// ─── Pixel Heart Rendering ───
const HEART_GRID = [
  [0,1,1,0,0,0,0,1,1,0,0],
  [1,1,1,1,0,0,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,1,0,0],
  [0,0,0,1,1,1,1,1,0,0,0],
  [0,0,0,0,1,1,1,0,0,0,0],
  [0,0,0,0,0,1,0,0,0,0,0],
];

function createHeart(containerId) {
  const container = document.getElementById(containerId);
  const grid = container.querySelector(".heart-grid");
  // Clear existing children safely
  while (grid.firstChild) grid.removeChild(grid.firstChild);

  const rows = HEART_GRID.length;
  const cols = HEART_GRID[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pixel = document.createElement("div");
      pixel.className = "heart-pixel";
      pixel.dataset.row = r;
      pixel.dataset.col = c;
      if (!HEART_GRID[r][c]) {
        pixel.style.visibility = "hidden";
      }
      grid.appendChild(pixel);
    }
  }
}

function updateHeart(containerId, color, percent) {
  const grid = document.getElementById(containerId).querySelector(".heart-grid");
  const pixels = grid.querySelectorAll(".heart-pixel");
  const rows = HEART_GRID.length;
  const fillRow = Math.floor(rows * (1 - percent / 100));
  pixels.forEach((px) => {
    const r = parseInt(px.dataset.row);
    if (r >= fillRow && px.style.visibility !== "hidden") {
      px.style.backgroundColor = color;
      px.style.opacity = "1";
    } else {
      px.style.backgroundColor = "#1e1e4a";
      px.style.opacity = "0.3";
    }
  });
}

function updateAllHearts(percent) {
  updateHeart("heartEnergy", "#f59e0b", percent);
  updateHeart("heartHappiness", "#ec4899", percent);
  updateHeart("heartLove", "#ef4444", percent);
}

// ─── Web Audio API ───
function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playChime() {
  if (!soundEnabled) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  [440, 660].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, now + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.8);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.8);
  });
}

function playWinSound() {
  if (!soundEnabled) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, now + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 1.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 1.2);
  });
}

// ─── Card Display ───
function showCard(index) {
  const aff = currentCards[index];
  cardEl.classList.remove("card-enter");
  cardEl.classList.add("card-exit");

  setTimeout(() => {
    cardText.textContent = aff.text;
    cardText.dir = aff.lang === "ar" ? "rtl" : "ltr";
    cardText.className = aff.lang === "ar"
      ? "text-xl md:text-2xl leading-relaxed font-arabic"
      : "text-xl md:text-2xl leading-relaxed";
    cardCounter.textContent = `${index + 1} / ${currentCards.length}`;
    cardEl.classList.remove("card-exit");
    cardEl.classList.add("card-enter");
  }, 300);
}

function advanceCard() {
  ensureAudio();
  playChime();

  const totalCards = currentCards.length;
  const increment = sessionType === "intro" ? (80 / 7) : (80 / 5);
  barPercent = Math.min(100, barPercent + increment);
  updateAllHearts(barPercent);

  cardIndex++;

  if (sessionType === "daily") {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("lamaStars_dailyProgress", JSON.stringify({
      date: today, cardIndex, completed: cardIndex >= totalCards
    }));
  }

  if (cardIndex >= totalCards) {
    setTimeout(() => triggerWin(), 600);
  } else {
    showCard(cardIndex);
  }
}

// ─── Win State ───
function triggerWin() {
  if (sessionType === "intro") {
    localStorage.setItem("lamaStars_firstSessionComplete", "true");
  } else {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("lamaStars_dailyProgress", JSON.stringify({
      date: today, cardIndex, completed: true
    }));
  }

  playWinSound();
  spawnBloomParticles();

  setTimeout(() => {
    gameScreen.classList.add("hidden");
    winScreen.classList.remove("hidden");
    winScreen.classList.add("fade-in");
  }, 2000);
}

function spawnBloomParticles() {
  const container = document.getElementById("bloomContainer");
  // Clear safely
  while (container.firstChild) container.removeChild(container.firstChild);

  const symbols = ["\u2726", "\u2665", "\u2B50", "\u2727", "\uD83D\uDC9B", "\uD83C\uDF1F", "\uD83D\uDC96"];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("div");
    p.className = "bloom-particle";
    p.textContent = symbols[i % symbols.length];
    const angle = (i / 18) * Math.PI * 2;
    const dist = 80 + Math.random() * 120;
    p.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
    p.style.animationDelay = `${Math.random() * 0.5}s`;
    container.appendChild(p);
  }
}

// ─── State Management ───
function getSessionState() {
  const firstDone = localStorage.getItem("lamaStars_firstSessionComplete") === "true";
  const dailyRaw = localStorage.getItem("lamaStars_dailyProgress");
  const today = new Date().toISOString().slice(0, 10);

  if (!firstDone) return { mode: "intro" };

  if (dailyRaw) {
    const daily = JSON.parse(dailyRaw);
    if (daily.date === today) {
      if (daily.completed) return { mode: "completed" };
      return { mode: "daily-resume", cardIndex: daily.cardIndex };
    }
  }
  return { mode: "daily-new" };
}

function startSession() {
  const state = getSessionState();

  if (state.mode === "completed") {
    welcomeScreen.classList.add("hidden");
    winScreen.classList.remove("hidden");
    winScreen.classList.add("fade-in");
    return;
  }

  if (state.mode === "intro") {
    sessionType = "intro";
    currentCards = INTRO_AFFIRMATIONS;
    cardIndex = 0;
  } else {
    sessionType = "daily";
    currentCards = getDailyAffirmations();
    cardIndex = state.mode === "daily-resume" ? state.cardIndex : 0;
  }

  barPercent = 20 + (cardIndex * (sessionType === "intro" ? 80 / 7 : 80 / 5));

  welcomeScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameScreen.classList.add("fade-in");

  updateAllHearts(barPercent);
  showCard(cardIndex);
}

// ─── Init ───
document.addEventListener("DOMContentLoaded", () => {
  generateStars(200, "stars1");
  generateStars(100, "stars2");
  generateStars(50, "stars3");

  createHeart("heartEnergy");
  createHeart("heartHappiness");
  createHeart("heartLove");
  updateAllHearts(20);

  $("beginBtn").addEventListener("click", () => {
    ensureAudio();
    playChime();
    startSession();
  });

  cardEl.addEventListener("click", advanceCard);
  tapPrompt.addEventListener("click", advanceCard);

  soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? "\uD83D\uDD0A" : "\uD83D\uDD07";
  });

  // If returning and today already completed, skip to win screen
  const state = getSessionState();
  if (state.mode === "completed") {
    welcomeScreen.classList.add("hidden");
    winScreen.classList.remove("hidden");
  }

  // Update subtitle for returning users
  const firstDone = localStorage.getItem("lamaStars_firstSessionComplete") === "true";
  if (firstDone) {
    $("welcomeSubtitle").textContent = "Welcome back, Lama \u2665 Ready for today\u2019s cards?";
  }
});
