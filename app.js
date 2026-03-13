// ─── State ───
let soundEnabled = true;
let audioCtx = null;
let ambientOsc = null;
let ambientGain = null;
let ambientLfo = null;
let currentMessage = null;
let collectedCount = 0;
let collectedFragments = [];
let activeTab = "sky";
let shootingStarTimer = null;

// ─── DOM Refs ───
const $ = (id) => document.getElementById(id);

// ─── localStorage helpers ───
function loadTrophies() {
  try { return JSON.parse(localStorage.getItem("lamaStars_trophies")) || []; }
  catch { return []; }
}
function saveTrophies(t) { localStorage.setItem("lamaStars_trophies", JSON.stringify(t)); }

function loadSeenMessages() {
  try { return JSON.parse(localStorage.getItem("lamaStars_seenMessages")) || []; }
  catch { return []; }
}
function saveSeenMessages(s) { localStorage.setItem("lamaStars_seenMessages", JSON.stringify(s)); }

function loadCurrentRound() {
  try { return JSON.parse(localStorage.getItem("lamaStars_currentRound")); }
  catch { return null; }
}
function saveCurrentRound(r) {
  if (r) localStorage.setItem("lamaStars_currentRound", JSON.stringify(r));
  else localStorage.removeItem("lamaStars_currentRound");
}

function isFirstVisit() {
  return localStorage.getItem("lamaStars_firstVisit") !== "false";
}
function markVisited() {
  localStorage.setItem("lamaStars_firstVisit", "false");
}

// Remove old keys
function cleanOldKeys() {
  localStorage.removeItem("lamaStars_firstSessionComplete");
  localStorage.removeItem("lamaStars_dailyProgress");
}

// ─── Star Color Temperatures ───
// Realistic star colors based on spectral class
const STAR_COLORS = [
  { r: 155, g: 176, b: 255, name: "blue-white" },   // O/B class — hot
  { r: 170, g: 191, b: 255, name: "blue-white2" },
  { r: 202, g: 215, b: 255, name: "white-blue" },    // A class
  { r: 248, g: 247, b: 255, name: "pure-white" },     // F class
  { r: 255, g: 244, b: 234, name: "warm-white" },     // G class (Sun-like)
  { r: 255, g: 210, b: 161, name: "yellow" },          // K class
  { r: 255, g: 204, b: 111, name: "orange" },          // K class warm
  { r: 255, g: 183, b: 108, name: "orange-red" },      // M class
];

// Weight distribution: more dim white stars, fewer bright colorful ones
const COLOR_WEIGHTS = [0.08, 0.10, 0.18, 0.25, 0.18, 0.10, 0.07, 0.04];

function pickStarColor() {
  let r = Math.random();
  for (let i = 0; i < COLOR_WEIGHTS.length; i++) {
    r -= COLOR_WEIGHTS[i];
    if (r <= 0) return STAR_COLORS[i];
  }
  return STAR_COLORS[3]; // fallback: pure white
}

// ─── Canvas Starfield ───
let bgStars = [];
let starfieldCtx = null;
let twinkleRafId = null;

function initStarfield() {
  const canvas = $("starfieldCanvas");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  starfieldCtx = canvas.getContext("2d");
  starfieldCtx.scale(dpr, dpr);

  const w = window.innerWidth;
  const h = window.innerHeight;

  // Generate ~600 background stars
  bgStars = [];
  for (let i = 0; i < 600; i++) {
    const color = pickStarColor();
    // More stars near center/milky way band
    let x = Math.random() * w;
    let y = Math.random() * h;

    // Brightness: most are dim, few are bright
    const brightRoll = Math.random();
    let brightness, size;
    if (brightRoll < 0.6) {
      brightness = 0.15 + Math.random() * 0.25; // dim
      size = 0.3 + Math.random() * 0.5;
    } else if (brightRoll < 0.9) {
      brightness = 0.4 + Math.random() * 0.35; // medium
      size = 0.6 + Math.random() * 0.8;
    } else {
      brightness = 0.75 + Math.random() * 0.25; // bright
      size = 1.0 + Math.random() * 1.2;
    }

    bgStars.push({
      x, y, size, brightness,
      baseBrightness: brightness,
      color,
      // Twinkle parameters — each star gets unique frequency + phase
      twinkleSpeed: 0.5 + Math.random() * 2.5,  // cycles per second
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleAmount: 0.1 + Math.random() * 0.4,  // how much it varies
      // Atmospheric scintillation — rapid flicker
      scintSpeed: 3 + Math.random() * 8,
      scintPhase: Math.random() * Math.PI * 2,
      scintAmount: 0.02 + Math.random() * 0.08,
    });
  }

  startTwinkleLoop();
}

