// ─── State ───
let soundEnabled = true;
let audioCtx = null;
let ambientNodes = [];  // all ambient audio nodes for cleanup
let ambientMasterGain = null;
let currentMessage = null;
let collectedCount = 0;
let collectedFragments = [];
let activeTab = "sky";
let shootingStarTimer = null;
let currentScene = null;
const SCENES = ["mountain", "beach", "campfire"];

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
  const cx = w / 2;
  const cy = h * 0.35; // rotation center — upper portion of sky

  // Generate ~600 background stars stored as angle+radius from center
  bgStars = [];
  for (let i = 0; i < 600; i++) {
    const color = pickStarColor();
    const x = Math.random() * w;
    const y = Math.random() * h;

    // Store polar coords relative to rotation center
    const dx = x - cx;
    const dy = y - cy;
    const angle = Math.atan2(dy, dx);
    const radius = Math.sqrt(dx * dx + dy * dy);

    // Brightness distribution
    const brightRoll = Math.random();
    let brightness, size;
    if (brightRoll < 0.6) {
      brightness = 0.15 + Math.random() * 0.25;
      size = 0.3 + Math.random() * 0.5;
    } else if (brightRoll < 0.9) {
      brightness = 0.4 + Math.random() * 0.35;
      size = 0.6 + Math.random() * 0.8;
    } else {
      brightness = 0.75 + Math.random() * 0.25;
      size = 1.0 + Math.random() * 1.2;
    }

    bgStars.push({
      angle, radius, size, brightness,
      baseBrightness: brightness,
      color,
      twinkleSpeed: 0.5 + Math.random() * 2.5,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleAmount: 0.1 + Math.random() * 0.4,
      scintSpeed: 3 + Math.random() * 8,
      scintPhase: Math.random() * Math.PI * 2,
      scintAmount: 0.02 + Math.random() * 0.08,
    });
  }

  startTwinkleLoop();
}

