/* =========================================================
   Love.exe — script.js (Fixed & Unified Audio)
   Flow: Terminal boot -> Hero -> Code messages -> Letter ->
         Compile -> Mini-game -> Final surprise
   ========================================================= */

/* ---------------------------------------------------------
   0. CONFIGURATION — customize these settings as needed
   --------------------------------------------------------- */
const CONFIG = {
  toName: "You",
  fromName: "Me",
  targetScore: 10
};

const HEARTS = ["❤️", "💖", "💗", "💕", "💘", "💞"];

/* ---------------------------------------------------------
   1. UTILITIES
   --------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const rand = (a, b) => Math.random() * (b - a) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Typewriter effect for regular text. */
async function typeText(el, text, speed = 35, opts = {}) {
  el.classList.add("typing");
  el.textContent = "";
  const chars = Array.from(text);

  for (let i = 0; i < chars.length; i++) {
    if (opts.skipRef && opts.skipRef.v) {
      el.textContent = text;
      break;
    }
    el.textContent += chars[i];
    if (opts.onTick) opts.onTick();
    await sleep(speed);
  }

  if (opts.onTick) opts.onTick();
  el.classList.remove("typing");
}

/** Simple syntax highlighting for code snippets. */
function highlight(code) {
  const safe = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const re = /(\/\/.*)|("[^"]*")|\b(const|let|var|while|true|false|if|try|catch|function|return|new)\b|\b([A-Za-z_]\w*)(?=\()/g;

  return safe.replace(re, (m, cm, str, kw, fn) => {
    if (cm) return `<span class="cm">${cm}</span>`;
    if (str) return `<span class="str">${str}</span>`;
    if (kw) return `<span class="kw">${kw}</span>`;
    if (fn) return `<span class="fn">${fn}</span>`;
    return m;
  });
}

/** Type code with syntax highlighting. */
async function typeCode(el, code, speed = 28) {
  el.classList.add("typing");
  el.innerHTML = "";
  const chars = Array.from(code);

  for (let i = 1; i <= chars.length; i++) {
    el.innerHTML = highlight(chars.slice(0, i).join(""));
    const ch = chars[i - 1];
    await sleep(ch.trim() ? speed : speed * 0.3);
  }

  el.classList.remove("typing");
}

/** Reveal a hidden element with a fade-up animation. */
function reveal(el) {
  el.hidden = false;
  el.classList.remove("reveal");
  void el.offsetWidth;
  el.classList.add("reveal");
}

/** Animate the progress bar value from `from` to `to`. */
function tweenBar(fillEl, textEl, from, to, ms) {
  return new Promise((resolve) => {
    const t0 = performance.now();

    function frame(now) {
      const p = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (to - from) * eased;

      fillEl.style.width = v + "%";
      textEl.textContent = Math.round(v) + "%";

      if (p < 1) requestAnimationFrame(frame);
      else resolve();
    }

    requestAnimationFrame(frame);
  });
}

/** Append one line of text to a log. */
function addLine(container, text, cls = "") {
  const line = document.createElement("div");
  line.className = ("line " + cls).trim();
  container.appendChild(line);
  return line;
}

/* ---------------------------------------------------------
   2. HEART EFFECTS
   --------------------------------------------------------- */
const heartsLayer = $("#hearts-layer");
const fxLayer = $("#fx-layer");

let floatTimer = null;
let rainTimer = null;

/** A heart gently floats across the background. */
function spawnFloatHeart() {
  if (document.hidden || heartsLayer.childElementCount > 26) return;

  const h = document.createElement("span");
  h.className = "float-heart";
  h.textContent = pick(HEARTS);
  h.style.left = rand(0, 100) + "vw";
  h.style.fontSize = rand(16, 40) + "px";
  h.style.animationDuration = rand(9, 17) + "s";
  h.style.setProperty("--dx", rand(-60, 60) + "px");
  h.style.setProperty("--rot", rand(-40, 40) + "deg");

  h.addEventListener("animationend", () => h.remove());
  heartsLayer.appendChild(h);
}

function startFloatingHearts() {
  if (floatTimer) return;

  for (let i = 0; i < 6; i++) {
    setTimeout(spawnFloatHeart, i * 250);
  }

  floatTimer = setInterval(spawnFloatHeart, 900);
}

