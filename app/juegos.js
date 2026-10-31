/* Bioferia app · capa de juegos funcionales, sistema por subconcepto y animación.
   Se suma a la app sin cambiar sus textos: engancha su render() y agrega pantallas y gestos.
   - Cada sección es un subconcepto (color y etiqueta).
   - Pagar: se confirma tirando del hilo a la tensión justa (La tensión).
   - Cargar BioPoints: apilás piedras para elegir el monto (El equilibrio).
   - Cuponera: rascás el velo para revelar cada cupón, que se descuenta al pagar (Lo oculto).
   - Mapa: registrás tu visita mandando la señal del espacio en morse (La pista).
   - Mi recorrido: ticket perforado sobre el mapa del predio + pulsera que crece (El giro).
   - Kit de entrada: caja que se abre y stickers para despegar. */
(function () {
  const S = state; // la app expone su estado en el ámbito global
  const doc = document, $q = s => doc.querySelector(s);
  const C = { azul: '#003B94', violeta: '#A330B6', oxido: '#C15F2B', petroleo: '#287C8B', vino: '#861064', magenta: '#D81987', ambar: '#E9A900', ambarO: '#B77D21', tinta: '#1F1C1E', papel: '#F7F5F0', rojo: '#D93A26' };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function el(tag, cls, html) { const e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }
  const fmt = n => Number(n).toLocaleString('es-AR');

  /* ---------- estado propio ---------- */
  const KEY = 'bioferia-juegos-v1';
  const J = (function () { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.visits) return s; } catch (e) { } return { visits: [], coupons: {}, stuck: 0, kitOpen: false }; })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(J)); } catch (e) { } }

  /* ---------- subconceptos ---------- */
  const SUB = {
    home: ['01', 'Lo oculto', 'lino'], profile: ['02', 'La tensión', 'cáñamo'], giro: ['03', 'El giro', 'algodón'],
    guide: ['04', 'La pista', 'arpillera'], wallet: ['05', 'El equilibrio', 'lana'], festival: ['06', 'La revelación', 'hilo reciclado']
  };
  const ZKEYS = ['portal', 'tension', 'giro', 'pista', 'equilibrio', 'revelacion'];
  const ZINFO = k => { const i = ZKEYS.indexOf(k), s = arScenes[i]; return { i, key: k, label: zones[k].label, sub: s.name, color: s.color, fibra: s.fiber.split(' · ')[0] }; };
  const SIGNAL = { portal: 'LI', tension: 'CA', giro: 'AL', pista: 'AR', equilibrio: 'LA', revelacion: 'HI' };
  const MORSE = { A: '.-', C: '-.-.', H: '....', I: '..', L: '.-..', R: '.-.' };
  function visited(k) { return J.visits.some(v => v.k === k); }
  function visit(k) { if (visited(k)) return false; J.visits.push({ k, t: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) }); save(); return true; }

  /* ---------- sonido ---------- */
  let ac = null; const ks = {};
  function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (ac.state === 'suspended') ac.resume(); return ac; }
  function silencio() { }
  function pluck(f, vol) {
    const a = audio(); if (!a) return; const key = Math.round(f); let b = ks[key];
    if (!b) { const sr = a.sampleRate, len = Math.floor(sr * 1.8), N = Math.max(2, Math.round(sr / f)); b = a.createBuffer(1, len, sr); const y = b.getChannelData(0); for (let n = 0; n < N; n++) y[n] = Math.random() * 2 - 1; for (let n = N; n < len; n++) y[n] = .497 * (y[n - N] + (n - N - 1 >= 0 ? y[n - N - 1] : 0)); ks[key] = b; }
    const s = a.createBufferSource(), g = a.createGain(); s.buffer = b; g.gain.value = vol == null ? .5 : vol; s.connect(g); g.connect(a.destination); s.start();
  }
  let osc = null;
  function toneOn(f) { const a = audio(); if (!a) return; toneOff(); osc = a.createOscillator(); const g = a.createGain(); osc.frequency.value = f; g.gain.value = .1; osc.connect(g); g.connect(a.destination); osc.start(); }
  function toneOff() { if (osc) { try { osc.stop(); } catch (e) { } osc = null; } }

  /* ---------- dibujo ---------- */
  function poly(g, p) { g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); }
  function jag(cx, cy, r, R) { const p = []; for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2, rr = r * (.82 + R() * .3); p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return p; }
  function splat(g, x, y, r, col, R, a) {
    g.save(); g.globalAlpha = a == null ? 1 : a; g.fillStyle = col; g.strokeStyle = col; poly(g, jag(x, y, r * .7, R)); g.fill();
    for (let k = 0; k < 12; k++) { const an = R() * 6.283, l = r * (.9 + R() * 1.3); g.lineWidth = Math.max(1, r * (.05 + R() * .1)); g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l); g.stroke(); }
    for (let k = 0; k < 30; k++) { const an = R() * 6.283, d = r * (1 + R() * 2.2); g.beginPath(); g.arc(x + Math.cos(an) * d, y + Math.sin(an) * d, Math.max(.8, r * .06 * R() * 2), 0, 7); g.fill(); }
    g.restore();
  }
  function halftone(g, x, y, w, h, col, s, R, dir) {
    g.save(); g.fillStyle = col; g.beginPath();
    for (let yy = 0; yy < h; yy += s) for (let xx = 0; xx < w; xx += s) { const f = dir === 'c' ? 1 - Math.hypot(xx / w - .5, yy / h - .5) * 2 : dir === 'r' ? xx / w : (xx / w + yy / h) / 2; const rr = Math.max(0, f) * s * .55; if (rr > .5) { const px = x + xx + ((yy / s) % 2) * s / 2, py = y + yy; g.moveTo(px + rr, py); g.arc(px, py, rr, 0, 7); } }
    g.fill(); g.restore();
  }
  function specks(g, W, H, R, n, col, a) { g.save(); g.fillStyle = col; for (let k = 0; k < n; k++) { g.globalAlpha = a * R(); g.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2); } g.restore(); }
  function crossStitch(g, x, y, cell, pat, cols) { g.lineCap = 'round'; pat.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '.') return; const px = x + i * cell, py = y + j * cell, p = cell * .18; g.strokeStyle = cols[+ch]; g.lineWidth = cell * .3; g.beginPath(); g.moveTo(px + p, py + p); g.lineTo(px + cell - p, py + cell - p); g.moveTo(px + cell - p, py + p); g.lineTo(px + p, py + cell - p); g.stroke(); })); }
  function fitCanvas(cv) { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); return { g, W: r.width, H: r.height }; }
  function local(cv, e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function loop(fn, alive) { let last = performance.now(), on = true; (function f(now) { if (!on || (alive && !alive())) return; const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now; fn(dt, now / 1000); requestAnimationFrame(f); })(last); return () => on = false; }

  /* ---------- toast ---------- */
  const shell = $q('.app-shell');
  const toastEl = el('div', 'jg-toast'); toastEl.setAttribute('role', 'status'); shell.appendChild(toastEl);
  function toast(m) { toastEl.textContent = m; toastEl.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => toastEl.classList.remove('on'), 3000); }

  /* ================= OVERLAY DE JUEGO ================= */
  const ov = el('div', 'jg-game'); ov.hidden = true;
  ov.innerHTML = '<header class="jg-head"><button type="button" class="jg-back">← Volver</button><div><p class="jg-eye"></p><h3></h3></div><button type="button" class="jg-again" aria-label="Empezar de nuevo">↺</button></header><p class="jg-goal"></p><div class="jg-stage"></div><p class="jg-msg" aria-live="polite"></p><div class="jg-act"><button type="button" class="jg-btn" hidden></button></div><canvas class="jg-confetti" aria-hidden="true"></canvas>';
  shell.appendChild(ov);
  const stage = ov.querySelector('.jg-stage'), msgEl = ov.querySelector('.jg-msg'), actBtn = ov.querySelector('.jg-btn');
  let cleanup = null, cur = null, won = false, actFn = null;
  const api = {
    msg(t) { if (!won) msgEl.textContent = t; }, won: () => won,
    action(label, fn) { actFn = fn || null; actBtn.hidden = !label; if (label) actBtn.textContent = label; },
    win(t) { if (won) return; won = true; msgEl.textContent = t; buzz([40, 60, 90]); confetti(cur.c); }
  };
  actBtn.addEventListener('click', () => { if (actFn) actFn(); });
  function openGame(G) {
    cur = G; won = false; api.action(null);
    ov.style.setProperty('--gc', G.c); ov.style.setProperty('--gbg', G.bg);
    ov.querySelector('.jg-eye').textContent = G.eye; ov.querySelector('h3').textContent = G.title; ov.querySelector('.jg-goal').textContent = G.goal; msgEl.textContent = '';
    stage.innerHTML = ''; ov.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => { cleanup = G.init(stage, api) || null; }));
  }
  function closeGame() { if (cleanup) cleanup(); cleanup = null; toneOff(); ov.hidden = true; stage.innerHTML = ''; }
  ov.querySelector('.jg-back').addEventListener('click', closeGame);
  ov.querySelector('.jg-again').addEventListener('click', () => { if (cleanup) cleanup(); cleanup = null; toneOff(); openGame(cur); });
  function confetti(col) {
    if (reduce) return; const cv = ov.querySelector('.jg-confetti'), { g, W, H } = fitCanvas(cv);
    const cols = [col, C.ambar, C.magenta, C.azul, C.violeta, C.petroleo, C.oxido], ps = [];
    for (let i = 0; i < 90; i++) ps.push({ x: W / 2 + (Math.random() - .5) * 80, y: H * .5, vx: (Math.random() - .5) * 10, vy: -Math.random() * 12 - 4, a: Math.random() * 6, va: (Math.random() - .5) * .4, l: 10 + Math.random() * 20, c: cols[i % cols.length], w: Math.random() < .6 });
    let t = 0; const stop = loop(dt => {
      t += dt; g.clearRect(0, 0, W, H);
      ps.forEach(p => { p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.strokeStyle = p.c; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-p.l / 2, 0); if (p.w) g.quadraticCurveTo(0, -8, p.l / 2, 0); else g.lineTo(p.l / 2, 0); g.stroke(); g.restore(); });
      if (t > 3.2) { stop(); g.clearRect(0, 0, W, H); }
    });
  }

  /* ================= LO OCULTO · RASCÁ EL CUPÓN ================= */
  // Cada cupón de la cuponera se revela rascando y queda activo para un stand de los ejemplos de pago.
  const COUPON = { Reparar: { shop: 'taller', pct: 20, c: C.violeta }, Reutilizar: { shop: 'huerta', pct: 30, c: C.petroleo }, Compartir: { shop: 'cafe', pct: 50, c: C.magenta } };
  const PAT = { Reparar: ['..0..', '.010.', '01210', '.010.', '..0..'], Reutilizar: ['..0..', '..0..', '01110', '..0..', '..0..'], Compartir: ['0.0.0', '.010.', '01210', '.010.', '0.0.0'] };
  function couponFor(shopId) { const e = Object.entries(COUPON).find(([n, c]) => c.shop === shopId && J.coupons[n] === 'on'); return e ? { name: e[0], pct: e[1].pct } : null; }
  function veil(item, name) {
    const info = COUPON[name], sh = shops.find(s => s.id === info.shop);
    item.classList.add('jg-coupon'); item.style.setProperty('--cc', info.c);
    const art = el('canvas', 'jg-cs'); art.width = art.height = 200; crossStitch(art.getContext('2d'), 0, 0, 40, PAT[name], [info.c, C.oxido, C.oxido]); item.appendChild(art);
    const badge = el('p', 'jg-cbadge', '−' + info.pct + '% en ' + sh.name); item.appendChild(badge);
    const st = J.coupons[name];
    if (st) { item.classList.add(st === 'used' ? 'used' : 'on'); if (st === 'used') badge.textContent += ' · usado'; return; }
    const cv = el('canvas', 'jg-veil'); cv.setAttribute('aria-label', 'Papel para rascar: ' + name); item.appendChild(cv);
    const hint = el('span', 'jg-veil-hint', 'rascá'); item.appendChild(hint);
    requestAnimationFrame(() => {
      const { g, W, H } = fitCanvas(cv), R = rng(name.length * 7);
      g.fillStyle = '#E7E3D8'; g.fillRect(0, 0, W, H); halftone(g, W * .45, 0, W * .55, H, 'rgba(0,59,148,.5)', 9, R, 'r');
      g.strokeStyle = 'rgba(150,140,120,.35)'; g.lineWidth = 1; for (let k = 0; k < 120; k++) { const x = R() * W, y = R() * H, a = R() * 6.28, l = 6 + R() * 22; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
      specks(g, W, H, R, 300, '#1f1c1e', .25);
      const GX = 12, GY = 6, grid = new Uint8Array(GX * GY); let n = 0, down = false, last = null, done = false;
      function scratch(x, y) {
        g.globalCompositeOperation = 'destination-out'; poly(g, jag(x, y, 18, Math.random)); g.fill(); g.globalCompositeOperation = 'source-over';
        for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) { if (grid[j * GX + i]) continue; if (Math.hypot((i + .5) / GX * W - x, (j + .5) / GY * H - y) < 20) { grid[j * GX + i] = 1; n++; } }
        if (!done && n / (GX * GY) > .5) { done = true; cv.style.transition = 'opacity .7s'; cv.style.opacity = 0; cv.style.pointerEvents = 'none'; hint.remove(); J.coupons[name] = 'on'; save(); item.classList.add('on', 'pop'); buzz([30, 40]); silencio(523, .35); toast('Cupón ' + name + ': −' + info.pct + '% en ' + sh.name + '. Se descuenta solo al pagar.'); }
      }
      cv.addEventListener('pointerdown', e => { down = true; cv.setPointerCapture(e.pointerId); last = local(cv, e); scratch(last[0], last[1]); hint.style.opacity = 0; });
      cv.addEventListener('pointermove', e => { if (!down) return; const p = local(cv, e), dd = Math.hypot(p[0] - last[0], p[1] - last[1]); for (let t = 8; t <= dd; t += 8) scratch(last[0] + (p[0] - last[0]) * t / dd, last[1] + (p[1] - last[1]) * t / dd); if (dd >= 8) last = p; });
      const up = () => down = false; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    });
  }

  /* ================= LA TENSIÓN · PAGAR TIRANDO DEL HILO ================= */
  function mountPull(host, onDone) {
    host.innerHTML = '<canvas aria-label="Hilo para tirar y confirmar el pago"></canvas><p class="jg-phrase" aria-live="polite">Tirá del hilo para pagar</p><div class="jg-ruler"><i class="z"></i><i class="d"><b></b></i></div><div class="jg-rl"><span>FLOJO</span><span>JUSTO</span><span>TENSO</span></div><button type="button" class="jg-alt">Prefiero confirmar con un botón</button>';
    const cv = host.querySelector('canvas'), ph = host.querySelector('.jg-phrase'), dot = host.querySelector('.d'), hold = dot.querySelector('b'), zone = host.querySelector('.z');
    host.querySelector('.jg-alt').addEventListener('click', onDone);
    const SW = [.95, 1.04], OVER = 1.1, pct = t => clamp((t - .55) / .75, 0, 1) * 100;
    zone.style.left = pct(SW[0]) + '%'; zone.style.width = (pct(SW[1]) - pct(SW[0])) + '%';
    let g, W, H; ({ g, W, H } = fitCanvas(cv));
    const N = 30, P = [], Q = []; const A = [16, H * .4], R0 = [W * .5, H * .62]; const L = Math.max(W * .62, Math.hypot(R0[0] - A[0], R0[1] - A[1]) * 1.3);
    let E = R0.slice(), drag = false, ptr = [0, 0], hv = 0, tension = .8, done = false, touched = false, lastBuzz = 0, knot = 0;
    for (let i = 0; i < N; i++) { const u = i / (N - 1); P.push([lerp(A[0], E[0], u), lerp(A[1], E[1], u) + Math.sin(Math.PI * u) * 26]); Q.push(P[i].slice()); }
    cv.addEventListener('pointerdown', e => { if (done) return; drag = true; touched = true; cv.setPointerCapture(e.pointerId); ptr = local(cv, e); });
    cv.addEventListener('pointermove', e => { if (drag) ptr = local(cv, e); });
    const up = () => { if (!drag) return; drag = false; if (!done && tension >= SW[0] && tension <= SW[1]) finish(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    function finish() { if (done) return; done = true; buzz([30, 40, 60]); pluck(392, .4); ph.textContent = 'Ni muy muy, ni tan tan.'; setTimeout(onDone, reduce ? 50 : 750); }
    const say = s => { if (ph.textContent !== s) ph.textContent = s; };
    loop(dt => {
      if (drag && !done) { const vx = ptr[0] - A[0], vy = ptr[1] - A[1], dd = Math.hypot(vx, vy), mx = L * 1.28, k = dd > mx ? mx / dd : 1; E[0] = lerp(E[0], A[0] + vx * k, .45); E[1] = lerp(E[1], A[1] + vy * k, .45); }
      else if (!done) { E[0] = lerp(E[0], R0[0], .08); E[1] = lerp(E[1], R0[1], .08); }
      const seg = L / (N - 1), gr = 900 * dt * dt;
      for (let i = 1; i < N - 1; i++) { const vx = (P[i][0] - Q[i][0]) * .98, vy = (P[i][1] - Q[i][1]) * .98; Q[i] = P[i].slice(); P[i][0] += vx; P[i][1] += vy + gr; }
      for (let k = 0; k < 20; k++) { P[0] = A.slice(); P[N - 1] = E.slice(); for (let i = 0; i < N - 1; i++) { const a = P[i], b = P[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], ds = Math.hypot(dx, dy) || 1e-6, df = (ds - seg) / ds; if (i === 0) { b[0] -= dx * df; b[1] -= dy * df; } else if (i + 1 === N - 1) { a[0] += dx * df; a[1] += dy * df; } else { a[0] += dx * df * .5; a[1] += dy * df * .5; b[0] -= dx * df * .5; b[1] -= dy * df * .5; } } }
      tension = Math.hypot(E[0] - A[0], E[1] - A[1]) / L;
      const sweet = tension >= SW[0] && tension <= SW[1], over = tension > OVER;
      if (!done) {
        dot.style.left = pct(tension) + '%'; dot.classList.toggle('over', over);
        if (drag && sweet) hv += dt; else hv = Math.max(0, hv - dt * 2); hold.style.transform = 'scale(' + clamp(hv / .6, 0, 1) + ')';
        if (hv >= .6) finish();
        const now = performance.now(); if (drag && tension > .82 && now - lastBuzz > 140) { lastBuzz = now; buzz(Math.round(clamp((tension - .8) * 90, 4, 40))); }
        if (!touched) say('Tirá del hilo para pagar'); else if (over) say('Tan tan. Aflojá.'); else if (sweet) say('Ahí. La medida justa.'); else if (tension > SW[1]) say('Un poco menos…'); else if (tension > .82) say('Un poco más…'); else say('Muy muy flojo.');
      }
      g.clearRect(0, 0, W, H);
      g.fillStyle = 'rgba(31,28,30,.08)'; for (let y = 10; y < H; y += 16) for (let x = 10; x < W; x += 16) { g.beginPath(); g.arc(x, y, 1.1, 0, 7); g.fill(); }
      const sh = over && !done ? (Math.random() - .5) * 3 : 0; g.lineCap = g.lineJoin = 'round';
      g.strokeStyle = 'rgba(31,28,30,.18)'; g.lineWidth = 6; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0] + 2, p[1] + 4 + sh) : g.moveTo(p[0] + 2, p[1] + 4)); g.stroke();
      g.strokeStyle = over && !done ? C.rojo : done ? C.vino : C.ambar; g.lineWidth = 4.5; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1] + sh) : g.moveTo(p[0], p[1])); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.4; g.setLineDash([3, 5]); g.stroke(); g.setLineDash([]);
      g.fillStyle = C.tinta; g.beginPath(); g.arc(A[0], A[1], 7, 0, 7); g.fill();
      const a = Math.atan2(P[N - 1][1] - P[N - 4][1], P[N - 1][0] - P[N - 4][0]);
      g.save(); g.translate(E[0], E[1]); g.rotate(a); g.strokeStyle = '#555'; g.lineWidth = 4; g.beginPath(); g.moveTo(-4, 0); g.lineTo(32, 0); g.stroke(); g.strokeStyle = '#ddd'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-4, -1); g.lineTo(32, -1); g.stroke(); g.restore();
      if (!touched && !done) { const p = (performance.now() / 900) % 1; g.strokeStyle = 'rgba(134,16,100,' + (1 - p) + ')'; g.lineWidth = 2; g.setLineDash([4, 4]); g.beginPath(); g.arc(E[0], E[1], 14 + p * 16, 0, 7); g.stroke(); g.setLineDash([]); g.font = '21px "Permanent Marker", cursive'; g.fillStyle = C.vino; g.fillText('tirá →', E[0] + 24, E[1] + 30); }
      if (done) { knot = Math.min(1, knot + .04); const m = P[(N / 2) | 0]; g.strokeStyle = C.vino; g.lineWidth = 4.5; g.beginPath(); g.arc(m[0], m[1] - 11 * knot, 11 * knot, 0, Math.PI * 2 * knot); g.stroke(); }
    }, () => host.isConnected);
  }

  /* ================= EL EQUILIBRIO · CARGÁ APILANDO ================= */
  const STONES = { eye: 'El equilibrio · cargar BioPoints', title: 'Apilá lo justo', c: C.vino, bg: '#F6F0F3', goal: 'Tocá para soltar cada piedra. Cada una que queda en equilibrio suma 1.000 BP. Cargá lo justo: nada sobra.',
    init(st, api) {
      const cv = el('canvas', 'jg-cv'); st.appendChild(cv); const { g, W, H } = fitCanvas(cv);
      const groundY = H - 28, MAX = 10, EACH = 1000, base = { x: W / 2, w: Math.min(190, W * .58), h: 28 };
      const cols = [C.tinta, C.vino, C.azul, C.magenta, C.violeta, C.tinta, C.vino, C.azul, C.magenta, C.violeta];
      let stack = [], curS = null, fall = null, topple = null, camY = 0, t = 0;
      const topY = () => groundY - base.h - stack.reduce((s, z) => s + z.h, 0);
      function next() { if (stack.length >= MAX) { curS = null; return; } const k = stack.length; curS = { w: Math.max(46, base.w * .8 - k * 9), h: Math.max(20, 36 - k * 1.6), c: cols[k], x: W / 2, y: 0, ph: Math.random() * 6 }; }
      function upd() { const n = stack.length; api.msg(n ? fmt(n * EACH) + ' BP en equilibrio' + (n >= MAX ? '. La pila está completa.' : '') : 'Cada piedra suma 1.000 BP.'); api.action(n ? 'Usar ' + fmt(n * EACH) + ' BP para la carga' : null, () => { S.amount = stack.length * EACH; closeGame(); render(); toast('Elegiste cargar ' + fmt(S.amount) + ' BP.'); }); }
      next(); upd();
      cv.addEventListener('pointerdown', () => { if (curS && !fall && !topple) { fall = curS; fall.vy = 0; curS = null; } });
      function stability() { let margin = 1, from = -1; for (let k = stack.length - 1; k >= 0; k--) { const sup = k ? stack[k - 1] : base; let m = 0, mx = 0; for (let j = k; j < stack.length; j++) { const a = stack[j].w * stack[j].h; m += a; mx += a * stack[j].x; } const off = Math.abs(mx / m - sup.x) / (sup.w / 2); if (off > 1 && from < 0) from = k; margin = Math.min(margin, 1 - off); } return { margin, from }; }
      function land(s) {
        const below = stack.length ? stack[stack.length - 1] : base, overlap = Math.abs(s.x - below.x) < (s.w + below.w) / 2 - 6;
        stack.push(s); silencio(196 + stack.length * 30, .35); buzz(15);
        const from = !overlap ? stack.length - 1 : stability().from;
        if (from >= 0) { topple = { from, dir: Math.sign(s.x - below.x) || 1, t: 0 }; api.msg('Ni muy muy… se cayó. Las que quedan en equilibrio siguen contando.'); buzz([50, 30, 50]); }
        else { next(); upd(); if (stack.length >= MAX) confetti(C.vino); }
      }
      function stone(s, x, y, rot, label) {
        g.save(); g.translate(x, y + s.h / 2); g.rotate(rot || 0);
        g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(2, 4, s.w / 2, s.h / 2, 0, 0, 7); g.fill();
        g.fillStyle = s.c; g.beginPath(); g.ellipse(0, 0, s.w / 2, s.h / 2, 0, 0, 7); g.fill();
        g.save(); g.clip(); const R = rng(s.w | 0); g.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < 40; k++) g.fillRect((R() - .5) * s.w, (R() - .5) * s.h, 1.6, 1.6); g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.ellipse(-s.w * .15, -s.h * .2, s.w * .28, s.h * .2, 0, 0, 7); g.fill(); g.restore();
        if (label) { g.font = '700 12px "Big Shoulders", sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('+1.000', 0, 4); }
        g.restore();
      }
      return loop(dt => {
        t += dt;
        if (curS) { const range = (W - curS.w) / 2 - 8; curS.x = W / 2 + Math.sin(t * (1.3 + stack.length * .14) + curS.ph) * range * .92; curS.y = topY() - 140; }
        if (fall) { fall.vy += 1500 * dt; fall.y += fall.vy * dt; const ty = topY() - fall.h; if (fall.y >= ty) { fall.y = ty; const s = fall; fall = null; land(s); } }
        if (topple) { topple.t += dt; if (topple.t > 1.3) { stack.splice(topple.from); topple = null; next(); upd(); } }
        camY = lerp(camY, Math.max(0, (groundY - topY()) - H * .5), .08);
        g.clearRect(0, 0, W, H); g.save(); g.translate(0, camY);
        g.strokeStyle = 'rgba(134,16,100,.12)'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(W * (.1 + k * .2), groundY + 30); g.bezierCurveTo(W * (.05 + k * .2), groundY - 200, W * (.25 + k * .18), groundY - 360, W * (.15 + k * .2), groundY - 700); g.stroke(); }
        g.fillStyle = '#B49766'; g.fillRect(0, groundY, W, 60);
        const sb = stack.length && !topple ? stability() : { margin: 1 }, wob = (1 - sb.margin) * .05 * Math.sin(t * 9);
        g.save(); g.translate(W / 2, groundY); g.rotate(wob); g.translate(-W / 2, -groundY);
        stone({ w: base.w, h: base.h, c: '#3a3a3a' }, base.x, groundY - base.h);
        let y = groundY - base.h;
        stack.forEach((s, i) => { y -= s.h; if (topple && i >= topple.from) { const k = topple.t; stone(s, s.x + topple.dir * k * k * 260, y + k * k * 520, topple.dir * k * 2.4); } else stone(s, s.x, y, 0, true); });
        g.restore();
        if (curS) { g.strokeStyle = 'rgba(31,28,30,.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(curS.x, curS.y - 200); g.lineTo(curS.x, curS.y); g.stroke(); stone(curS, curS.x, curS.y); }
        if (fall) stone(fall, fall.x, fall.y);
        g.restore();
        if (curS && !stack.length && t < 4) { g.font = '21px "Permanent Marker", cursive'; g.fillStyle = C.vino; g.textAlign = 'center'; g.fillText('tocá para soltar', W / 2, 36); }
      });
    } };

  /* ================= LA PISTA · REGISTRÁ TU VISITA EN MORSE ================= */
  function openMorse(k, after) {
    const z = ZINFO(k), WORD = SIGNAL[k];
    openGame({ eye: 'La pista · registrar visita', title: z.label, c: C.petroleo, bg: '#E7F0F1', goal: 'Cada espacio muestra su señal. Mandala con el telégrafo y se perfora tu ticket de recorrido.',
      init(st, api) {
        const box = el('div', 'jg-mo'); st.appendChild(box);
        box.appendChild(el('div', 'jg-sign', '<span>Señal de ' + z.label + '<small>' + z.sub + ' · ' + z.fibra.toLowerCase() + '</small></span><b>' + WORD + '</b>'));
        const tape = el('canvas', 'jg-tape'); box.appendChild(tape);
        const word = el('div', 'jg-word', [...WORD].map(ch => '<div class="l"><b>' + ch + '</b><span>' + [...MORSE[ch]].map(s => '<i class="' + (s === '.' ? 'd' : 'r') + '"></i>').join('') + '</span></div>').join('')); box.appendChild(word);
        const key = el('button', 'jg-key', 'tocá · mantené'); key.type = 'button'; box.appendChild(key);
        box.appendChild(el('p', 'jg-help', 'Toque corto = punto · toque largo = raya'));
        const { g: tg, W: TW, H: TH } = fitCanvas(tape);
        let li = 0, si = 0, t0 = 0, pressing = false; const marks = [], letters = [...word.children];
        function down(e) { if (pressing || li >= WORD.length) return; pressing = true; t0 = performance.now(); key.classList.add('down'); toneOn(620); buzz(15); if (e && e.pointerId != null) key.setPointerCapture(e.pointerId); }
        function upk() {
          if (!pressing) return; pressing = false; key.classList.remove('down'); toneOff();
          const sym = performance.now() - t0 < 240 ? '.' : '-'; marks.push({ s: sym, x: TW - 30 });
          const Lt = letters[li], exp = MORSE[WORD[li]];
          if (sym === exp[si]) {
            Lt.querySelectorAll('i')[si].classList.add('on'); si++;
            if (si === exp.length) { Lt.classList.add('ok'); buzz([20, 30, 20]); li++; si = 0;
              if (li === WORD.length) { api.win('Señal recibida. Todo contacto deja algo.'); api.action('Perforar mi ticket ✕', () => { closeGame(); after(); }); }
              else api.msg('Bien. Ahora la ' + WORD[li] + '.'); }
          } else { Lt.classList.remove('err'); void Lt.offsetWidth; Lt.classList.add('err'); Lt.querySelectorAll('i').forEach(i => i.classList.remove('on')); si = 0; buzz([50, 30, 50]); api.msg('Eso fue ' + (sym === '.' ? 'un punto' : 'una raya') + '. Empezá la ' + WORD[li] + ' de nuevo.'); }
        }
        key.addEventListener('pointerdown', down); key.addEventListener('pointerup', upk); key.addEventListener('pointercancel', upk);
        const kd = e => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); down(); } }, ku = e => { if (e.code === 'Space') { e.preventDefault(); upk(); } };
        addEventListener('keydown', kd); addEventListener('keyup', ku);
        api.msg('Empezá por la ' + WORD[0] + '.');
        const stop = loop(dt => {
          tg.clearRect(0, 0, TW, TH); tg.fillStyle = C.petroleo; tg.fillRect(0, 8, TW, TH - 16);
          tg.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 6; x < TW; x += 12) { tg.beginPath(); tg.arc(x, 14, 2, 0, 7); tg.arc(x, TH - 14, 2, 0, 7); tg.fill(); }
          marks.forEach(m => m.x -= 50 * dt); tg.fillStyle = C.papel; const y = TH / 2;
          marks.forEach(m => { tg.beginPath(); if (m.s === '.') tg.arc(m.x, y, 6, 0, 7); else tg.rect(m.x - 15, y - 6, 30, 12); tg.fill(); });
          if (pressing) { const w = Math.min(40, (performance.now() - t0) / 8); tg.fillStyle = C.ambar; tg.beginPath(); tg.arc(TW - 30, y, 6 + w / 6, 0, 7); tg.fill(); }
        });
        return () => { stop(); removeEventListener('keydown', kd); removeEventListener('keyup', ku); toneOff(); };
      } });
  }
  function registerVisit(k) {
    if (visited(k)) { toast('Ya registraste ' + zones[k].label + '.'); return; }
    openMorse(k, () => { visit(k); buzz(35); S.screen === 'recorrido' ? render() : go('recorrido'); setTimeout(() => toast('Se perforó tu ticket en ' + zones[k].label + '. Tu pulsera sumó ' + ZINFO(k).fibra.toLowerCase() + '.'), 400); });
  }

  /* ================= EL GIRO · MI RECORRIDO ================= */
  screens.recorrido = function () {
    const n = J.visits.length, nextK = ZKEYS.find(k => !visited(k));
    const holes = J.visits.map((v, i) => { const z = zones[v.k], c = ZINFO(v.k).color; return '<span class="jg-hole" style="left:' + z.x + '%;top:' + z.y + '%;--hc:' + c + ';--i:' + i + '"></span>'; }).join('');
    const pins = ZKEYS.filter(k => !visited(k)).map(k => '<span class="jg-pending" style="left:' + zones[k].x + '%;top:' + zones[k].y + '%">' + zones[k].symbol + '</span>').join('');
    const path = J.visits.map(v => zones[v.k].x + ',' + zones[v.k].y).join(' ');
    return back('festival') + title('FESTIVAL · MI RECORRIDO', 'Tu camino, puntada a puntada.', 'Cada espacio que registrás perfora tu ticket y le suma una hebra a tu pulsera.') +
      '<div class="jg-ticket"><header><span>TICKET DE RECORRIDO</span><span>' + n + ' / 6</span></header><div class="jg-tmap"><img src="assets/cenital-violeta.webp" alt="Vista cenital del predio con tus visitas perforadas">' +
      '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + path + '" fill="none" stroke="#1F1C1E" stroke-width="1.2" stroke-dasharray="2.5 1.6" vector-effect="non-scaling-stroke"/></svg>' + pins + holes + '</div><div class="jg-perf"></div><footer><span>Hipódromo de Palermo · 9 al 11 de abril</span><b>N° 00432</b></footer></div>' +
      (nextK ? '<button class="primary blue" data-reg="' + nextK + '"><span>Registrar visita: ' + zones[nextK].label + '</span><span aria-hidden="true">↗</span></button>' : '<div class="notice"><strong>Recorriste los seis espacios.</strong><br>Tu trama está completa.</div>') +
      '<div class="section-head"><h2>Tu pulsera</h2></div><canvas class="jg-bracelet" aria-label="Tu pulsera con ' + n + ' hebras"></canvas><p class="jg-trama">' + (n >= 6 ? 'Trama completa. Nada sobra.' : (6 - n) + (6 - n === 1 ? ' hebra' : ' hebras') + ' para completar la trama') + '</p>' +
      '<div class="jg-strands">' + ZKEYS.map(k => { const z = ZINFO(k), v = J.visits.find(x => x.k === k); return '<div class="' + (v ? 'on' : '') + '" style="--sc:' + z.color + '"><i></i><span><strong>' + z.fibra + '</strong> · ' + z.sub + '</span><small>' + (v ? zones[k].label + ' · ' + v.t : 'falta') + '</small></div>'; }).join('') + '</div>' +
      '<button class="text-button" data-jg="resetRecorrido">Empezar el recorrido de nuevo</button><p class="note">Recorrido de demostración: se guarda solo en este navegador.</p>';
  };
  function drawBracelet(cv) {
    let off = 0;
    loop(dt => {
      const r = cv.getBoundingClientRect(); if (!r.width) return; const dd = Math.min(2, devicePixelRatio || 1);
      if (cv.width !== Math.round(r.width * dd)) { cv.width = r.width * dd; cv.height = r.height * dd; }
      const g = cv.getContext('2d'), W = r.width, H = r.height; g.setTransform(dd, 0, 0, dd, 0, 0); g.clearRect(0, 0, W, H);
      if (!reduce) off += dt * 4;
      const cols = J.visits.length ? J.visits.map(v => ZINFO(v.k).color) : ['#D8D3CA'], n = cols.length, rows = Math.max(2, n);
      const cx = W / 2, cy = H * .34, rx = Math.min(W * .42, 150), ry = rx * .34, th = 12 + n * 7, K = 96;
      g.fillStyle = 'rgba(31,28,30,.12)'; g.beginPath(); g.ellipse(cx, cy + th + ry * .95, rx * .95, ry * .35, 0, 0, 7); g.fill();
      const band = (from, to, back) => { for (let k = from; k < to; k++) { const a0 = k / K * Math.PI * 2, a1 = (k + 1) / K * Math.PI * 2, x0 = cx + Math.cos(a0) * rx, y0 = cy + Math.sin(a0) * ry, x1 = cx + Math.cos(a1) * rx, y1 = cy + Math.sin(a1) * ry; for (let j = 0; j < rows; j++) { const idx = ((Math.floor((k + Math.floor(off) + Math.abs(j - (rows - 1) / 2) * 2) / 2) % n) + n) % n; g.fillStyle = cols[idx]; g.beginPath(); g.moveTo(x0, y0 + th * j / rows); g.lineTo(x1, y1 + th * j / rows); g.lineTo(x1, y1 + th * (j + 1) / rows + .5); g.lineTo(x0, y0 + th * (j + 1) / rows + .5); g.closePath(); g.fill(); } if (back) { g.fillStyle = 'rgba(31,28,30,.3)'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x1, y1 + th); g.lineTo(x0, y0 + th); g.closePath(); g.fill(); } } };
      band(K / 2, K, true); band(0, K / 2, false);
      const tx = cx, ty = cy + ry + th * .5; cols.forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 3.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + (i - (n - 1) / 2) * 12, ty + 30, tx + (i - (n - 1) / 2) * 16 + Math.sin(off * .3 + i) * 3, ty + 56); g.stroke(); });
      g.fillStyle = C.tinta; g.beginPath(); g.arc(tx, ty, 7, 0, 7); g.fill();
    }, () => cv.isConnected);
  }

  /* ================= KIT DE ENTRADA ================= */
  const KIT = [
    { name: 'Pulsera de ingreso', img: 'extra/pulsera.jpg', text: 'Tu acceso a los tres días, con el QR para pagar con BioPoints.' },
    { name: 'Ticket de recorrido', img: null, text: 'Se perfora en cada espacio que registrás. Al final del día los agujeros dibujan tu camino.' },
    { name: 'Cuponera Nada sobra', img: 'extra/cuponera.jpg', text: 'Tres cupones para rascar en la app y usar en los stands.' },
    { name: 'Stickers', img: 'extra/stickers.jpg', text: 'Cinco frases para pegar: ni muy flojo, ni tan tirante.' },
    { name: 'Pines', img: 'extra/pines.jpg', text: 'Tres pines para la bolsa o la campera.' },
    { name: 'Bolsa de lienzo', img: 'extra/tote.jpg', text: 'Para llevar lo que ya tenés.' }
  ];
  (function ticketArt() {
    const c = doc.createElement('canvas'); c.width = c.height = 240; const g = c.getContext('2d');
    g.fillStyle = '#E9E6DD'; g.fillRect(0, 0, 240, 240); g.save(); g.translate(120, 120); g.rotate(-.12);
    g.fillStyle = '#fff'; g.fillRect(-90, -55, 180, 110); g.strokeStyle = C.tinta; g.setLineDash([3, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(40, -55); g.lineTo(40, 55); g.stroke(); g.setLineDash([]);
    g.fillStyle = C.tinta; g.font = '700 15px "Big Shoulders",sans-serif'; g.fillText('TICKET DE RECORRIDO', -80, -34);
    [[-70, 10, C.azul], [-40, 24, C.violeta], [-12, 0, C.petroleo], [14, 18, C.oxido]].forEach(([x, y, col]) => { g.fillStyle = '#9b968b'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke(); });
    g.restore(); KIT[1].img = c.toDataURL();
    const b = doc.createElement('canvas'); b.width = 520; b.height = 300; const q = b.getContext('2d'), R = rng(12);
    q.fillStyle = C.papel; q.fillRect(0, 0, 520, 300); halftone(q, 0, 0, 520, 300, 'rgba(233,169,0,.55)', 14, R, 'r');
    q.fillStyle = C.azul; poly(q, jag(300, 150, 160, R)); q.fill(); halftone(q, 200, 40, 260, 220, 'rgba(0,10,50,.45)', 10, R, 'c');
    splat(q, 120, 90, 40, C.ambar, R); splat(q, 430, 220, 30, C.tinta, R, .8); specks(q, 520, 300, R, 1200, '#1f1c1e', .3);
    doc.documentElement.style.setProperty('--jg-boxtex', 'url(' + b.toDataURL('image/jpeg', .85) + ')');
  })();
  const FAN = [[-92, -228, -7], [0, -238, 2], [92, -224, 8], [-92, -114, 5], [0, -122, -3], [92, -112, -6]];
  screens.kit = function () {
    return back('festival') + title('FESTIVAL · TU KIT', 'Lo que te llevás.', 'Abrí la caja y despegá tus stickers.') +
      '<div class="jg-kit' + (J.kitOpen ? ' open' : '') + '"><p class="jg-kit-hint">tu kit te espera ↓</p><div class="jg-box"><div class="b-back"></div><div class="jg-items">' +
      KIT.map((k, i) => '<button class="jg-item" type="button" data-kit="' + i + '" style="--i:' + i + ';--x:' + FAN[i][0] + 'px;--y:' + FAN[i][1] + 'px;--r:' + FAN[i][2] + 'deg"><img src="' + k.img + '" alt=""><span>' + k.name + '</span></button>').join('') +
      '</div><div class="b-front"><span>BIOFERIA · KIT DE ENTRADA</span></div><button class="jg-lid" type="button" data-jg="openKit" aria-label="Abrir la tapa del kit"></button></div></div>' +
      (J.kitOpen ? '' : '<button class="primary blue" data-jg="openKit"><span>Abrí tu kit</span><span aria-hidden="true">↗</span></button>') +
      '<div class="jg-kit-detail" hidden></div><div class="section-head"><h2>Despegá tus stickers</h2></div><div class="jg-peel"><canvas aria-label="Sticker para despegar"></canvas></div><div class="jg-board"></div>';
  };
  const PHR = [['ni muy perfecto', 'tan roto', C.ambar, C.magenta], ['ni muy flojo', 'tan tirante', C.violeta, C.tinta], ['ni tan nuevo', 'tan viejo', C.azul, C.ambar], ['ni tan rápido', 'tan lento', C.petroleo, C.tinta], ['ni muy muy', 'tan tan', C.oxido, C.tinta]];
  function stickerArt(i, r) {
    const s = Math.round(r * 2), c = doc.createElement('canvas'); c.width = c.height = s * 2; const g = c.getContext('2d'), R = rng(40 + i * 9), [a, b, c1, c2] = PHR[i % 5];
    g.scale(2, 2); g.beginPath(); g.arc(r, r, r, 0, 7); g.clip(); g.fillStyle = '#F6F3EC'; g.fillRect(0, 0, s, s);
    splat(g, s * R(), s * (.2 + R() * .3), r * .4, c1, R, .9); splat(g, s * R(), s * (.7 + R() * .2), r * .3, c2, R, .85); halftone(g, 0, s * .66, s, s * .34, 'rgba(31,28,30,.3)', 7, R, 'r');
    g.fillStyle = 'rgba(246,243,236,.92)'; g.beginPath(); g.ellipse(r, r * 1.04, r * .82, r * .5, -.05, 0, 7); g.fill();
    g.fillStyle = C.tinta; g.textAlign = 'center'; g.font = '700 ' + r * .17 + 'px "Space Grotesk",Arial,sans-serif'; g.fillText('BIOFERIA', r, r * .5);
    g.font = '600 ' + r * .2 + 'px "Space Grotesk",Arial,sans-serif'; g.fillText(a, r, r * .9);
    g.font = '700 ' + r * .12 + 'px "Big Shoulders",sans-serif'; g.fillText('NI', r, r * 1.06);
    g.font = r * .27 + 'px "Permanent Marker",cursive'; g.fillText(b.toUpperCase(), r, r * 1.33);
    g.strokeStyle = C.oxido; g.lineWidth = 2.5; g.beginPath(); for (let x = 0; x <= r * 1.1; x += 7) g.lineTo(r * .45 + x, r * 1.42 + ((x / 7) % 2 ? -4 : 3)); g.stroke();
    return c;
  }
  function mountKit() {
    const kit = $q('.jg-kit'); if (!kit) return;
    const detail = $q('.jg-kit-detail');
    kit.querySelectorAll('.jg-item').forEach(b => b.addEventListener('click', () => { const k = KIT[+b.dataset.kit]; detail.hidden = false; detail.innerHTML = '<img src="' + k.img + '" alt=""><div><strong>' + k.name + '</strong><p>' + k.text + '</p></div>'; detail.style.animation = 'none'; void detail.offsetWidth; detail.style.animation = ''; }));
    const lid = kit.querySelector('.jg-lid'); let ly = null;
    lid.addEventListener('pointerdown', e => { ly = e.clientY; lid.setPointerCapture(e.pointerId); });
    lid.addEventListener('pointermove', e => { if (ly == null) return; const dy = Math.min(0, e.clientY - ly); lid.style.transform = 'translateY(' + dy * .6 + 'px) rotate(' + dy * -.06 + 'deg)'; if (dy < -40) { ly = null; lid.style.transform = ''; openKit(); } });
    lid.addEventListener('pointerup', () => { ly = null; lid.style.transform = ''; });
    // stickers
    const pc = kit.parentElement.querySelector('.jg-peel canvas'), board = $q('.jg-board');
    function renderBoard() { board.innerHTML = J.stuck ? '' : '<p>Tu compu está vacía. Despegá un sticker.</p>'; for (let i = 0; i < J.stuck; i++) board.insertAdjacentHTML('beforeend', '<span class="stk" style="--bg:url(' + stickerArt(i % 5, 40).toDataURL() + ');--r:' + ((i * 37) % 30 - 15) + 'deg"></span>'); }
    renderBoard();
    let { g: pg, W: PW, H: PH } = fitCanvas(pc); const r = Math.min(PW * .3, 92); let art = stickerArt(J.stuck % 5, r), drag = null, flyT = -1, pop = 0, ptime = 0;
    pc.addEventListener('pointerdown', e => { if (flyT >= 0) return; const p = local(pc, e), O = [PW / 2, PH / 2]; if (Math.hypot(p[0] - O[0], p[1] - O[1]) > r + 24) return; let dx = p[0] - O[0], dy = p[1] - O[1], Ln = Math.hypot(dx, dy); if (Ln < r * .4) { dx = 1; dy = 1; Ln = Math.SQRT2; } drag = { c: [O[0] + dx / Ln * r, O[1] + dy / Ln * r], p: p.slice(), rel: false }; pc.setPointerCapture(e.pointerId); buzz(8); });
    pc.addEventListener('pointermove', e => { if (drag && !drag.rel) drag.p = local(pc, e); });
    const pup = () => { if (drag) drag.rel = true; }; pc.addEventListener('pointerup', pup); pc.addEventListener('pointercancel', pup);
    loop(dt => {
      ptime += dt; const O = [PW / 2, PH / 2]; pg.clearRect(0, 0, PW, PH);
      if (flyT >= 0) { flyT += dt; const k = Math.min(1, flyT / .5); pg.save(); pg.globalAlpha = 1 - k; pg.translate(O[0], O[1] + k * 150); pg.rotate(k * 1.2); pg.scale(1 - k * .6, 1 - k * .6); pg.drawImage(art, -r, -r, 2 * r, 2 * r); pg.restore(); if (k >= 1) { flyT = -1; J.stuck++; save(); renderBoard(); art = stickerArt(J.stuck % 5, r); pop = 0; toast(J.stuck % 5 === 0 ? 'Pegaste los cinco stickers.' : 'Sticker pegado.'); } return; }
      pop = Math.min(1, pop + dt * 3); const sc = reduce ? 1 : 1 - Math.pow(1 - pop, 3) * .5 + Math.sin(pop * Math.PI) * .06;
      let Cp, P;
      if (drag) { Cp = drag.c; P = drag.p; if (drag.rel) { drag.p = [lerp(P[0], Cp[0], .2), lerp(P[1], Cp[1], .2)]; if (Math.hypot(P[0] - Cp[0], P[1] - Cp[1]) < 2) drag = null; } }
      if (!Cp) { const a = Math.PI / 4; Cp = [O[0] + Math.cos(a) * r, O[1] + Math.sin(a) * r]; const k = reduce ? 14 : 12 + Math.sin(ptime * 3) * 7; P = [Cp[0] - Math.cos(a) * k, Cp[1] - Math.sin(a) * k]; }
      const M = [(Cp[0] + P[0]) / 2, (Cp[1] + P[1]) / 2]; let n = [P[0] - Cp[0], P[1] - Cp[1]]; const Ln = Math.hypot(n[0], n[1]) || 1; n = [n[0] / Ln, n[1] / Ln]; const td = [-n[1], n[0]];
      const dO = (O[0] - M[0]) * n[0] + (O[1] - M[1]) * n[1];
      if (drag && !drag.rel && dO < r * .2) { drag = null; flyT = 0; buzz([20, 30]); silencio(523, .3); return; }
      const half = () => { const B = 2000; pg.beginPath(); pg.moveTo(M[0] + td[0] * B, M[1] + td[1] * B); pg.lineTo(M[0] - td[0] * B, M[1] - td[1] * B); pg.lineTo(M[0] - td[0] * B + n[0] * B, M[1] - td[1] * B + n[1] * B); pg.lineTo(M[0] + td[0] * B + n[0] * B, M[1] + td[1] * B + n[1] * B); pg.closePath(); };
      pg.save(); pg.translate(O[0], O[1]); pg.scale(sc, sc); pg.translate(-O[0], -O[1]);
      pg.save(); half(); pg.clip(); pg.fillStyle = 'rgba(0,0,0,.16)'; pg.beginPath(); pg.arc(O[0] + 2, O[1] + 4, r, 0, 7); pg.fill(); pg.drawImage(art, O[0] - r, O[1] - r, 2 * r, 2 * r); pg.restore();
      const O2 = [O[0] - 2 * dO * n[0], O[1] - 2 * dO * n[1]];
      pg.save(); half(); pg.clip(); pg.shadowColor = 'rgba(0,0,0,.28)'; pg.shadowBlur = 12; pg.shadowOffsetX = n[0] * 5; pg.shadowOffsetY = n[1] * 5;
      const gr = pg.createLinearGradient(M[0], M[1], M[0] + n[0] * r, M[1] + n[1] * r); gr.addColorStop(0, '#CFCABF'); gr.addColorStop(.35, '#FFFFFF'); gr.addColorStop(1, '#ECE8DF'); pg.fillStyle = gr; pg.beginPath(); pg.arc(O2[0], O2[1], r, 0, 7); pg.fill(); pg.restore();
      pg.restore();
      if (!drag && J.stuck === 0) { pg.font = '19px "Permanent Marker", cursive'; pg.fillStyle = C.vino; pg.textAlign = 'center'; pg.fillText('despegalo desde el borde', PW / 2, PH - 12); }
    }, () => pc.isConnected);
  }
  function openKit() { if (J.kitOpen) return; J.kitOpen = true; save(); const kit = $q('.jg-kit'); if (kit) kit.classList.add('open'); const b = $q('.app-content .primary[data-jg="openKit"]'); if (b) b.remove(); buzz([20, 40, 20]); silencio(262, .35); setTimeout(() => silencio(392, .3), 250); setTimeout(() => silencio(523, .25), 500); }

  /* ================= TIENDA (merch con BioPoints) ================= */
  const MERCH = [
    { id: 'm-yoyo', name: 'Yoyó Bioferia', category: 'Tienda Bioferia', amount: 900, img: 'extra/yoyo.jpg', c: C.oxido },
    { id: 'm-taza', name: 'Taza Nada sobra', category: 'Tienda Bioferia', amount: 1500, img: 'extra/taza.jpg', c: C.magenta },
    { id: 'm-bolsa', name: 'Bolsa de lienzo', category: 'Tienda Bioferia', amount: 1800, img: 'extra/tote.jpg', c: C.azul },
    { id: 'm-pines', name: 'Set de pines', category: 'Tienda Bioferia', amount: 600, img: 'extra/pines.jpg', c: C.ambar },
    { id: 'm-kit', name: 'Kit Armá tu pulsera', category: 'Tienda Bioferia', amount: 1200, img: 'extra/kit.jpg', c: C.violeta }
  ];

  /* ================= SISTEMA: render envuelto ================= */
  const THEME_OF = { recorrido: 'giro', kit: 'giro' };
  let lastScreen = null, lastRef = null, checking = false;
  const baseRender = render;
  render = function () {
    baseRender();
    const scr = S.screen, changed = scr !== lastScreen; lastScreen = scr;
    const content = $q('#app-content'), sh = $q('.app-shell');
    if (THEME_OF[scr]) { sh.dataset.theme = THEME_OF[scr]; content.dataset.screen = scr; const nav = $q('#app-nav'); nav.querySelectorAll('button').forEach(b => { const on = b.dataset.go === 'festival'; b.classList.toggle('active', on); }); }
    const theme = sh.dataset.theme, sub = SUB[theme];
    if (sub) { const hero = content.querySelector('.app-hero'); const tag = '<span class="jg-sub">' + sub[0] + ' · ' + sub[1] + '<small>' + sub[2] + '</small></span>'; if (hero) hero.insertAdjacentHTML('beforeend', tag); else content.insertAdjacentHTML('afterbegin', '<div class="jg-subbar">' + tag + '</div>'); }
    if (changed && !reduce) { content.classList.remove('jg-enter'); void content.offsetWidth; content.classList.add('jg-enter'); const navOn = $q('#app-nav .active'); if (navOn) navOn.classList.add('jg-pop'); countUp(); }
    (HOOK[scr] || (() => { }))();
  };
  function countUp() {
    doc.querySelectorAll('.home-balance strong, .wallet-hero .amount').forEach(elm => {
      const node = [...elm.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.textContent)); if (!node) return;
      const target = Number(node.textContent.replace(/\D/g, '')), t0 = performance.now();
      (function f(now) { const k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3); node.textContent = fmt(Math.round(target * e)) + ' '; if (k < 1 && node.isConnected) requestAnimationFrame(f); })(t0);
    });
  }
  const HOOK = {
    wallet() {
      const entry = $q('.coupon-entry'); if (entry) { const on = Object.values(J.coupons).filter(v => v === 'on').length, left = 3 - Object.keys(J.coupons).length; entry.querySelector('small').insertAdjacentHTML('afterend', '<em class="jg-cstate">' + (left ? 'Rascá ' + left + (left === 1 ? ' cupón' : ' cupones') : '') + (left && on ? ' · ' : '') + (on ? on + ' activo' + (on > 1 ? 's' : '') : '') + '</em>'); }
      const body = $q('.page-body'); if (!body || body.querySelector('.jg-shop')) return;
      const head = [...body.querySelectorAll('.section-head')].pop();
      const shop = el('div', 'jg-shopwrap', '<div class="section-head"><h2>Tienda · canjeá con BioPoints</h2></div><div class="jg-shop">' + MERCH.map(m => '<button class="jg-prod" data-merch="' + m.id + '" style="--pc:' + m.c + '"><img src="' + m.img + '" alt=""><strong>' + m.name + '</strong><span>' + fmt(m.amount) + ' BP</span></button>').join('') + '</div>');
      head.parentNode.insertBefore(shop, head);
      shop.addEventListener('pointermove', e => { const c = e.target.closest('.jg-prod'); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 16 + 'deg'); c.style.setProperty('--rx', -((e.clientY - r.top) / r.height - .5) * 16 + 'deg'); });
      shop.addEventListener('pointerout', e => { const c = e.target.closest('.jg-prod'); if (c) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); } });
    },
    coupons() { doc.querySelectorAll('.coupon-item').forEach(item => { const name = item.querySelector('strong').textContent.trim(); if (COUPON[name]) veil(item, name); }); },
    topup() {
      const list = $q('.choice-list'); if (!list) return;
      const b = el('button', 'jg-stonebtn', '<span><strong>Apilá piedras para elegir el monto</strong><small>Cada piedra que queda en equilibrio suma 1.000 BP</small></span><b aria-hidden="true">↗</b>'); b.type = 'button';
      b.addEventListener('click', () => openGame(STONES)); list.parentNode.insertBefore(b, list);
    },
    review() {
      const p = S.purchase; if (!p) return;
      if (!p._jg && !checking) {
        const shopId = p.id || (shops.find(s => s.name === p.name) || {}).id, cp = couponFor(shopId);
        S.purchase = Object.assign({}, p, { _jg: true, id: shopId }, cp ? { original: p.amount, amount: Math.round(p.amount * (1 - cp.pct / 100)), coupon: cp.name } : {});
        checking = true; render(); checking = false; return;
      }
      if (p.coupon) { const tot = $q('.receipt .total'); if (tot) tot.insertAdjacentHTML('afterend', '<p class="jg-applied">Cupón ' + p.coupon + ' aplicado · antes ' + fmt(p.original) + ' BP</p>'); }
      const btn = $q('.app-content .primary[data-action="confirm"]');
      if (btn) { const host = el('div', 'jg-pull'); btn.parentNode.insertBefore(host, btn); btn.hidden = true; mountPull(host, () => { btn.hidden = false; btn.click(); }); }
    },
    receipt() {
      const t = S.receipt; if (!t || t.ref === lastRef) return; lastRef = t.ref;
      const p = S.purchase || {};
      if (p.coupon && J.coupons[p.coupon] === 'on') { J.coupons[p.coupon] = 'used'; save(); }
      const isStand = shops.some(s => s.id === p.id), isNew = isStand && visit('giro');
      if (isNew) setTimeout(() => toast('Se perforó tu ticket en ' + zones.giro.label + ' y tu pulsera sumó ' + ZINFO('giro').fibra.toLowerCase() + '.'), 500);
      const mark = $q('.receipt-mark'); if (mark && !reduce) mark.classList.add('jg-stamp');
      const backBtn = $q('.app-content .primary[data-action="home"]'); if (backBtn && isStand) backBtn.insertAdjacentHTML('beforebegin', '<button class="primary" data-go="recorrido"><span>Ver mi recorrido</span><span aria-hidden="true">↗</span></button>');
    },
    festival() {
      const lists = doc.querySelectorAll('.festival-actions'), l = lists[lists.length - 1]; if (!l) return;
      const n = J.visits.length;
      l.insertAdjacentHTML('beforeend', '<button data-go="recorrido" class="jg-new"><span><strong>Mi recorrido</strong><small>Ticket perforado y pulsera · ' + n + ' de 6 espacios</small></span><b aria-hidden="true"><span class="forward-arrow">↗</span></b></button><button data-go="kit" class="jg-new"><span><strong>Mi kit de entrada</strong><small>Abrí la caja y despegá tus stickers</small></span><b aria-hidden="true"><span class="forward-arrow">↗</span></b></button>');
    },
    map() {
      const card = $q('.location-card'); if (!card) return; const k = S.zone, z = ZINFO(k);
      card.style.setProperty('--zc', z.color); card.classList.add('jg-zone');
      card.insertAdjacentHTML('beforeend', visited(k) ? '<p class="jg-done">✕ Registraste esta visita</p>' : '<button class="jg-reg" data-reg="' + k + '">Registrar visita con la señal ' + SIGNAL[k] + ' ↗</button>');
      doc.querySelectorAll('.map-pin').forEach(p => { if (visited(p.dataset.zone)) p.classList.add('jg-visited'); });
    },
    profile() {
      const links = $q('.profile-links'); if (!links) return;
      links.insertAdjacentHTML('beforeend', '<button data-go="recorrido"><span><strong>Mi recorrido</strong><small>' + J.visits.length + ' de 6 espacios · ticket y pulsera</small></span><b aria-hidden="true"><span class="forward-arrow">↗</span></b></button><button data-go="kit"><span><strong>Mi kit de entrada</strong><small>' + (J.kitOpen ? 'Abierto' : 'Sin abrir') + ' · ' + J.stuck + ' stickers pegados</small></span><b aria-hidden="true"><span class="forward-arrow">↗</span></b></button>');
    },
    recorrido() { const cv = $q('.jg-bracelet'); if (cv) drawBracelet(cv); },
    kit() { mountKit(); }
  };

  /* clicks propios (se ejecutan antes que los de la app) */
  doc.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.merch) { e.stopImmediatePropagation(); const m = MERCH.find(x => x.id === b.dataset.merch); S.purchase = { id: m.id, name: m.name, category: m.category, amount: m.amount }; go('review'); return; }
    if (b.dataset.reg) { e.stopImmediatePropagation(); registerVisit(b.dataset.reg); return; }
    if (b.dataset.jg === 'openKit') { e.stopImmediatePropagation(); openKit(); return; }
    if (b.dataset.jg === 'resetRecorrido') { e.stopImmediatePropagation(); J.visits = []; save(); render(); toast('Arrancó un recorrido nuevo.'); return; }
    if (b.dataset.shop) { S.purchase = null; }
  }, true);

  render();
})();