function startTwinkleLoop() {
  const rotationSpeed = 0.0003; // radians per second — very slow celestial rotation
  function animate(timestamp) {
    const t = timestamp / 1000;
    const ctx = starfieldCtx;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h * 0.35;
    ctx.clearRect(0, 0, w, h);

    const rotation = t * rotationSpeed;

    for (const s of bgStars) {
      // Rotate star position
      const a = s.angle + rotation;
      const sx = cx + Math.cos(a) * s.radius;
      const sy = cy + Math.sin(a) * s.radius;

      // Skip stars off-screen (with margin)
      if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;

      // Smooth twinkle + rapid scintillation
      const twinkle = Math.sin(t * s.twinkleSpeed + s.twinklePhase) * s.twinkleAmount;
      const scint = Math.sin(t * s.scintSpeed + s.scintPhase) * s.scintAmount;
      const alpha = Math.max(0.05, Math.min(1, s.baseBrightness + twinkle + scint));

      ctx.beginPath();
      ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${alpha})`;
      ctx.fill();

      // Glow halo for brighter stars
      if (s.baseBrightness > 0.5) {
        ctx.beginPath();
        ctx.arc(sx, sy, s.size * 3, 0, Math.PI * 2);
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

// ─── Realistic Moon (Canvas) ───
function renderMoon() {
  const canvas = $("moonCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const s = 140; // canvas size
  const r = 60;  // moon radius
  const cx = 70, cy = 70;

  ctx.clearRect(0, 0, s, s);

  // Outer glow layers
  [[50, 0.03], [35, 0.05], [22, 0.08], [12, 0.12]].forEach(([spread, alpha]) => {
    const g = ctx.createRadialGradient(cx, cy, r, cx, cy, r + spread);
    g.addColorStop(0, `rgba(254, 243, 199, ${alpha})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r + spread, 0, Math.PI * 2);
    ctx.fill();
  });

  // Moon base — bright side gradient
  const moonGrad = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, r);
  moonGrad.addColorStop(0, "#fefce8");
  moonGrad.addColorStop(0.3, "#fde68a");
  moonGrad.addColorStop(0.6, "#d9c56a");
  moonGrad.addColorStop(1, "#b5a050");
  ctx.fillStyle = moonGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Dark side (crescent shadow)
  ctx.fillStyle = "#050520";
  ctx.beginPath();
  ctx.arc(cx + 18, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Re-draw lit crescent
  ctx.fillStyle = moonGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Clip dark side
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#050520";
  ctx.beginPath();
  ctx.arc(cx + 22, cy - 2, r + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Maria (dark patches — lunar seas)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const maria = [
    { x: cx - 18, y: cy - 12, rx: 14, ry: 10, a: 0.06 },
    { x: cx - 8, y: cy + 8, rx: 10, ry: 8, a: 0.05 },
    { x: cx - 25, y: cy + 2, rx: 8, ry: 12, a: 0.04 },
    { x: cx - 15, y: cy - 25, rx: 7, ry: 5, a: 0.04 },
    { x: cx - 5, y: cy + 20, rx: 9, ry: 6, a: 0.05 },
  ];
  maria.forEach(m => {
    ctx.fillStyle = `rgba(80, 70, 40, ${m.a})`;
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.rx, m.ry, 0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Craters
  const craters = [
    { x: cx - 20, y: cy - 18, r: 5 },
    { x: cx - 30, y: cy + 5, r: 4 },
    { x: cx - 10, y: cy + 15, r: 6 },
    { x: cx - 5, y: cy - 8, r: 3 },
    { x: cx - 22, y: cy + 18, r: 3.5 },
    { x: cx - 35, y: cy - 5, r: 2.5 },
    { x: cx - 15, y: cy + 28, r: 2 },
  ];
  craters.forEach(c => {
    // Shadow inside crater
    const cg = ctx.createRadialGradient(c.x - 1, c.y - 1, 0, c.x, c.y, c.r);
    cg.addColorStop(0, "rgba(0, 0, 0, 0.1)");
    cg.addColorStop(0.7, "rgba(0, 0, 0, 0.05)");
    cg.addColorStop(1, "transparent");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
    // Bright rim on top edge
    ctx.strokeStyle = "rgba(255, 255, 240, 0.06)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.stroke();
  });

  // Earthshine on dark side
  ctx.fillStyle = "rgba(140, 170, 220, 0.03)";
  ctx.beginPath();
  ctx.arc(cx + 22, cy, r - 2, 0, Math.PI * 2);
  ctx.fill();

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

// ─── Scene System ───
function pickScene() {
  return SCENES[Math.floor(Math.random() * SCENES.length)];
}

function applyScene(scene) {
  currentScene = scene;
  renderSceneSilhouette(scene);
  stopAmbient();
  startAmbient(scene);

  // Campfire glow
  const glow = $("fireGlow");
  if (glow) glow.style.opacity = scene === "campfire" ? "1" : "0";
}

function renderSceneSilhouette(scene) {
  const canvas = $("sceneCanvas");
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight * 0.35;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  if (scene === "mountain") renderMountains(ctx, w, h);
  else if (scene === "beach") renderBeach(ctx, w, h);
  else if (scene === "campfire") renderCampfire(ctx, w, h);

  canvas.style.opacity = "1";
}

function renderMountains(ctx, w, h) {
  // Back range — darker, taller
  ctx.fillStyle = "#0a0f25";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.3);
  ctx.lineTo(w * 0.08, h * 0.45);
  ctx.lineTo(w * 0.18, h * 0.15);
  ctx.lineTo(w * 0.28, h * 0.4);
  ctx.lineTo(w * 0.38, h * 0.22);
  ctx.lineTo(w * 0.5, h * 0.35);
  ctx.lineTo(w * 0.6, h * 0.1);
  ctx.lineTo(w * 0.72, h * 0.38);
  ctx.lineTo(w * 0.82, h * 0.2);
  ctx.lineTo(w * 0.92, h * 0.42);
  ctx.lineTo(w, h * 0.28);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Front range — slightly lighter
  ctx.fillStyle = "#060b1a";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.55);
  ctx.lineTo(w * 0.12, h * 0.4);
  ctx.lineTo(w * 0.22, h * 0.55);
  ctx.lineTo(w * 0.35, h * 0.35);
  ctx.lineTo(w * 0.45, h * 0.5);
  ctx.lineTo(w * 0.55, h * 0.42);
  ctx.lineTo(w * 0.68, h * 0.55);
  ctx.lineTo(w * 0.78, h * 0.38);
  ctx.lineTo(w * 0.88, h * 0.52);
  ctx.lineTo(w, h * 0.45);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // Treeline at base
  ctx.fillStyle = "#040812";
  const treeBase = h * 0.7;
  for (let x = 0; x < w; x += 6 + Math.random() * 8) {
    const treeH = 8 + Math.random() * 18;
    ctx.beginPath();
    ctx.moveTo(x, treeBase);
    ctx.lineTo(x + 3, treeBase - treeH);
    ctx.lineTo(x + 6, treeBase);
    ctx.fill();
  }

  // Ground
  ctx.fillStyle = "#030710";
  ctx.fillRect(0, treeBase, w, h - treeBase);
}

function renderBeach(ctx, w, h) {
  // Ocean — dark water
  ctx.fillStyle = "#060d20";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.5);
  // Gentle wave line
  for (let x = 0; x <= w; x += 20) {
    const waveY = h * 0.5 + Math.sin(x * 0.015) * 4 + Math.sin(x * 0.008) * 6;
    ctx.lineTo(x, waveY);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Shore line — wet sand
  ctx.fillStyle = "#0a0e1a";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.72);
  for (let x = 0; x <= w; x += 15) {
    ctx.lineTo(x, h * 0.72 + Math.sin(x * 0.02) * 3);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Sand
  ctx.fillStyle = "#0c1018";
  ctx.fillRect(0, h * 0.78, w, h * 0.22);

  // Palm tree (left side)
  drawPalmTree(ctx, w * 0.12, h * 0.48, h * 0.35, -0.15);
  // Palm tree (right side, leaning right)
  drawPalmTree(ctx, w * 0.85, h * 0.52, h * 0.3, 0.2);

  // Water shimmer — tiny reflections
  for (let i = 0; i < 30; i++) {
    const sx = Math.random() * w;
    const sy = h * 0.5 + Math.random() * (h * 0.2);
    ctx.fillStyle = `rgba(150, 180, 220, ${0.03 + Math.random() * 0.05})`;
    ctx.fillRect(sx, sy, 8 + Math.random() * 15, 1);
  }
}

function drawPalmTree(ctx, x, topY, trunkH, lean) {
  // Trunk
  ctx.strokeStyle = "#050a15";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, topY + trunkH);
  // Curved trunk
  ctx.quadraticCurveTo(x + lean * trunkH, topY + trunkH * 0.5, x + lean * trunkH * 0.5, topY);
  ctx.stroke();

  // Fronds
  const tipX = x + lean * trunkH * 0.5;
  const tipY = topY;
  ctx.fillStyle = "#040910";
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI * 0.8 + (i / 6) * Math.PI * 1.6;
    const frondLen = 25 + Math.random() * 15;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    const endX = tipX + Math.cos(angle) * frondLen;
    const endY = tipY + Math.sin(angle) * frondLen;
    const cpX = tipX + Math.cos(angle) * frondLen * 0.6 + (Math.random() - 0.5) * 8;
    const cpY = tipY + Math.sin(angle) * frondLen * 0.4;
    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    ctx.quadraticCurveTo(cpX + 3, cpY + 2, tipX, tipY);
    ctx.fill();
  }
}