/** Create a burst of hearts from a single point. */
function burstHearts(
  n = 18,
  x = window.innerWidth / 2,
  y = window.innerHeight / 2
) {
  for (let i = 0; i < n; i++) {
    const h = document.createElement("span");
    h.className = "burst";
    h.textContent = pick(HEARTS);
    h.style.left = x + "px";
    h.style.top = y + "px";

    const angle = rand(0, Math.PI * 2);
    const dist = rand(70, 220);

    h.style.setProperty("--dx", Math.cos(angle) * dist + "px");
    h.style.setProperty("--dy", Math.sin(angle) * dist + "px");
    h.style.fontSize = rand(16, 34) + "px";

    h.addEventListener("animationend", () => h.remove());
    fxLayer.appendChild(h);
  }
}

/** Heart rain for the final surprise. */
function startRain() {
  if (rainTimer) return;

  rainTimer = setInterval(() => {
    if (document.hidden || fxLayer.childElementCount > 120) return;

    const h = document.createElement("span");
    h.className = "rain";
    h.textContent = pick(HEARTS);
    h.style.left = rand(0, 100) + "vw";
    h.style.fontSize = rand(14, 32) + "px";
    h.style.animationDuration = rand(3.5, 7) + "s";
    h.style.setProperty("--rot", rand(-90, 90) + "deg");

    h.addEventListener("animationend", () => h.remove());
    fxLayer.appendChild(h);
  }, 140);
}

/* ---------------------------------------------------------
   3. MUSIK LATAR (dari MP4) + EFEK SUARA (Web Audio)
   --------------------------------------------------------- */
const bgm = $("#bgm");
const musicBtn = $("#musicButton");
const muteBtn = $("#muteBtn");
const MUSIC_VOL = 0.6;

bgm.volume = MUSIC_VOL;

const audio = {
  ctx: null,     // dipakai hanya untuk efek suara (blip)
  master: null,
  muted: false
};

/** Siapkan Web Audio untuk efek suara game. */
function initAudio() {
  if (audio.ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = audio.muted ? 0 : 0.5;
    master.connect(ctx.destination);

    audio.ctx = ctx;
    audio.master = master;
  } catch (err) {
    audio.ctx = null;
  }
}

/** Mulai musik dari file MP4. Harus dipanggil dari klik user. */
function startMusic() {
  initAudio();
  if (audio.ctx && audio.ctx.state === "suspended") {
    audio.ctx.resume().catch(() => {});
  }
  bgm.play().catch((err) => {
    console.warn("Musik gagal diputar. Cek path assets/a-thousand-years.mp4.mp3", err);
  });
}

function toggleMusic() {
  if (bgm.paused) startMusic();
  else bgm.pause();
}

function updateMusicUI() {
  musicBtn.innerHTML = bgm.paused ? "♡ Play Our Song" : "♫ Pause Our Song";
}

function updateMuteUI() {
  muteBtn.textContent = audio.muted ? "🔇" : "🔊";
  muteBtn.setAttribute("aria-pressed", String(audio.muted));
  muteBtn.setAttribute("aria-label", audio.muted ? "Nyalakan musik" : "Matikan musik");
}

bgm.addEventListener("play", updateMusicUI);
bgm.addEventListener("pause", updateMusicUI);
musicBtn.addEventListener("click", toggleMusic);

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  bgm.muted = audio.muted;

  if (audio.master) {
    audio.master.gain.setTargetAtTime(
      audio.muted ? 0 : 0.5,
      audio.ctx.currentTime,
      0.1
    );
  }
  updateMuteUI();
});

/** Efek suara singkat saat menangkap hati / kena bug. */
function blip(freq) {
  if (!audio.ctx || audio.muted) return;

  try {
    const ctx = audio.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(g);
    g.connect(audio.master);

    osc.start(t);
    osc.stop(t + 0.3);
  } catch (err) {
    // abaikan error efek suara
  }
}

/* ---------------------------------------------------------
   4. STAGE MANAGER
   --------------------------------------------------------- */
let currentStage = null;
const enterHooks = {};

