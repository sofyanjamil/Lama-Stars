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

// ─── Starfield Generation ───
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

  // Create tappable star buttons
  stars.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.className = "tappable-star";
    btn.setAttribute("aria-label", `Star ${i + 1}`);
    btn.setAttribute("role", "button");
    btn.style.left = `calc(${s.x}% - 22px)`;
    btn.style.top = `calc(${s.y}% - 22px)`;
    btn.style.setProperty("--twinkle-delay", `${Math.random() * 2}s`);
    btn.dataset.index = i;
    btn.addEventListener("click", () => onStarTap(btn, i));
    canvas.appendChild(btn);
  });

  // Add ~40 background (non-tappable) dimmer stars
  for (let i = 0; i < 40; i++) {
    const dot = document.createElement("div");
    dot.className = "bg-star";
    const size = 1 + Math.random() * 2;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.top = `${Math.random() * 100}%`;
    dot.style.setProperty("--twinkle-delay", `${Math.random() * 3}s`);
    canvas.appendChild(dot);
  }
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
  container.appendChild(star);
  setTimeout(() => star.remove(), 1500);
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

// ─── Init ───
document.addEventListener("DOMContentLoaded", () => {
  cleanOldKeys();
  generateStars(200, "stars1");
  generateStars(100, "stars2");
  generateStars(50, "stars3");

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