function renderCampfire(ctx, w, h) {
  // Rolling hills ground
  ctx.fillStyle = "#060b18";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.6);
  for (let x = 0; x <= w; x += 30) {
    ctx.lineTo(x, h * 0.6 + Math.sin(x * 0.008) * 12 + Math.sin(x * 0.003) * 20);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Flat ground
  ctx.fillStyle = "#040810";
  ctx.fillRect(0, h * 0.75, w, h * 0.25);

  // Fire logs
  const fireX = w / 2;
  const fireY = h * 0.72;

  ctx.strokeStyle = "#1a1208";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  // Log 1
  ctx.beginPath();
  ctx.moveTo(fireX - 18, fireY + 4);
  ctx.lineTo(fireX + 14, fireY + 8);
  ctx.stroke();
  // Log 2
  ctx.beginPath();
  ctx.moveTo(fireX + 16, fireY + 2);
  ctx.lineTo(fireX - 12, fireY + 10);
  ctx.stroke();

  // Fire glow on ground
  const groundGlow = ctx.createRadialGradient(fireX, fireY, 0, fireX, fireY, 50);
  groundGlow.addColorStop(0, "rgba(255, 100, 20, 0.06)");
  groundGlow.addColorStop(1, "transparent");
  ctx.fillStyle = groundGlow;
  ctx.fillRect(fireX - 60, fireY - 20, 120, 40);

  // Flame shapes (static silhouette — animation is via fireGlow CSS)
  const flames = [
    { dx: 0, h: 22, w: 6 },
    { dx: -5, h: 16, w: 5 },
    { dx: 6, h: 18, w: 5 },
    { dx: -2, h: 12, w: 4 },
    { dx: 4, h: 14, w: 4 },
  ];
  flames.forEach(f => {
    const fx = fireX + f.dx;
    const fy = fireY;
    const grad = ctx.createLinearGradient(fx, fy, fx, fy - f.h);
    grad.addColorStop(0, "rgba(255, 140, 30, 0.15)");
    grad.addColorStop(0.5, "rgba(255, 80, 10, 0.1)");
    grad.addColorStop(1, "rgba(255, 50, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(fx - f.w / 2, fy);
    ctx.quadraticCurveTo(fx - f.w / 3, fy - f.h * 0.7, fx, fy - f.h);
    ctx.quadraticCurveTo(fx + f.w / 3, fy - f.h * 0.7, fx + f.w / 2, fy);
    ctx.fill();
  });

  // Scattered rocks
  ctx.fillStyle = "#080d18";
  [[fireX - 25, fireY + 6, 5, 3], [fireX + 22, fireY + 5, 4, 3],
   [fireX - 30, fireY + 10, 6, 3], [fireX + 28, fireY + 9, 5, 3]].forEach(([rx, ry, rw, rh]) => {
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ─── Cozy Ambient Sounds ───
function stopAmbient() {
  ambientNodes.forEach(node => {
    try { node.stop(); } catch {}
    try { node.disconnect(); } catch {}
  });
  ambientNodes = [];
  ambientMasterGain = null;
}

function startAmbient(scene) {
  if (!audioCtx) return;

  ambientMasterGain = audioCtx.createGain();
  ambientMasterGain.gain.value = soundEnabled ? 1 : 0;
  ambientMasterGain.connect(audioCtx.destination);

  if (scene === "beach") startOceanWaves();
  else if (scene === "campfire") startFireCrackling();
  else if (scene === "mountain") startMountainWind();
}

function createNoiseSource() {
  // White noise buffer
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function startOceanWaves() {
  // Layer 1: deep rumble
  const noise1 = createNoiseSource();
  const lp1 = audioCtx.createBiquadFilter();
  lp1.type = "lowpass";
  lp1.frequency.value = 180;
  const g1 = audioCtx.createGain();
  g1.gain.value = 0.06;

  // Slow volume swell for wave rhythm
  const lfo1 = audioCtx.createOscillator();
  lfo1.type = "sine";
  lfo1.frequency.value = 0.08; // ~12s cycle
  const lfoGain1 = audioCtx.createGain();
  lfoGain1.gain.value = 0.03;
  lfo1.connect(lfoGain1);
  lfoGain1.connect(g1.gain);

  noise1.connect(lp1).connect(g1).connect(ambientMasterGain);
  noise1.start();
  lfo1.start();
  ambientNodes.push(noise1, lfo1);

  // Layer 2: higher hiss (foam/wash)
  const noise2 = createNoiseSource();
  const bp2 = audioCtx.createBiquadFilter();
  bp2.type = "bandpass";
  bp2.frequency.value = 800;
  bp2.Q.value = 0.5;
  const g2 = audioCtx.createGain();
  g2.gain.value = 0.015;

  const lfo2 = audioCtx.createOscillator();
  lfo2.type = "sine";
  lfo2.frequency.value = 0.12;
  const lfoGain2 = audioCtx.createGain();
  lfoGain2.gain.value = 0.01;
  lfo2.connect(lfoGain2);
  lfoGain2.connect(g2.gain);

  noise2.connect(bp2).connect(g2).connect(ambientMasterGain);
  noise2.start();
  lfo2.start();
  ambientNodes.push(noise2, lfo2);
}

function startFireCrackling() {
  // Base roar — low filtered noise
  const noise = createNoiseSource();
  const lp = audioCtx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 300;
  const g = audioCtx.createGain();
  g.gain.value = 0.04;

  // Gentle flicker
  const lfo = audioCtx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 3;
  const lfoG = audioCtx.createGain();
  lfoG.gain.value = 0.015;
  lfo.connect(lfoG);
  lfoG.connect(g.gain);

  noise.connect(lp).connect(g).connect(ambientMasterGain);
  noise.start();
  lfo.start();
  ambientNodes.push(noise, lfo);

  // Soft mid-frequency warmth layer
  const noise2 = createNoiseSource();
  const bp2 = audioCtx.createBiquadFilter();
  bp2.type = "bandpass";
  bp2.frequency.value = 500;
  bp2.Q.value = 0.8;
  const g2 = audioCtx.createGain();
  g2.gain.value = 0.02;
  noise2.connect(bp2).connect(g2).connect(ambientMasterGain);
  noise2.start();
  ambientNodes.push(noise2);
}

function startMountainWind() {
  // Soft wind — filtered noise with slow modulation
  const noise = createNoiseSource();
  const bp = audioCtx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 400;
  bp.Q.value = 0.3;
  const g = audioCtx.createGain();
  g.gain.value = 0.035;

  // Wind gusts — slow LFO
  const lfo = audioCtx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.06; // very slow
  const lfoG = audioCtx.createGain();
  lfoG.gain.value = 0.02;
  lfo.connect(lfoG);
  lfoG.connect(g.gain);

  // Second LFO modulating filter frequency (wind pitch shift)
  const lfo2 = audioCtx.createOscillator();
  lfo2.type = "sine";
  lfo2.frequency.value = 0.04;
  const lfoG2 = audioCtx.createGain();
  lfoG2.gain.value = 150;
  lfo2.connect(lfoG2);
  lfoG2.connect(bp.frequency);

  noise.connect(bp).connect(g).connect(ambientMasterGain);
  noise.start();
  lfo.start();
  lfo2.start();
  ambientNodes.push(noise, lfo, lfo2);

  // Occasional distant owl-like tone
  function scheduleOwl() {
    if (!ambientMasterGain) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const owlG = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = 380 + Math.random() * 40;
    owlG.gain.setValueAtTime(0, now);
    owlG.gain.linearRampToValueAtTime(0.015, now + 0.3);
    owlG.gain.linearRampToValueAtTime(0, now + 0.8);
    osc.connect(owlG).connect(ambientMasterGain);
    osc.start(now);
    osc.stop(now + 0.8);

    setTimeout(scheduleOwl, 12000 + Math.random() * 20000);
  }
  setTimeout(scheduleOwl, 5000 + Math.random() * 10000);
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
    // Unique drift offsets so each star wanders differently
    btn.style.setProperty("--dx1", `${(Math.random() - 0.5) * 6}px`);
    btn.style.setProperty("--dy1", `${(Math.random() - 0.5) * 6}px`);
    btn.style.setProperty("--dx2", `${(Math.random() - 0.5) * 8}px`);
    btn.style.setProperty("--dy2", `${(Math.random() - 0.5) * 8}px`);
    btn.style.setProperty("--dx3", `${(Math.random() - 0.5) * 6}px`);
    btn.style.setProperty("--dy3", `${(Math.random() - 0.5) * 6}px`);

    btn.dataset.index = i;
    btn.addEventListener("click", () => onStarTap(btn, i));
    canvas.appendChild(btn);
  });
}

// ─── Star Tap Handler ───
function onStarTap(starBtn, index) {
  if (starBtn.classList.contains("collected") || collectedCount >= 5) return;

  ensureAudio();
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

  // Spawn particles — hearts and stars only
  const symbols = ["\u2764\uFE0F", "\uD83D\uDC96", "\u2B50", "\u2B50", "\u2764\uFE0F", "\uD83D\uDC97", "\u2B50", "\uD83D\uDC95"];
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

  // Generate new stars + new scene
  generateTappableStars(20);
  applyScene(pickScene());

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

    cell.appendChild(iconSpan);
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
  renderMoon();

  createBigHeart();
  updateBigHeart(0);

  // Sound toggle
  $("soundToggle").addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    $("soundToggle").textContent = soundEnabled ? "\uD83D\uDD0A" : "\uD83D\uDD07";
    if (ambientMasterGain) {
      ambientMasterGain.gain.value = soundEnabled ? 1 : 0;
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
      playChime();
      markVisited();

      // Start first round
      currentMessage = pickMessage();
      saveCurrentRound({ messageId: currentMessage.id, collectedFragments: [] });
      collectedCount = 0;
      collectedFragments = [];

      generateTappableStars(20);
      $("starCounter").textContent = "0 / 5 stars collected";

      applyScene(pickScene());
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
    applyScene(pickScene());
    showScreen("skyScreen");
    $("tabBar").classList.remove("hidden");
    $("moon").classList.remove("hidden");
    startShootingStars();
  } else {
    // Returning user, no active round — start fresh
    $("beginBtn").textContent = "Pick Stars";
    $("beginBtn").addEventListener("click", () => {
      ensureAudio();
      playChime();

      currentMessage = pickMessage();
      saveCurrentRound({ messageId: currentMessage.id, collectedFragments: [] });
      collectedCount = 0;
      collectedFragments = [];

      generateTappableStars(20);
      $("starCounter").textContent = "0 / 5 stars collected";

      applyScene(pickScene());
      showScreen("skyScreen");
      $("tabBar").classList.remove("hidden");
      $("moon").classList.remove("hidden");
      startShootingStars();
    });
  }
});