async function showStage(id) {
  if (currentStage) {
    currentStage.classList.add("leaving");
    await sleep(450);
    currentStage.classList.remove("active", "leaving");
  }

  const next = $("#stage-" + id);
  currentStage = next;

  next.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (enterHooks[id]) {
    await enterHooks[id]();
  }
}

/** Attach a click handler to a button and prevent double-clicks. */
function onceClick(btn, handler) {
  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    btn.disabled = true;
    handler();
  });
}

/* ---------------------------------------------------------
   5. OPENING SCREEN — terminal + loading bar
   --------------------------------------------------------- */
const BOOT_STEPS = [
  { text: "Initializing Love.exe...", pct: 20 },
  { text: "Connecting to your heart...", pct: 45 },
  { text: "Checking compatibility...", pct: 72 },
  {
    text: "Error 404: Cannot find anyone quite like you.",
    pct: 90,
    cls: "err"
  },
  {
    text: "Successfully found: You ❤️",
    pct: 100,
    cls: "ok"
  }
];

async function runBoot() {
  const log = $("#bootLog");
  const fill = $("#bootFill");
  const txt = $("#bootPct");
  let current = 0;

  await sleep(600);

  for (const step of BOOT_STEPS) {
    const line = addLine(log, "", step.cls);

    await typeText(line, "> " + step.text, 38);
    await tweenBar(fill, txt, current, step.pct, 750);

    current = step.pct;
    await sleep(250);
  }

  const btn = $("#btnRun");
  reveal(btn);
  btn.focus({ preventScroll: true });
}

onceClick($("#btnRun"), async () => {
  startMusic();

  musicBtn.hidden = false;
  muteBtn.hidden = false;
  updateMusicUI();
  updateMuteUI();

  $("#boot").classList.add("exit");
  document.body.classList.add("romantic");

  await sleep(900);

  $("#boot").hidden = true;
  $("#app").hidden = false;

  startFloatingHearts();
  showStage("hero");
});

/* ---------------------------------------------------------
   6. HERO — "Hello, My Favorite Human"
   --------------------------------------------------------- */
enterHooks.hero = async () => {
  $("#heroTo").textContent = `// for: ${CONFIG.toName}`;

  await sleep(900);

  await typeText(
    $("#heroSub"),
    "Welcome to Love.exe — a small program I made just for you.",
    30
  );

  await sleep(300);

  await typeText(
    $("#heroSub2"),
    "Don't worry, this isn't a virus. It might just make you smile to yourself 😳",
    32
  );

  await sleep(300);
  reveal($("#btnHero"));
};

onceClick($("#btnHero"), () => showStage("code"));

/* ---------------------------------------------------------
   7. PROGRAMMING MESSAGES — code appears step by step
   --------------------------------------------------------- */
const SNIPPETS = [
  {
    file: "feelings.js",
    code:
`const myFeelings = {
  love: "A lot",
  happiness: "When I'm with you",
  favoritePerson: "You",
  status: "Still counting"
};`
  },
  {
    file: "smile.js",
    code:
`if (you.smile()) {
  myDay.improve();
  // works every time 😌
}`
  },
  {
    file: "debug.js",
    code:
`try {
  forget(you);
} catch (error) {
  console.log("Error: memory not found");
  // TODO: stop smiling when I think of you
}`
  }
];

let snippetIdx = 0;

async function playSnippet(i) {
  $("#fileName").textContent = SNIPPETS[i].file;
  $("#btnNextFile").hidden = true;
  $("#btnUnlock").hidden = true;

  await typeCode($("#codeOut"), SNIPPETS[i].code, 30);
  await sleep(350);

  if (i < SNIPPETS.length - 1) {
    reveal($("#btnNextFile"));
  } else {
    reveal($("#btnUnlock"));
  }
}

enterHooks.code = async () => {
  snippetIdx = 0;
  $("#codeOut").innerHTML = "";
  $("#btnNextFile").disabled = false;
  $("#btnUnlock").disabled = false;

  await sleep(400);
  await playSnippet(0);
};

$("#btnNextFile").addEventListener("click", () => {
  const btn = $("#btnNextFile");
  if (btn.disabled) return;

  btn.disabled = true;
  snippetIdx++;

  playSnippet(snippetIdx).then(() => {
    btn.disabled = false;
  });
});

