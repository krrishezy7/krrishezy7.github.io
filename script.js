/* ---------- global snake high score (Supabase) ----------
   Fill these in once the `snake_scores` table exists — see README for the
   SQL to run and where to find these values in the Supabase dashboard.
   The anon key is meant to be public/client-side; RLS policies on the
   table are what keep writes sane, not secrecy of this key. */
const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';

async function fetchGlobalHighScore() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/snake_scores?select=score&order=score.desc&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows.length ? rows[0].score : 0;
  } catch {
    return null;
  }
}

function submitGlobalHighScore(score) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  fetch(`${SUPABASE_URL}/rest/v1/snake_scores`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ score })
  }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!hasFinePointer) document.body.classList.add('no-cursor');

  /* ---------- custom cursor ---------- */
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');

  if (hasFinePointer && cursorDot && cursorRing) {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    }
    animateRing();

    document.querySelectorAll('a, button, .work-item').forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
    });
  }

  /* ---------- magnetic elements ---------- */
  if (hasFinePointer) {
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* ---------- topbar scroll state ---------- */
  const topbar = document.getElementById('topbar');
  const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- full-screen menu overlay ---------- */
  const menuToggle = document.getElementById('menuToggle');
  const menuClose = document.getElementById('menuClose');
  const menuOverlay = document.getElementById('menuOverlay');
  const menuLinks = document.querySelectorAll('.menu-links a[data-nav]');

  function openMenu() { menuOverlay.classList.add('open'); }
  function closeMenu() { menuOverlay.classList.remove('open'); }

  if (menuToggle) menuToggle.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  menuLinks.forEach(link => link.addEventListener('click', closeMenu));

  /* ---------- scrollspy for menu links ---------- */
  const spySections = Array.from(menuLinks).map(a => document.getElementById(a.dataset.nav)).filter(Boolean);
  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = document.querySelector(`.menu-links a[data-nav="${id}"]`);
      if (!link) return;
      if (entry.isIntersecting) {
        menuLinks.forEach(a => a.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  spySections.forEach(section => spyObserver.observe(section));

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = Math.min(i * 60, 240);
        setTimeout(() => entry.target.classList.add('in-view'), delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- animated stat counters ---------- */
  const statEls = document.querySelectorAll('.stat-num');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = value.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target.toFixed(decimals) + suffix;
      }
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  statEls.forEach(el => countObserver.observe(el));

  /* ---------- footer year + back to top ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const toTop = document.getElementById('toTop');
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- ambient snake background ---------- */
  initAmbientSnake();
});

function initAmbientSnake() {
  const canvas = document.getElementById('ambientSnake');
  const hero = document.getElementById('top');
  const hud = document.getElementById('ambientHud');
  const hudVal = document.getElementById('ambientHudVal');
  const gameHint = document.querySelector('.game-hint');
  const highscoreBadge = document.getElementById('highscoreBadge');
  const highscoreVal = document.getElementById('highscoreVal');
  if (!canvas || !hero) return;

  const ctx = canvas.getContext('2d');
  const CELL = 46;
  const AMBIENT_COUNT = 10;
  const AMBIENT_COLORS = [
    '37,99,235', '59,130,246', '29,78,216', '14,165,233', '30,64,175',
    '96,165,250', '37,99,235', '29,78,216', '14,165,233', '59,130,246'
  ];
  let cols, rows, dpr;
  let heroVisible = true;
  let globalBest = 0;

  fetchGlobalHighScore().then(best => {
    if (best === null) return;
    globalBest = best;
    if (highscoreVal) highscoreVal.textContent = globalBest;
    if (highscoreBadge) highscoreBadge.classList.add('visible');
  });

  const dirs = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  let snakes = [];       // ambient swarm, alive while mode === 'auto'
  let playerSnake = null; // the single controllable snake, alive while mode === 'manual'
  let food, score, mode;
  let lastManualInput = 0;
  mode = 'auto'; // 'auto' | 'manual'
  const IDLE_TIMEOUT = 10000;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.max(10, Math.floor(w / CELL));
    rows = Math.max(10, Math.floor(h / CELL));
  }

  // cells to keep clear of food so it never lands invisibly behind the
  // portrait photo or the name — computed live so it only applies while
  // those elements are actually on screen (i.e. hero scrolled into view)
  function noSpawnRects() {
    const els = [document.getElementById('portraitFrame'), document.querySelector('.hero-name')];
    return els
      .filter(Boolean)
      .map(el => el.getBoundingClientRect())
      .filter(r => r.width > 0 && r.height > 0);
  }

  function cellBlocked(x, y, rects) {
    const px = x * CELL + CELL / 2, py = y * CELL + CELL / 2;
    const buf = CELL * 0.4;
    return rects.some(r => px >= r.left - buf && px <= r.right + buf && py >= r.top - buf && py <= r.bottom + buf);
  }

  const SNAKE_LEN = 7;

  function makeSnakeAt(cx, cy) {
    const startX = Math.max(cx, SNAKE_LEN - 1);
    const body = [];
    for (let i = 0; i < SNAKE_LEN; i++) body.push({ x: startX - i, y: cy });
    return { body, prevBody: body.map(s => ({ x: s.x, y: s.y })), dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 } };
  }

  function randomEmptySpot(existingBodies) {
    const marginX = SNAKE_LEN + 1;
    let x, y, tries = 0;
    do {
      x = marginX + Math.floor(Math.random() * Math.max(1, cols - marginX * 2));
      y = 2 + Math.floor(Math.random() * Math.max(1, rows - 4));
      tries++;
    } while (tries < 30 && existingBodies.some(b => b.some(s => Math.abs(s.x - x) < 3 && Math.abs(s.y - y) < 3)));
    return { x, y };
  }

  function spawnAmbientSwarm(keepSnake) {
    snakes = keepSnake ? [keepSnake] : [];
    while (snakes.length < AMBIENT_COUNT) {
      const spot = randomEmptySpot(snakes.map(s => s.body));
      snakes.push(makeSnakeAt(spot.x, spot.y));
    }
    placeFood();
  }

  function placeFood() {
    const bodies = mode === 'manual' && playerSnake ? [playerSnake.body] : snakes.map(s => s.body);
    const rects = noSpawnRects();
    let valid = false, tries = 0;
    while (!valid && tries < 200) {
      food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
      const occupied = bodies.some(b => b.some(s => s.x === food.x && s.y === food.y));
      valid = !occupied && !cellBlocked(food.x, food.y, rects);
      tries++;
    }
  }

  function isSafe(body, pos, excludeTail) {
    if (pos.x < 0 || pos.x >= cols || pos.y < 0 || pos.y >= rows) return false;
    const check = excludeTail ? body.slice(0, -1) : body;
    return !check.some(s => s.x === pos.x && s.y === pos.y);
  }

  function autoDirectionFor(s) {
    const head = s.body[0];
    const dx = food.x - head.x, dy = food.y - head.y;
    const order = [];
    if (Math.abs(dx) >= Math.abs(dy)) {
      order.push(dx > 0 ? 'right' : 'left');
      order.push(dy > 0 ? 'down' : 'up');
      order.push(dy > 0 ? 'up' : 'down');
      order.push(dx > 0 ? 'left' : 'right');
    } else {
      order.push(dy > 0 ? 'down' : 'up');
      order.push(dx > 0 ? 'right' : 'left');
      order.push(dx > 0 ? 'left' : 'right');
      order.push(dy > 0 ? 'up' : 'down');
    }
    for (const key of order) {
      const d = dirs[key];
      if (d.x === -s.dir.x && d.y === -s.dir.y) continue;
      const next = { x: head.x + d.x, y: head.y + d.y };
      if (isSafe(s.body, next, true)) return d;
    }
    // fallback: any safe move
    for (const key of Object.keys(dirs)) {
      const d = dirs[key];
      if (d.x === -s.dir.x && d.y === -s.dir.y) continue;
      const next = { x: head.x + d.x, y: head.y + d.y };
      if (isSafe(s.body, next, true)) return d;
    }
    return s.dir;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawSnakeBody(s, t, color, headAlpha, bodyAlpha) {
    const pad = 5;
    const n = s.body.length;
    for (let i = n - 1; i >= 0; i--) {
      const seg = s.body[i];
      const prev = (s.prevBody && s.prevBody[i]) || seg;
      const cx = (prev.x + (seg.x - prev.x) * t) * CELL + CELL / 2;
      const cy = (prev.y + (seg.y - prev.y) * t) * CELL + CELL / 2;

      if (i === 0) {
        const size = CELL - pad;
        ctx.fillStyle = `rgba(${color},${headAlpha})`;
        roundRect(cx - size / 2, cy - size / 2, size, size, 11);
        ctx.fill();

        const perpX = -s.dir.y, perpY = s.dir.x;
        const eyeFwd = size * 0.2, eyeSide = size * 0.19, eyeR = size * 0.09;
        ctx.fillStyle = headAlpha > 0.5 ? 'rgba(23,23,15,0.9)' : 'rgba(23,23,15,0.3)';
        [-1, 1].forEach(sign => {
          ctx.beginPath();
          ctx.arc(cx + s.dir.x * eyeFwd + perpX * eyeSide * sign, cy + s.dir.y * eyeFwd + perpY * eyeSide * sign, eyeR, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        const taper = Math.max(0.42, 1 - i * 0.045);
        const size = (CELL - pad * 1.8) * taper;
        const a = Math.max(bodyAlpha * 0.3, bodyAlpha - i * 0.012);
        const scaleShade = i % 2 === 0 ? 1 : 0.8;
        ctx.fillStyle = `rgba(${color},${(a * scaleShade).toFixed(3)})`;
        roundRect(cx - size / 2, cy - size / 2, size, size, 8);
        ctx.fill();
      }
    }
  }

  function draw(t) {
    const w = canvas.width / dpr, h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    const active = mode === 'manual';

    const fx = food.x * CELL + CELL / 2, fy = food.y * CELL + CELL / 2;
    const fr = CELL * 0.24;
    ctx.beginPath();
    ctx.arc(fx, fy, fr * 1.7, 0, Math.PI * 2);
    ctx.strokeStyle = active ? 'rgba(37,99,235,0.35)' : 'rgba(37,99,235,0.1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = active ? 'rgba(37,99,235,0.95)' : 'rgba(37,99,235,0.2)';
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();

    if (active && playerSnake) {
      drawSnakeBody(playerSnake, t, '37,99,235', 0.95, 0.58);
    } else {
      snakes.forEach((s, i) => {
        drawSnakeBody(s, t, AMBIENT_COLORS[i % AMBIENT_COLORS.length], 0.16, 0.11);
      });
    }
  }

  function tickAmbientSwarm() {
    const allBodies = snakes.map(s => s.body);
    for (let i = 0; i < snakes.length; i++) {
      const s = snakes[i];
      s.nextDir = autoDirectionFor(s);
      s.prevBody = s.body.map(seg => ({ x: seg.x, y: seg.y }));
      s.dir = s.nextDir;
      const head = { x: s.body[0].x + s.dir.x, y: s.body[0].y + s.dir.y };
      const hitWall = head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows;
      const hitAny = allBodies.some(body => body.some(seg => seg.x === head.x && seg.y === head.y));

      if (hitWall || hitAny) {
        // crashed into a wall or another snake — respawn fresh elsewhere
        const others = allBodies.filter((_, j) => j !== i);
        const spot = randomEmptySpot(others);
        snakes[i] = makeSnakeAt(spot.x, spot.y);
        continue;
      }

      s.body.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        placeFood();
      } else {
        s.body.pop();
      }
    }
  }

  function tickPlayer() {
    const s = playerSnake;
    s.prevBody = s.body.map(seg => ({ x: seg.x, y: seg.y }));
    s.dir = s.nextDir;
    const head = { x: s.body[0].x + s.dir.x, y: s.body[0].y + s.dir.y };
    const hitWall = head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows;
    const hitSelf = s.body.some(seg => seg.x === head.x && seg.y === head.y);

    if (hitWall || hitSelf) {
      // manual play never "dies" — steering into a wall or the tail just
      // holds the snake in place until the player picks a safe direction
      return;
    }

    s.body.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      if (hudVal) hudVal.textContent = score;
      if (score > globalBest && highscoreBadge) highscoreBadge.classList.add('record');
      placeFood();
    } else {
      s.body.pop();
    }
  }

  let rafId = null, lastFrame = null, acc = 0;

  function frame(now) {
    if (lastFrame === null) lastFrame = now;
    const dt = Math.min(now - lastFrame, 250);
    lastFrame = now;

    // the ambient swarm roams the whole page at all times; actual play is
    // only ever allowed while the hero ("first opening") is in view — scroll
    // away or go idle 10s and it hands back to the ambient swarm
    if (mode === 'manual' && (!heroVisible || now - lastManualInput > IDLE_TIMEOUT)) {
      exitManualToAuto();
    }
    const speed = mode === 'manual' ? 62 : 190;
    acc += dt;
    let steps = 0;
    while (acc >= speed && steps < 5) {
      if (mode === 'auto') tickAmbientSwarm();
      else if (playerSnake) tickPlayer();
      acc -= speed;
      steps++;
    }
    draw(acc / speed);
    rafId = requestAnimationFrame(frame);
  }

  function exitManualToAuto() {
    // idle handoff, not a game over — the player's snake keeps its
    // position and just rejoins the ambient swarm under AI control
    if (score > globalBest) {
      globalBest = score;
      if (highscoreVal) highscoreVal.textContent = globalBest;
      if (highscoreBadge) highscoreBadge.classList.add('visible', 'record');
      submitGlobalHighScore(score);
      setTimeout(() => { if (highscoreBadge) highscoreBadge.classList.remove('record'); }, 2600);
    }
    mode = 'auto';
    if (hud) hud.classList.remove('visible');
    if (gameHint) gameHint.style.opacity = '';
    spawnAmbientSwarm(playerSnake);
    playerSnake = null;
  }

  function engageManual(d) {
    lastManualInput = performance.now();
    if (mode !== 'manual') {
      mode = 'manual';
      score = 0;
      snakes = [];
      const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);
      playerSnake = makeSnakeAt(cx, cy);
      placeFood();
      acc = 0;
      if (hud) hud.classList.add('visible');
      if (hudVal) hudVal.textContent = '0';
      if (gameHint) gameHint.style.opacity = '0';
    }
    if (!d || !playerSnake) return;
    const s = playerSnake;
    if (d.x === -s.nextDir.x && d.y === -s.nextDir.y) {
      // reversing: flip the body in place instead of blocking the input —
      // the tail becomes the new head and the snake backs up immediately,
      // no "can't turn that way" dead zone
      s.body.reverse();
      if (s.prevBody) s.prevBody.reverse();
      s.dir = d;
      s.nextDir = d;
    } else {
      s.nextDir = d;
    }
  }

  const keyMap = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right'
  };

  window.addEventListener('keydown', (e) => {
    if (!heroVisible) return;
    const mapped = keyMap[e.key];
    if (!mapped) return;
    e.preventDefault();
    engageManual(dirs[mapped]);
  });

  if (gameHint) {
    gameHint.addEventListener('click', () => engageManual(dirs.right));
  }

  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { heroVisible = entry.isIntersecting; });
  }, { threshold: 0.15 });
  heroObserver.observe(hero);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      if (mode === 'manual') {
        const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);
        playerSnake = makeSnakeAt(cx, cy);
        placeFood();
      } else {
        spawnAmbientSwarm();
      }
      acc = 0;
      draw(0);
    }, 120);
  });

  resize();
  spawnAmbientSwarm();
  draw(0);
  rafId = requestAnimationFrame(frame);
}