function startTwinkleLoop() {
  let lastTime = 0;
  function animate(timestamp) {
    const t = timestamp / 1000; // seconds
    const ctx = starfieldCtx;
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    for (const s of bgStars) {
      // Smooth twinkle + rapid scintillation
      const twinkle = Math.sin(t * s.twinkleSpeed + s.twinklePhase) * s.twinkleAmount;
      const scint = Math.sin(t * s.scintSpeed + s.scintPhase) * s.scintAmount;
      const alpha = Math.max(0.05, Math.min(1, s.baseBrightness + twinkle + scint));

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${alpha})`;
      ctx.fill();

      // Glow halo for brighter stars
      if (s.baseBrightness > 0.5) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${alpha * 0.08})`;
        ctx.fill();
      }
    }

    twinkleRafId = requestAnimationFrame(animate);
  }
  twinkleRafId = requestAnimationFrame(animate);
}

// ─── Milky Way ───
function renderMilkyWay() {
  const canvas = $("milkyWayCanvas");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const w = window.innerWidth;
  const h = window.innerHeight;

  // Diagonal band from top-left to bottom-right
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.5); // slight angle
  ctx.translate(-w / 2, -h / 2);

  // Main diffuse glow
  const grad = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.7);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(0.3, "rgba(120, 130, 180, 0.04)");
  grad.addColorStop(0.45, "rgba(140, 150, 200, 0.07)");
  grad.addColorStop(0.5, "rgba(150, 160, 210, 0.08)");
  grad.addColorStop(0.55, "rgba(140, 150, 200, 0.07)");
  grad.addColorStop(0.7, "rgba(120, 130, 180, 0.04)");
  grad.addColorStop(1, "transparent");

  ctx.fillStyle = grad;
  ctx.fillRect(-w * 0.3, 0, w * 1.6, h);

  // Scatter tiny dense stars along the band
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * w * 1.2 - w * 0.1;
    const bandCenter = h * 0.48;
    const bandWidth = h * 0.15;
    // Gaussian-ish distribution around center
    const y = bandCenter + (Math.random() + Math.random() + Math.random() - 1.5) * bandWidth;
    const alpha = 0.1 + Math.random() * 0.25;
    const sz = 0.2 + Math.random() * 0.6;

    ctx.beginPath();
    ctx.arc(x, y, sz, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 210, 240, ${alpha})`;
    ctx.fill();
  }

  ctx.restore();
}

// ─── Pixel Heart ───
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

function createBigHeart() {
  const grid = $("bigHeart");
  while (grid.firstChild) grid.removeChild(grid.firstChild);
  for (let r = 0; r < HEART_GRID.length; r++) {
    for (let c = 0; c < HEART_GRID[0].length; c++) {
      const px = document.createElement("div");
      px.className = "heart-pixel";
      px.dataset.row = r;
      px.dataset.col = c;
      if (!HEART_GRID[r][c]) px.style.visibility = "hidden";
      grid.appendChild(px);
    }
  }
}

function updateBigHeart(fillCount) {
  // fillCount: 0-5, each fills 2 rows from bottom
  const grid = $("bigHeart");
  const pixels = grid.querySelectorAll(".heart-pixel");
  const rows = HEART_GRID.length; // 10
  const fillRow = rows - (fillCount * 2);

  pixels.forEach(px => {
    const r = parseInt(px.dataset.row);
    if (r >= fillRow && px.style.visibility !== "hidden") {
      px.style.backgroundColor = "#ef4444";
      px.style.opacity = "1";
    } else {
      px.style.backgroundColor = "#1e1e4a";
      px.style.opacity = "0.3";
    }
  });

  // Glow intensity
  const glowIntensity = fillCount * 6;
  const wrap = $("bigHeartWrap");
  if (wrap) {
    wrap.style.filter = fillCount > 0
      ? `drop-shadow(0 0 ${glowIntensity}px rgba(239, 68, 68, 0.5))`
      : "none";
  }
}

// ─── Web Audio ───
function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function startAmbient() {
  if (!audioCtx || ambientOsc) return;
  // Sine drone at 80Hz, barely audible
  ambientOsc = audioCtx.createOscillator();
  ambientOsc.type = "sine";
  ambientOsc.frequency.value = 80;

  ambientGain = audioCtx.createGain();
  ambientGain.gain.value = soundEnabled ? 0.03 : 0;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 200;

  // Slow LFO on gain
  ambientLfo = audioCtx.createOscillator();
  ambientLfo.type = "sine";
  ambientLfo.frequency.value = 0.15;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0.01;
  ambientLfo.connect(lfoGain);
  lfoGain.connect(ambientGain.gain);

  ambientOsc.connect(filter);
  filter.connect(ambientGain);
  ambientGain.connect(audioCtx.destination);

  ambientOsc.start();
  ambientLfo.start();
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
    gain.gain.setValueAtTime(0.12, now + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.8);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.8);
  });
}

function playHeartFill() {
  if (!soundEnabled) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  // Low thud
  const osc1 = audioCtx.createOscillator();
  const g1 = audioCtx.createGain();
  osc1.type = "sine";
  osc1.frequency.value = 100;
  g1.gain.setValueAtTime(0.15, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc1.connect(g1).connect(audioCtx.destination);
  osc1.start(now);
  osc1.stop(now + 0.1);
  // High shimmer
  const osc2 = audioCtx.createOscillator();
  const g2 = audioCtx.createGain();
  osc2.type = "sine";
  osc2.frequency.value = 2000;
  g2.gain.setValueAtTime(0.06, now + 0.02);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  osc2.connect(g2).connect(audioCtx.destination);
  osc2.start(now + 0.02);
  osc2.stop(now + 0.07);
}

function playExplosion() {
  if (!soundEnabled) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, now + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 1.0);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 1.0);
  });
}

function playTrophyJingle() {
  if (!soundEnabled) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  // E5, G#5, B5, E6 — triangle wave
  const notes = [659.25, 830.61, 987.77, 1318.51];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, now + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.6);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.6);
  });
}

// ─── Screen Management ───
function showScreen(name) {
  const screens = ["welcomeScreen", "skyScreen", "revealScreen", "trophyScreen"];
  screens.forEach(s => {
    const el = $(s);
    if (s === name) {
      el.classList.remove("hidden");
      el.classList.add("fade-in");
    } else {
      el.classList.add("hidden");
      el.classList.remove("fade-in");
    }
  });

  // Show/hide sky-specific elements
  const skyElements = ["moon", "starCounter", "bigHeartWrap"];
  skyElements.forEach(id => {
    const el = $(id);
    if (el) {
      if (name === "skyScreen") el.classList.remove("hidden");
      else if (name !== "revealScreen" || id !== "bigHeartWrap") el.classList.add("hidden");
    }
  });
}

// ─── Tab Bar ───
function initTabBar() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      if (target === activeTab) return;
      activeTab = target;
      tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === target));
      if (target === "sky") {
        showScreen("skyScreen");
      } else {
        renderTrophyShelf();
        showScreen("trophyScreen");
      }
    });
  });
}

// ─── Message Selection ───
function pickMessage() {
  const seen = loadSeenMessages();
  let available = MESSAGES.filter(m => !seen.includes(m.id));
  if (available.length === 0) {
    // All seen — reset
    saveSeenMessages([]);
    available = MESSAGES;
  }
  const idx = Math.floor(Math.random() * available.length);
  return available[idx];
}

// ─── Star Placement ───
function generateTappableStars(count) {
  const canvas = $("skyCanvas");
  while (canvas.firstChild) canvas.removeChild(canvas.firstChild);

  const stars = [];
  const minSpacing = 8; // percentage

  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      const x = 5 + Math.random() * 90; // 5-95%
      const y = 5 + Math.random() * 55; // top 60% only (5-60%)

      // Check spacing
      let tooClose = false;
      for (const s of stars) {
        const dx = x - s.x;
        const dy = y - s.y;
        if (Math.sqrt(dx * dx + dy * dy) < minSpacing) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      stars.push({ x, y });
      placed = true;
      break;
    }
    if (!placed && stars.length < count) {
      // Place anyway with looser constraint
      stars.push({ x: 5 + Math.random() * 90, y: 5 + Math.random() * 55 });
    }
  }

  // Star color palette for tappable stars
  const tappableColors = [
    { core: "#fff",    mid: "rgba(200, 220, 255, 0.6)", glow: "rgba(200, 220, 255, 0.4)", outer: "rgba(200, 220, 255, 0.12)" }, // blue-white
    { core: "#fff",    mid: "rgba(255, 248, 240, 0.6)", glow: "rgba(255, 244, 234, 0.4)", outer: "rgba(255, 244, 234, 0.12)" }, // warm white
    { core: "#fff",    mid: "rgba(255, 230, 180, 0.6)", glow: "rgba(255, 210, 161, 0.4)", outer: "rgba(255, 210, 161, 0.12)" }, // yellow
    { core: "#fffdf5", mid: "rgba(248, 247, 255, 0.6)", glow: "rgba(248, 247, 255, 0.4)", outer: "rgba(248, 247, 255, 0.12)" }, // pure white
    { core: "#fff",    mid: "rgba(180, 210, 255, 0.6)", glow: "rgba(155, 176, 255, 0.4)", outer: "rgba(155, 176, 255, 0.12)" }, // blue
  ];

  // Create tappable star buttons with varied colors
  stars.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.className = "tappable-star";
    btn.setAttribute("aria-label", `Star ${i + 1}`);
    btn.setAttribute("role", "button");
    btn.style.left = `calc(${s.x}% - 22px)`;
    btn.style.top = `calc(${s.y}% - 22px)`;

    // Assign color
    const c = tappableColors[i % tappableColors.length];
    btn.style.setProperty("--star-core", c.core);
    btn.style.setProperty("--star-mid", c.mid);
    btn.style.setProperty("--star-glow", c.glow);
    btn.style.setProperty("--star-glow-outer", c.outer);
    btn.style.setProperty("--star-size", `${4 + Math.random() * 3}px`);
    btn.style.setProperty("--spike-size", `${16 + Math.random() * 12}px`);
    btn.style.setProperty("--twinkle-delay", `${Math.random() * 3}s`);
    btn.style.setProperty("--twinkle-speed", `${2.5 + Math.random() * 2}s`);

    btn.dataset.index = i;
    btn.addEventListener("click", () => onStarTap(btn, i));
    canvas.appendChild(btn);
  });
}

// ─── Star Tap Handler ───
function onStarTap(starBtn, index) {
  if (starBtn.classList.contains("collected") || collectedCount >= 5) return;

  ensureAudio();
  startAmbient();
  playChime();

  starBtn.classList.add("collected");
  collectedCount++;

  const fragmentIndex = collectedCount - 1;
  const fragmentText = currentMessage.fragments[fragmentIndex];

  // Get star position
  const starRect = starBtn.getBoundingClientRect();
  const starCx = starRect.left + starRect.width / 2;
  const starCy = starRect.top + starRect.height / 2;

  // Get heart position
  const heartEl = $("bigHeart");
  const heartRect = heartEl.getBoundingClientRect();
  const heartCx = heartRect.left + heartRect.width / 2;
  const heartCy = heartRect.top + heartRect.height / 2;

  // Create flying clone
  const clone = document.createElement("div");
  clone.style.position = "fixed";
  clone.style.width = "8px";
  clone.style.height = "8px";
  clone.style.borderRadius = "50%";
  clone.style.background = "radial-gradient(circle, #fff, #fbbf24, transparent)";
  clone.style.boxShadow = "0 0 12px 4px rgba(251, 191, 36, 0.6)";
  clone.style.zIndex = "35";
  clone.style.pointerEvents = "none";
  clone.style.left = `${starCx - 4}px`;
  clone.style.top = `${starCy - 4}px`;
  document.body.appendChild(clone);

  // Show fragment text mid-flight
  const fragEl = document.createElement("div");
  fragEl.className = "flight-fragment";
  if (currentMessage.lang === "ar") {
    fragEl.classList.add("font-arabic");
    fragEl.dir = "rtl";
  }
  fragEl.textContent = fragmentText;
  fragEl.style.left = `${starCx}px`;
  fragEl.style.top = `${starCy - 20}px`;
  $("fragmentFlight").appendChild(fragEl);

  // Animate flight using Web Animations API
  const flightDuration = 1200;
  clone.animate([
    { left: `${starCx - 4}px`, top: `${starCy - 4}px` },
    { left: `${heartCx - 4}px`, top: `${heartCy - 4}px` }
  ], {
    duration: flightDuration,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    fill: "forwards"
  });

  // Fragment text appears at 300ms, fades
  setTimeout(() => {
    fragEl.style.opacity = "1";
    fragEl.style.transition = "opacity 0.4s ease, transform 0.6s ease";
    fragEl.style.transform = "translateY(-10px)";
  }, 300);
  setTimeout(() => {
    fragEl.style.opacity = "0";
  }, 800);

  // On flight end
  setTimeout(() => {
    clone.remove();
    fragEl.remove();

    playHeartFill();
    updateBigHeart(collectedCount);
    collectedFragments.push(fragmentText);

    // Update counter
    $("starCounter").textContent = `${collectedCount} / 5 stars collected`;

    // Save progress
    saveCurrentRound({
      messageId: currentMessage.id,
      collectedFragments: collectedFragments.slice()
    });

    // Check if done
    if (collectedCount >= 5) {
      setTimeout(() => triggerHeartExplosion(), 600);
    }
  }, flightDuration);
}

// ─── Heart Explosion ───
function triggerHeartExplosion() {
  playExplosion();

  const heartWrap = $("bigHeartWrap");
  const heartRect = heartWrap.getBoundingClientRect();
  const cx = heartRect.left + heartRect.width / 2;
  const cy = heartRect.top + heartRect.height / 2;

  // Heart scale up and fade
  heartWrap.style.animation = "heartExplode 0.8s ease-out forwards";

  // Spawn particles
  const symbols = ["\u2764", "\u2728", "\u2726", "\uD83D\uDC96", "\u2B50", "\u2727"];
  for (let i = 0; i < 20; i++) {
    const p = document.createElement("div");
    p.className = "explosion-particle";
    p.textContent = symbols[i % symbols.length];
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    const angle = (i / 20) * Math.PI * 2;
    const dist = 60 + Math.random() * 100;
    p.style.setProperty("--px", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--py", `${Math.sin(angle) * dist}px`);
    p.style.animationDelay = `${Math.random() * 0.3}s`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2000);
  }

  // Transition to reveal
  setTimeout(() => {
    heartWrap.style.animation = "";
    heartWrap.classList.add("hidden");
    $("starCounter").classList.add("hidden");
    showRevealScreen();
  }, 1500);
}

// ─── Reveal Screen ───
function showRevealScreen() {
  showScreen("revealScreen");
  $("tabBar").classList.add("hidden");

  const assembly = $("fragmentAssembly");
  while (assembly.firstChild) assembly.removeChild(assembly.firstChild);
  assembly.dir = currentMessage.lang === "ar" ? "rtl" : "ltr";
  if (currentMessage.lang === "ar") {
    assembly.classList.add("font-arabic");
  } else {
    assembly.classList.remove("font-arabic");
  }

  // Create fragment elements at scattered positions
  currentMessage.fragments.forEach((frag, i) => {
    const span = document.createElement("span");
    span.className = "assembled-fragment";
    span.textContent = frag;
    // Random scattered offsets
    const fromX = (Math.random() - 0.5) * 300;
    const fromY = (Math.random() - 0.5) * 200;
    span.style.setProperty("--fromX", `${fromX}px`);
    span.style.setProperty("--fromY", `${fromY}px`);
    assembly.appendChild(span);
  });

  // Stagger animation into place
  const fragments = assembly.querySelectorAll(".assembled-fragment");
  fragments.forEach((f, i) => {
    setTimeout(() => {
      f.classList.add("in-place");
    }, 400 + i * 300);
  });

  // Show buttons after assembly completes
  const totalDelay = 400 + currentMessage.fragments.length * 300 + 500;
  setTimeout(() => {
    $("collectTrophyBtn").classList.add("visible");
  }, totalDelay);
}

// ─── Trophy Collection ───
function collectTrophy() {
  const trophies = loadTrophies();
  const icon = TROPHY_ICONS[trophies.length % TROPHY_ICONS.length];
  const trophy = {
    id: currentMessage.id,
    icon: icon,
    message: currentMessage.fullText,
    lang: currentMessage.lang,
    date: new Date().toISOString().slice(0, 10)
  };
  trophies.push(trophy);
  saveTrophies(trophies);

  // Mark message seen
  const seen = loadSeenMessages();
  if (!seen.includes(currentMessage.id)) {
    seen.push(currentMessage.id);
    saveSeenMessages(seen);
  }

  // Clear round
  saveCurrentRound(null);

  playTrophyJingle();

  // Show trophy earned animation
  $("collectTrophyBtn").classList.remove("visible");

  const anim = document.createElement("div");
  anim.className = "trophy-earned";
  anim.textContent = icon;
  anim.style.position = "fixed";
  anim.style.top = "50%";
  anim.style.left = "50%";
  anim.style.transform = "translate(-50%, -50%)";
  anim.style.zIndex = "55";
  document.body.appendChild(anim);

  setTimeout(() => {
    anim.remove();
    $("newRoundBtn").classList.add("visible");
  }, 1000);
}

function startNewRound() {
  // Reset state
  collectedCount = 0;
  collectedFragments = [];
  $("collectTrophyBtn").classList.remove("visible");
  $("newRoundBtn").classList.remove("visible");

  // Pick new message
  currentMessage = pickMessage();
  saveCurrentRound({ messageId: currentMessage.id, collectedFragments: [] });

  // Reset heart
  createBigHeart();
  updateBigHeart(0);
  $("bigHeartWrap").classList.remove("hidden");
  $("bigHeartWrap").style.animation = "";

  // Reset counter
  $("starCounter").textContent = "0 / 5 stars collected";
  $("starCounter").classList.remove("hidden");

  // Generate new stars
  generateTappableStars(20);

  // Show sky + tab bar
  activeTab = "sky";
  document.querySelectorAll(".tab-btn").forEach(t =>
    t.classList.toggle("active", t.dataset.tab === "sky")
  );
  $("tabBar").classList.remove("hidden");
  showScreen("skyScreen");
}

// ─── Trophy Shelf ───
function renderTrophyShelf() {
  const grid = $("trophyGrid");
  while (grid.firstChild) grid.removeChild(grid.firstChild);
  const trophies = loadTrophies();

  if (trophies.length === 0) {
    const empty = document.createElement("div");
    empty.className = "trophy-empty";
    empty.textContent = "No trophies yet \u2014 go pick some stars!";
    grid.appendChild(empty);
    return;
  }

  trophies.forEach((t) => {
    const cell = document.createElement("div");
    cell.className = "trophy-cell";

    const iconSpan = document.createElement("span");
    iconSpan.className = "trophy-icon";
    iconSpan.textContent = t.icon;

    const dateSpan = document.createElement("span");
    dateSpan.className = "trophy-date";
    dateSpan.textContent = t.date;

    cell.appendChild(iconSpan);
    cell.appendChild(dateSpan);
    cell.addEventListener("click", () => showTrophyModal(t));
    grid.appendChild(cell);
  });
}

function showTrophyModal(trophy) {
  $("trophyModalIcon").textContent = trophy.icon;
  const textEl = $("trophyModalText");
  textEl.textContent = trophy.message;
  textEl.dir = trophy.lang === "ar" ? "rtl" : "ltr";
  if (trophy.lang === "ar") textEl.classList.add("font-arabic");
  else textEl.classList.remove("font-arabic");
  $("trophyModalDate").textContent = trophy.date;
  $("trophyModal").classList.remove("hidden");
}

// ─── Shooting Stars ───
function spawnShootingStar() {
  const container = $("shootingStarContainer");
  const star = document.createElement("div");
  star.className = "shooting-star";
  star.style.top = `${5 + Math.random() * 40}%`;
  star.style.left = `${Math.random() * 60}%`;
  // Vary angle and duration for realism
  const angle = -25 - Math.random() * 25; // -25 to -50 degrees
  const duration = 0.6 + Math.random() * 0.8; // 0.6-1.4s
  star.style.setProperty("--shoot-angle", `${angle}deg`);
  star.style.setProperty("--shoot-duration", `${duration}s`);
  star.style.opacity = `${0.6 + Math.random() * 0.4}`;
  container.appendChild(star);
  setTimeout(() => star.remove(), duration * 1000 + 500);
}

function startShootingStars() {
  if (shootingStarTimer) return;
  function scheduleNext() {
    const delay = 8000 + Math.random() * 7000; // 8-15s
    shootingStarTimer = setTimeout(() => {
      spawnShootingStar();
      scheduleNext();
    }, delay);
  }
  scheduleNext();
}

// ─── Resume Round ───
function resumeRound(saved) {
  const msg = MESSAGES.find(m => m.id === saved.messageId);
  if (!msg) {
    saveCurrentRound(null);
    return false;
  }
  currentMessage = msg;
  collectedFragments = saved.collectedFragments || [];
  collectedCount = collectedFragments.length;
  return true;
}

// ─── Resize Handler ───
let resizeTimeout = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (twinkleRafId) cancelAnimationFrame(twinkleRafId);
    initStarfield();
    renderMilkyWay();
  }, 200);
});

// ─── Init ───
document.addEventListener("DOMContentLoaded", () => {
  cleanOldKeys();
  initStarfield();
  renderMilkyWay();

  createBigHeart();
  updateBigHeart(0);

  // Sound toggle
  $("soundToggle").addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    $("soundToggle").textContent = soundEnabled ? "\uD83D\uDD0A" : "\uD83D\uDD07";
    if (ambientGain) {
      ambientGain.gain.value = soundEnabled ? 0.03 : 0;
    }
  });

  // Tab bar
  initTabBar();

  // Trophy modal close
  $("trophyModalClose").addEventListener("click", () => {
    $("trophyModal").classList.add("hidden");
  });

  // Reveal screen buttons
  $("collectTrophyBtn").addEventListener("click", collectTrophy);
  $("newRoundBtn").addEventListener("click", startNewRound);

  // Welcome / resume logic
  const savedRound = loadCurrentRound();

  if (isFirstVisit()) {
    // Show welcome screen
    $("beginBtn").addEventListener("click", () => {
      ensureAudio();
      startAmbient();
      playChime();
      markVisited();

      // Start first round
      currentMessage = pickMessage();
      saveCurrentRound({ messageId: currentMessage.id, collectedFragments: [] });
      collectedCount = 0;
      collectedFragments = [];

      generateTappableStars(20);
      $("starCounter").textContent = "0 / 5 stars collected";

      showScreen("skyScreen");
      $("tabBar").classList.remove("hidden");
      $("moon").classList.remove("hidden");
      startShootingStars();
    });
  } else if (savedRound && resumeRound(savedRound)) {
    // Resume mid-round
    $("welcomeScreen").classList.add("hidden");
    generateTappableStars(20);
    updateBigHeart(collectedCount);
    $("starCounter").textContent = `${collectedCount} / 5 stars collected`;
    showScreen("skyScreen");
    $("tabBar").classList.remove("hidden");
    $("moon").classList.remove("hidden");
    startShootingStars();
  } else {
    // Returning user, no active round — start fresh
    $("beginBtn").textContent = "Pick Stars";
    $("beginBtn").addEventListener("click", () => {
      ensureAudio();
      startAmbient();
      playChime();

      currentMessage = pickMessage();
      saveCurrentRound({ messageId: currentMessage.id, collectedFragments: [] });
      collectedCount = 0;
      collectedFragments = [];

      generateTappableStars(20);
      $("starCounter").textContent = "0 / 5 stars collected";

      showScreen("skyScreen");
      $("tabBar").classList.remove("hidden");
      $("moon").classList.remove("hidden");
      startShootingStars();
    });
  }
});
