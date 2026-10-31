/* GATE · pull the thread to the right tension and the subconcepto papers open */
(function () {
  const hero = document.getElementById('puerta'), canvas = document.getElementById('scene');
  const phraseEl = document.getElementById('phrase'), dotEl = document.getElementById('dot'), holdEl = document.getElementById('hold');
  const zoneEl = document.getElementById('zone'), justoEl = document.getElementById('justo'), hintEl = document.getElementById('hint');
  const skipBtn = document.getElementById('skip'), replayBtn = document.getElementById('replay') || document.createElement('button');
  const POSTERS = {}; ['pista','revelacion','equilibrio','tension','giro','oculto'].forEach(k => { const im = new Image(); im.src = 'assets/poster-' + k + '.webp'; POSTERS[k] = im; });
  const posterReady = Promise.all(Object.values(POSTERS).map(im => im.decode ? im.decode().catch(() => 0) : new Promise(r => { im.onload = im.onerror = r; })));
  const { C, clamp, lerp, ease, rng, poly, jagRect, jagCircle } = BF;

  const T_MIN = .55, T_MAX = 1.3, SWEET = [.95, 1.04], OVER = 1.1;
  const toPct = t => clamp((t - T_MIN) / (T_MAX - T_MIN), 0, 1) * 100;
  zoneEl.style.left = toPct(SWEET[0]) + '%'; zoneEl.style.width = (toPct(SWEET[1]) - toPct(SWEET[0])) + '%';
  justoEl.style.left = ((toPct(SWEET[0]) + toPct(SWEET[1])) / 2) + '%';

  function noGL() { hero.classList.remove('closed'); hero.classList.add('open', 'nogl', 'gone'); skipBtn.hidden = true; document.documentElement.classList.remove('bf-cerrado'); }
  if (!window.THREE) { noGL(); return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { noGL(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
  camera.position.set(0, 0, 12);
  scene.add(new THREE.AmbientLight(0xffffff, .72));
  const sun = new THREE.DirectionalLight(0xffffff, .75); sun.position.set(-3, 5, 8); scene.add(sun);
  let VW = 1, VH = 1;

  /* ---- papers, one per subconcepto, drawn in each poster's language ---- */
  const deco = {
    pista(g, W, H, R) { // sashiko rows, dot-matrix, magenta jūji-zashi crosses
      g.strokeStyle = 'rgba(243,235,217,.42)'; g.lineWidth = 3; g.setLineDash([18, 12]);
      for (let y = 34; y < H; y += 44) { g.lineDashOffset = R() * 30; g.beginPath(); g.moveTo(0, y + (R() - .5) * 5); g.lineTo(W, y + (R() - .5) * 5); g.stroke(); }
      g.setLineDash([]); BF.halftone(g, W * .55, 0, W * .45, H * .5, 'rgba(255,255,255,.35)', 16, R, 'r');
      BF.crossStitch(g, W * .08, H * .62, 16, ['1.1.1.1', '.1.1.1.', '1.1.1.1'], ['#C2187A', '#C2187A']);
      BF.dryBrush(g, W * .5, H * .78, W * .45, -.1, 40, 'rgba(219,160,21,.7)', R);
    },
    revelacion(g, W, H, R) { // displaced grid
      const s = Math.round(Math.min(W, H) / 5.5); g.lineWidth = 2.2;
      for (let y = -s; y < H + s; y += s) for (let x = -s; x < W + s; x += s) {
        const ox = (R() - .5) * s * .16, oy = (R() - .5) * s * .16;
        if (R() < .18) { g.fillStyle = 'rgba(255,240,200,.4)'; g.fillRect(x + ox + 5, y + oy + 5, s * .82, s * .82); }
        g.strokeStyle = 'rgba(20,20,20,.26)'; g.strokeRect(x + ox, y + oy, s * .92, s * .92);
      }
      BF.splat(g, W * .8, H * .25, 50, 'rgba(155,38,182,.45)', R);
      BF.scribble(g, W * .1, H * .6, W * .3, H * .3, 'rgba(20,20,20,.55)', 3, R, 12);
    },
    equilibrio(g, W, H, R) { // veins
      g.lineCap = 'round';
      function br(x, y, a, w, d) { if (d > 7 || w < .6) return; const len = 40 + R() * 70, nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + nx) / 2 + (R() - .5) * 30, (y + ny) / 2 + (R() - .5) * 30, nx, ny); g.stroke(); br(nx, ny, a + (R() - .5) * .7, w * .82, d + 1); if (R() < .55) br(nx, ny, a + (R() < .5 ? -1 : 1) * (.5 + R() * .6), w * .6, d + 1); }
      g.strokeStyle = 'rgba(255,176,226,.5)'; for (let k = 0; k < 5; k++) br(W * (.08 + R() * .25), H * .97, -Math.PI / 2 + (R() - .5) * .9, 9, 0);
      g.strokeStyle = 'rgba(0,61,165,.6)'; for (let k = 0; k < 3; k++) br(W * (.5 + R() * .4), 0, Math.PI / 2 + (R() - .5), 6, 0);
      BF.splat(g, W * .2, H * .8, 60, 'rgba(20,20,20,.55)', R);
    },
    tension(g, W, H, R) { // strings to one point + violin f-hole brush + ruler
      const fx = W * 1.04, fy = H * .36; g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.7;
      for (let k = 0; k < 22; k++) { g.beginPath(); g.moveTo(-10, H * (k / 21)); g.lineTo(fx, fy + (R() - .5) * 22); g.stroke(); }
      g.strokeStyle = 'rgba(20,20,20,.85)'; g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(W * .25, H * .2); g.bezierCurveTo(W * .1, H * .35, W * .4, H * .55, W * .22, H * .78); g.stroke();
      g.beginPath(); g.arc(W * .25, H * .2, 12, 0, 7); g.arc(W * .22, H * .78, 12, 0, 7); g.fillStyle = 'rgba(20,20,20,.85)'; g.fill();
      g.fillStyle = 'rgba(20,20,20,.5)'; for (let x = 8; x < W; x += 12) { const h = ((x - 8) / 12) % 5 === 0 ? 24 : 11; g.fillRect(x, H - h - 34, 2, h); }
      BF.halftone(g, W * .55, H * .45, W * .45, H * .55, 'rgba(219,160,21,.45)', 12, R, 'r');
    },
    giro(g, W, H, R) { // night wall, light trails, spray
      g.fillStyle = '#151515'; g.fillRect(0, 0, W, H);
      const cols = ['#C2187A', '#9B26B6', '#003DA5', '#F29BC5'];
      g.lineCap = 'round';
      for (let k = 0; k < 9; k++) { g.strokeStyle = cols[k % 4]; g.globalAlpha = .7; g.lineWidth = 3 + R() * 8; g.beginPath(); g.moveTo(0, H * (.1 + R() * .9)); g.bezierCurveTo(W * .3, H * R(), W * .6, H * R(), W, H * (R() * .5)); g.stroke(); }
      g.globalAlpha = 1;
      BF.splat(g, W * .55, H * .5, 70, '#C05131', R);
      BF.specks(g, W, H, R, 1600, '#ffffff', .4);
    },
    oculto(g, W, H, R) { // halftone, unreadable writing, amber scratch
      BF.halftone(g, 0, 0, W, H, 'rgba(0,8,40,.42)', 14, R, 'd');
      BF.typeLines(g, W * .08, H * .14, W * .42, 10, 'rgba(243,243,241,.4)', R, 16);
      g.strokeStyle = 'rgba(219,160,21,.9)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); let px = W * .6, py = H * .8; g.moveTo(px, py); for (let k = 0; k < 14; k++) { px += (R() - .3) * 40; py += (R() - .5) * 30; g.lineTo(px, py); } g.stroke();
      BF.splat(g, W * .82, H * .2, 40, 'rgba(20,20,20,.6)', R);
    },
    vegetal(g, W, H, R) {
      g.strokeStyle = 'rgba(170,162,140,.3)'; g.lineWidth = 1;
      for (let k = 0; k < 280; k++) { const x = R() * W, y = R() * H, a = R() * 6.283, l = 10 + R() * 40; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + (R() - .5) * 10, y + Math.sin(a) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
      BF.typeLines(g, W * .1, H * .3, W * .6, 6, 'rgba(20,20,20,.18)', R, 18);
    }
  };
  const LAYERS = [
    { key: 'pista', color: C.petroleo, rect: [0, 0, 1.22, 1.22, 0], full: true, seed: 11 },
    { key: 'revelacion', color: C.ambar, rect: [.27, .24, .74, .68, -.06], seed: 23 },
    { key: 'equilibrio', color: C.magenta, rect: [-.3, -.24, .72, .74, .05], seed: 37 },
    { key: 'tension', color: C.violeta, rect: [.31, -.3, .6, .6, .09], seed: 41 },
    { key: 'giro', color: '#151515', rect: [-.33, .3, .56, .56, -.1], seed: 53 },
    { key: 'oculto', color: C.azul, rect: [.06, .02, .6, .64, .035], seed: 67 },
    { key: 'vegetal', color: '#FBFAF4', rect: [-.25, 0, .58, 1.3, -.025], seed: 79, veil: true }
  ];
  const HOLES = [[-.17, .1, .17], [.25, -.12, .12], [.03, .34, .07], [-.37, -.31, .085], [.4, .3, .06]];

  function makeTexture(L, i, W, H, geo) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), R = rng(L.seed), m = Math.min(W, H) * .025;
    let body;
    if (L.full) body = [[0, 0], [W, 0], [W, H], [0, H]];
    else { if (!L.veil) { g.fillStyle = '#ECE7DB'; poly(g, jagRect(W, H, m * .3, m * .8, R)); g.fill(); } body = jagRect(W, H, m, m * 1.1, R); }
    g.fillStyle = L.color; poly(g, body); g.fill();
    g.save(); poly(g, body); g.clip(); const im = POSTERS[L.key]; if (im && im.naturalWidth) { const k = Math.max(W / im.naturalWidth, H / im.naturalHeight); g.drawImage(im, (W - im.naturalWidth * k) / 2, (H - im.naturalHeight * k) / 2, im.naturalWidth * k, im.naturalHeight * k); } else deco[L.key](g, W, H, R); BF.grain(g, W, H, R, L.veil ? .035 : .08); g.restore();
    HOLES.forEach(h => {
      const X = h[0] * VW + (R() - .5) * .04 * VW, Y = h[1] * VH + (R() - .5) * .04 * VH;
      const dx = X - geo.cx, dy = Y - geo.cy, cs = Math.cos(geo.rot), sn = Math.sin(geo.rot);
      const lx = dx * cs + dy * sn, ly = -dx * sn + dy * cs, u = lx / geo.lw + .5, v = .5 - ly / geo.lh;
      if (u < .04 || u > .96 || v < .04 || v > .96) return;
      const r = h[2] * Math.min(VW, VH) * (.78 + i * .07) / geo.lw * W, px = u * W, py = v * H;
      if (!L.veil) { g.fillStyle = '#EEE9DD'; poly(g, jagCircle(px, py, r * 1.12, R)); g.fill(); }
      g.globalCompositeOperation = 'destination-out'; poly(g, jagCircle(px, py, r, R)); g.fill(); g.globalCompositeOperation = 'source-over';
    });
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  const sheets = [];
  function buildLayers() {
    sheets.forEach(s => { scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.map.dispose(); s.mesh.material.dispose(); });
    sheets.length = 0;
    const n = LAYERS.length;
    LAYERS.forEach((L, i) => {
      const r = L.rect, cx = r[0] * VW, cy = r[1] * VH, lw = r[2] * VW, lh = r[3] * VH, rot = r[4];
      const pxH = Math.round(lh > lw ? 1100 : 860), pxW = Math.min(2048, Math.round(pxH * lw / lh));
      const tex = makeTexture(L, i, pxW, pxH, { cx, cy, lw, lh, rot });
      const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: !!L.veil, opacity: L.veil ? .55 : 1, alphaTest: L.veil ? .02 : .5, depthWrite: !L.veil });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), mat);
      mesh.renderOrder = L.veil ? 10 : i; scene.add(mesh);
      const z = -.3 + i * .1, R = rng(L.seed + 7), far = Math.max(VW, VH) * 1.3;
      let dx = cx, dy = cy; const len = Math.hypot(dx, dy);
      if (len < .15 * Math.min(VW, VH)) { dx = .25; dy = 1; } else { dx /= len; dy /= len; }
      const exit = L.veil ? { x: cx - .1 * VW, y: cy + VH * 1.35, z: z + 3, rx: -1.1, ry: .2, rz: rot + .15 }
        : { x: cx + dx * far, y: cy + dy * far, z: z + 2.4, rx: (R() - .5) * 1.3, ry: (R() - .5) * 1.3, rz: rot + (dx > 0 ? -.7 : .7) };
      sheets.push({ mesh, i, base: { x: cx, y: cy, z, rz: rot }, exit, delay: L.veil ? 0 : (n - 1 - i) * .075 });
    });
  }

  /* ---- the thread (verlet rope) ---- */
  const N = 46, P = [], Q = [], P3 = [];
  for (let i = 0; i < N; i++) { P.push(new THREE.Vector2()); Q.push(new THREE.Vector2()); P3.push(new THREE.Vector3()); }
  const ropeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(C.ambar).convertSRGBToLinear(), roughness: .55, metalness: .05 });
  const rope = new THREE.Mesh(new THREE.BufferGeometry(), ropeMat); rope.renderOrder = 5; scene.add(rope);
  const needle = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0xC9C6BE, roughness: .25, metalness: .6 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.014, .004, .62, 10), steel); shaft.position.y = .31; needle.add(shaft);
  const eye = new THREE.Mesh(new THREE.TorusGeometry(.03, .009, 6, 16), steel); eye.position.y = .02; needle.add(eye);
  scene.add(needle);
  const ropeColor = new THREE.Color(C.ambar).convertSRGBToLinear(), hotColor = new THREE.Color(C.rojo).convertSRGBToLinear();
  const anchor = new THREE.Vector2(), end = new THREE.Vector2(), restEnd = new THREE.Vector2(), preRest = new THREE.Vector2();
  let ropeL = 1;
  function configs() {
    const preA = [-.53 * VW, .06 * VH], preE = [.03 * VW, -.17 * VH];
    const preD = Math.hypot(preE[0] - preA[0], preE[1] - preA[1]);
    const postA = [-.56 * VW, -.43 * VH], postE = [.56 * VW, -.02 * VH];
    const postD = Math.hypot(postE[0] - postA[0], postE[1] - postA[1]);
    return { preA, preE, preL: Math.max(.74 * VW, preD * 1.32), postA, postE, postL: postD * 1.012 };
  }
  function resetRope() {
    const c = configs(); anchor.set(c.preA[0], c.preA[1]); end.set(c.preE[0], c.preE[1]); ropeL = c.preL;
    for (let i = 0; i < N; i++) { const u = i / (N - 1); P[i].set(lerp(anchor.x, end.x, u), lerp(anchor.y, end.y, u) - Math.sin(Math.PI * u) * .6); Q[i].copy(P[i]); }
  }
  function simulate(dt) {
    const seg = ropeL / (N - 1), g = -7.5 * dt * dt;
    for (let i = 1; i < N - 1; i++) { const vx = (P[i].x - Q[i].x) * .982, vy = (P[i].y - Q[i].y) * .982; Q[i].copy(P[i]); P[i].x += vx; P[i].y += vy + g; }
    P[0].copy(anchor); P[N - 1].copy(end);
    for (let k = 0; k < 26; k++) {
      for (let i = 0; i < N - 1; i++) {
        const a = P[i], b = P[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6, diff = (d - seg) / d;
        if (i === 0) { b.x -= dx * diff; b.y -= dy * diff; }
        else if (i + 1 === N - 1) { a.x += dx * diff; a.y += dy * diff; }
        else { a.x += dx * diff * .5; a.y += dy * diff * .5; b.x -= dx * diff * .5; b.y -= dy * diff * .5; }
      }
      P[0].copy(anchor); P[N - 1].copy(end);
    }
  }

  /* ---- pointer ---- */
  const ptr = new THREE.Vector2(), ptrNdc = new THREE.Vector2(), prevPtr = new THREE.Vector2();
  let ptrIn = false, ptrMoved = false, dragging = false, touched = false;
  const _v = new THREE.Vector3(), _d = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  function toWorld(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ptrNdc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    _v.set(ptrNdc.x, ptrNdc.y, .5).unproject(camera); _d.copy(_v).sub(camera.position).normalize();
    const s = -camera.position.z / _d.z; ptr.set(camera.position.x + _d.x * s, camera.position.y + _d.y * s);
  }
  hero.addEventListener('pointerdown', e => {
    if (state !== 'closed' || e.target.closest('.skip')) return;
    dragging = true; touched = true; hero.classList.add('dragging');
    try { hero.setPointerCapture(e.pointerId); } catch (_) { }
    toWorld(e.clientX, e.clientY); e.preventDefault();
  });
  addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect(); ptrIn = e.clientY >= r.top && e.clientY <= r.bottom;
    toWorld(e.clientX, e.clientY); ptrMoved = true;
  }, { passive: true });
  function release() { if (!dragging) return; dragging = false; hero.classList.remove('dragging'); if (state === 'closed' && tension >= SWEET[0] && tension <= SWEET[1]) open(); }
  addEventListener('pointerup', release); addEventListener('pointercancel', release);

  /* ---- state ---- */
  const T = 1.95;
  let state = 'closed', revealT = 0, hold = 0, tension = .8, lastPhrase = '';
  function setPhrase(s) { if (s !== lastPhrase) { phraseEl.textContent = s; lastPhrase = s; } }
  function open() {
    if (state === 'open' || state === 'opening') return;
    state = 'opening'; hero.classList.remove('closed'); hero.classList.add('open');
    setPhrase('Ni muy muy, ni tan tan.'); skipBtn.textContent = 'Entrar'; document.documentElement.classList.remove('bf-cerrado'); setTimeout(() => { if (state !== 'closed' && state !== 'closing') hero.classList.add('gone'); }, 2300);
  }
  function close() {
    state = 'closing'; hero.classList.add('closed'); hero.classList.remove('open');
    hold = 0; touched = false; skipBtn.textContent = 'Saltar intro'; hero.classList.remove('gone'); document.documentElement.classList.add('bf-cerrado'); setPhrase('Tirá del hilo');
    sheets.forEach(s => s.mesh.visible = true);
  }
  skipBtn.addEventListener('click', () => (state === 'closed' || state === 'closing') ? open() : hero.classList.add('gone'));
  BF.cerrarPuerta = () => { scrollTo({ top: 0 }); close(); };
  replayBtn.addEventListener('click', () => { scrollTo({ top: 0, behavior: BF.reduce ? 'auto' : 'smooth' }); close(); });

  let rebuildTimer = 0;
  function resize(first) {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    VH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); VW = VH * camera.aspect;
    clearTimeout(rebuildTimer);
    if (first) { buildLayers(); resetRope(); }
    else rebuildTimer = setTimeout(() => { buildLayers(); if (state === 'closed') resetRope(); }, 250);
  }
  // build after fonts so the typewritten fragments use Special Elite
  Promise.race([posterReady, new Promise(r => setTimeout(r, 2500))]).then(() => { resize(true); start(); });
  posterReady.then(() => { if (state === 'closed') buildLayers(); });
  addEventListener('resize', () => resize(false));
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);
  if (BF.reduce) { state = 'open'; revealT = T; hero.classList.remove('closed'); hero.classList.add('open', 'gone'); document.documentElement.classList.remove('bf-cerrado'); }

  const pull = new THREE.Vector2(); let last = performance.now(), time = 0, ropeGeoT = 0;
  function start() { requestAnimationFrame(frame); }
  function frame(now) {
    requestAnimationFrame(frame);
    const raw = (now - last) / 1000; last = now;
    if (!visible) return;
    const dt = Math.min(1 / 30, Math.max(1 / 240, raw)), rdt = Math.min(.1, Math.max(0, raw));
    time += dt;
    if (state === 'opening') { revealT += rdt; if (revealT >= T) { revealT = T; state = 'open'; } }
    else if (state === 'closing') { revealT -= rdt * 1.25; if (revealT <= 0) { revealT = 0; state = 'closed'; resetRope(); } }
    const q = ease(clamp(revealT / T, 0, 1));
    const c = configs();
    anchor.set(lerp(c.preA[0], c.postA[0], q), lerp(c.preA[1], c.postA[1], q));
    restEnd.set(lerp(c.preE[0], c.postE[0], q), lerp(c.preE[1], c.postE[1], q));
    preRest.set(c.preE[0], c.preE[1]); ropeL = lerp(c.preL, c.postL, q);
    if (state === 'closed' && dragging) {
      const vx = ptr.x - anchor.x, vy = ptr.y - anchor.y, d = Math.hypot(vx, vy), max = ropeL * 1.28, k = d > max ? max / d : 1;
      end.x = lerp(end.x, anchor.x + vx * k, .4); end.y = lerp(end.y, anchor.y + vy * k, .4);
    } else end.lerp(restEnd, state === 'closed' ? .08 : .12);
    if (state === 'open' && ptrMoved && ptrIn && !BF.reduce) {
      const mvx = ptr.x - prevPtr.x, mvy = ptr.y - prevPtr.y;
      for (let i = 1; i < N - 1; i++) { const dx = P[i].x - ptr.x, dy = P[i].y - ptr.y, d = Math.hypot(dx, dy); if (d < .45) { const f = (1 - d / .45) * .35; P[i].x += mvx * f; P[i].y += mvy * f; } }
    }
    prevPtr.copy(ptr); ptrMoved = false;
    simulate(dt / 2); simulate(dt / 2);
    tension = Math.hypot(end.x - anchor.x, end.y - anchor.y) / ropeL;
    const inSweet = tension >= SWEET[0] && tension <= SWEET[1], over = tension > OVER;

    pull.set(end.x - preRest.x, end.y - preRest.y);
    for (const s of sheets) {
      const e = ease(clamp((revealT - s.delay) / 1.4, 0, 1));
      if (e >= 1 && state === 'open') { s.mesh.visible = false; continue; }
      s.mesh.visible = true;
      let ox = 0, oy = 0, orz = 0;
      if (state === 'closed') {
        const k = (.5 + s.i * .12) * .045; ox = pull.x * k; oy = pull.y * k;
        if (over) { const a = (tension - OVER + .04) * .3 * (.6 + s.i * .1); ox += (Math.random() - .5) * a; oy += (Math.random() - .5) * a; orz = (Math.random() - .5) * a * .35; }
        else if (inSweet && dragging) ox += Math.sin(time * 40 + s.i) * .005;
      }
      s.mesh.position.set(lerp(s.base.x + ox, s.exit.x, e), lerp(s.base.y + oy, s.exit.y, e), lerp(s.base.z, s.exit.z, e));
      s.mesh.rotation.set(lerp(0, s.exit.rx, e), lerp(0, s.exit.ry, e), lerp(s.base.rz + orz, s.exit.rz, e));
    }
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1), env = Math.pow(Math.sin(Math.PI * u), .5), weave = Math.sin(u * Math.PI * 11 + .6) * .55 * env * (1 - q);
      P3[i].set(P[i].x, P[i].y, .4 + weave + q * .25);
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P3), 150, .032, 7, false);
    rope.geometry.dispose(); rope.geometry = geo;
    ropeMat.color.copy(ropeColor).lerp(hotColor, clamp((tension - 1.04) / .12, 0, 1) * (1 - q));
    _d.set(P3[N - 1].x - P3[N - 3].x, P3[N - 1].y - P3[N - 3].y, P3[N - 1].z - P3[N - 3].z).normalize();
    needle.position.copy(P3[N - 1]); needle.quaternion.setFromUnitVectors(UP, _d);
    camera.position.x = lerp(camera.position.x, ptrNdc.x * .25 * (1 - q), .05);
    camera.position.y = lerp(camera.position.y, ptrNdc.y * .15 * (1 - q), .05);
    camera.lookAt(0, 0, 0); camera.rotation.z += -.07 * Math.sin(q * Math.PI);
    if (state === 'closed') {
      dotEl.style.left = toPct(tension) + '%'; dotEl.style.background = over ? C.rojo : '';
      if (dragging && inSweet) hold += dt; else hold = Math.max(0, hold - dt * 2);
      const hp = clamp(hold / .6, 0, 1); holdEl.style.transform = 'scale(' + hp + ')'; holdEl.style.opacity = hp;
      if (hold >= .6) open();
      else if (!touched) setPhrase('Tirá del hilo');
      else if (over) setPhrase('Tan tan. Aflojá.');
      else if (inSweet) setPhrase('Ahí. La medida justa.');
      else if (tension > SWEET[1]) setPhrase('Un poco menos…');
      else if (tension > .82) setPhrase('Un poco más…');
      else setPhrase('Muy muy flojo.');
      _v.copy(P3[N - 1]).project(camera);
      hintEl.style.transform = 'translate(' + ((_v.x + 1) / 2 * hero.clientWidth) + 'px,' + ((1 - _v.y) / 2 * hero.clientHeight) + 'px)';
      hintEl.style.opacity = touched ? 0 : 1;
    }
    renderer.render(scene, camera);
  }
})();