onceClick($("#btnUnlock"), () => showStage("letter"));

/* ---------------------------------------------------------
   8. DIGITAL LOVE LETTER
   --------------------------------------------------------- */
const LETTER = () =>
`${CONFIG.toName},

To My Favorite Person, ❤️

Hi,
I don't know how to put all my feelings into words, but I want you to know that you mean a lot to me.
Every time I think of you, I find another reason to smile. Even on busy days, the thought of you makes things feel a little lighter. You have a way of making ordinary moments feel special.

I may not always have the perfect words, but I can promise something real: my time, my attention, my honesty, and a heart that chooses you.

If I could choose one place to be, it would be beside you.

Thank you for being you, and for being part of my life. It's brighter with you in it.

I don't need a perfect love story. I just want a story with you.

Sincerely,
${CONFIG.fromName} ❤️`;

const letterSkip = { v: false };

enterHooks.letter = async () => {
  const log = $("#unlockLog");
  const card = $("#letterCard");
  const body = $("#letterBody");

  log.innerHTML = "";
  card.hidden = true;
  $("#letterHint").hidden = true;
  $("#btnCompile").hidden = true;
  $("#btnCompile").disabled = false;

  letterSkip.v = false;

  await sleep(400);
  await typeText(addLine(log, "", ""), "> decrypting heart.key ...", 30);

  await sleep(500);
  await typeText(addLine(log, "", "ok"), "> Access granted 🔓", 30);

  burstHearts(14, window.innerWidth / 2, window.innerHeight * 0.35);

  await sleep(700);

  reveal(card);
  reveal($("#letterHint"));

  await typeText(body, LETTER(), 24, {
    skipRef: letterSkip,
    onTick: () => {
      card.scrollTop = card.scrollHeight;
    }
  });

  $("#letterHint").hidden = true;

  await sleep(400);
  reveal($("#btnCompile"));

  $("#btnCompile").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
};

$("#letterCard").addEventListener("click", () => {
  letterSkip.v = true;
});

onceClick($("#btnCompile"), () => showStage("compile"));

/* ---------------------------------------------------------
   9. COMPILE OUR LOVE
   --------------------------------------------------------- */
const COMPILE_STEPS = [
  { text: "$ gcc our_love.c -o Love.exe -lfeelings", pct: 10 },
  { text: "Compiling memories.c ............... OK", pct: 32 },
  { text: "Compiling laughter.c ............... OK", pct: 54 },
  { text: "Linking you.o + me.o ............... OK", pct: 76 },
  { text: "Optimizing happiness (-O3) ......... OK", pct: 92 },
  { text: "Warnings: 0 | Errors: 0 | Reasons to smile: 1 (you)", pct: 100 }
];

enterHooks.compile = async () => {
  const log = $("#compileLog");
  const fill = $("#compileFill");
  const txt = $("#compilePct");

  log.innerHTML = "";
  fill.style.width = "0%";
  txt.textContent = "0%";

  $("#buildOk").hidden = true;
  $("#btnToGame").hidden = true;
  $("#btnToGame").disabled = false;

  let current = 0;

  await sleep(600);

  for (const step of COMPILE_STEPS) {
    const line = addLine(log, "", "");

    await typeText(line, step.text, 16);
    await tweenBar(fill, txt, current, step.pct, 650);

    current = step.pct;
    await sleep(150);
  }

  await sleep(300);

  reveal($("#buildOk"));
  burstHearts(26);

  await sleep(900);
  reveal($("#btnToGame"));
};

onceClick($("#btnToGame"), () => showStage("game"));

/* ---------------------------------------------------------
   10. MINI-GAME — catch hearts, avoid bugs
   --------------------------------------------------------- */
const arena = $("#arena");
const scoreEl = $("#score");

let score = 0;
let gameOn = false;
let spawnTimer = null;

function spawnFaller() {
  if (!gameOn) return;

  const isBug = Math.random() < 0.22;
  const el = document.createElement("button");

  el.type = "button";
  el.className = "faller " + (isBug ? "bug" : "heart");
  el.textContent = isBug ? "🐛" : pick(HEARTS);

  el.setAttribute(
    "aria-label",
    isBug ? "Bug, avoid it" : "Heart, catch it"
  );

  el.style.left = rand(3, 84) + "%";
  el.style.fontSize = rand(30, 46) + "px";
  el.style.animationDuration = rand(3.2, 5.2) + "s";

  const handler = (e) => {
    e.preventDefault();
    catchItem(el, isBug);
  };

  el.addEventListener("pointerdown", handler);
  el.addEventListener("click", handler);

  el.addEventListener("animationend", () => el.remove());

  arena.appendChild(el);
}

function catchItem(el, isBug) {
  if (!gameOn || el.dataset.done) return;

  el.dataset.done = "1";
  el.classList.add("popped");

  setTimeout(() => el.remove(), 320);

  if (isBug) {
    score = Math.max(0, score - 1);

    blip(170);

    arena.classList.remove("shake");
    void arena.offsetWidth;
    arena.classList.add("shake");
  } else {
    score++;

    blip(pick([784, 880, 988, 1175]));

    const r = el.getBoundingClientRect();

    burstHearts(
      4,
      r.left + r.width / 2,
      r.top + r.height / 2
    );
  }

  scoreEl.textContent = String(score);

  if (score >= CONFIG.targetScore) {
    winGame();
  }
}

function startGame() {
  score = 0;
  scoreEl.textContent = "0";

  arena.innerHTML = "";

  $("#gameMsg").hidden = true;
  $("#btnSurprise").hidden = true;
  $("#btnStartGame").hidden = true;

  gameOn = true;

  clearInterval(spawnTimer);

  spawnTimer = setInterval(spawnFaller, 650);

  spawnFaller();
}

async function winGame() {
  gameOn = false;

  clearInterval(spawnTimer);
  arena.innerHTML = "";

  burstHearts(30);

  const msg = $("#gameMsg");

  reveal(msg);

  await typeText(
    msg,
    "> Heart.catch() returned true ✔  You caught my heart 💘",
    28
  );

  await sleep(300);

  $("#btnSurprise").disabled = false;
  reveal($("#btnSurprise"));
}

enterHooks.game = async () => {
  $("#target").textContent = String(CONFIG.targetScore);

  scoreEl.textContent = "0";
  arena.innerHTML = "";

  $("#gameMsg").hidden = true;
  $("#btnSurprise").hidden = true;

  $("#btnStartGame").hidden = false;
  $("#btnStartGame").disabled = false;
};

$("#btnStartGame").addEventListener("click", () => {
  if ($("#btnStartGame").disabled) return;

  $("#btnStartGame").disabled = true;

  startGame();
});

onceClick($("#btnSurprise"), () => showStage("final"));

/* ---------------------------------------------------------
   11. FINAL SURPRISE
   --------------------------------------------------------- */
const FINAL_QUOTE = `If you ever wonder how much you mean to me, just remember this: out of all the people I could have met, I'm really glad it was you. Thank you for being part of my days.

With love,
${CONFIG.fromName} ❤️`;

const FINAL_CODE =
`if (you == myFavoritePerson) {
    future = "Us, maybe? 😳";
}`;

enterHooks.final = async () => {
  $("#bg").classList.add("finale");

  startRain();
  burstHearts(40);

  await sleep(900);

  await typeText($("#finalQuote"), FINAL_QUOTE, 55);

  await sleep(700);

  reveal($("#finalWin"));

  await sleep(300);

  await typeCode($("#finalCode"), FINAL_CODE, 55);

  burstHearts(36);

  await sleep(600);

  const sig = $("#signature");

  sig.textContent = `— ${CONFIG.fromName} ❤️`;

  reveal(sig);

  await sleep(800);

  reveal($("#btnReplay"));
};

$("#btnReplay").addEventListener("click", () => {
  window.location.reload();
});

/* ---------------------------------------------------------
   12. ADDITIONAL INTERACTIONS & INITIALIZATION
   --------------------------------------------------------- */

// Tap anywhere on the main screen -> little hearts appear
document.addEventListener("pointerdown", (e) => {
  if ($("#app").hidden) return;

  if (e.target.closest(".arena, .btn, .mute-btn, .letter")) {
    return;
  }

  burstHearts(6, e.clientX, e.clientY);
});

// Start the program when the page is ready
runBoot();