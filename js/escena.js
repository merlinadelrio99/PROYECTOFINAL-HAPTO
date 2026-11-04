/* Bioferia 2027 · escena: la web como un solo fondo que cambia.
   Reemplaza la capa de óvalos y contenedores. Los textos de la web no cambian.
   1  Tela para romper (entrada)            8  La pista: el mapa se ilumina por capas
   2  El fondo cambia de color al bajar     9  Transformación: paneles que se dan vuelta
   3  Bandas de frases que se deslizan     10  Hecho y cosido: personajes que pasan uno a uno
   4  Campo de puntos del inicio            11  Impacto: campo de frecuencias
   5  La tensión: cuerdas sobre el stand    12  Aguja como cursor
   6  Calesita de subconceptos
   7  Experiencias en 3D, una por una */
(function () {
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fino = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const C = { oculto: '#003B94', tension: '#A330B6', giro: '#C15F2B', pista: '#028EA5', equilibrio: '#C2186B', revelacion: '#E19A00', tinta: '#141214', papel: '#F3F3F1' };
  const SUBS = [['Lo oculto', C.oculto], ['La tensión', C.tension], ['El giro', C.giro], ['La pista', C.pista], ['El equilibrio', C.equilibrio], ['La revelación', C.revelacion]];
  let mx = -9999, my = -9999; addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  const visible = (el, cb, m) => new IntersectionObserver(es => cb(es[0].isIntersecting), { rootMargin: m || '120px' }).observe(el);
  function lienzo(host, cls, prepend) {
    const cv = document.createElement('canvas'); cv.className = cls; cv.setAttribute('aria-hidden', 'true'); prepend === false ? host.appendChild(cv) : host.prepend(cv);
    const st = { cv, g: cv.getContext('2d'), W: 1, H: 1, d: 1 };
    const fit = () => { const r = host.getBoundingClientRect(); st.d = Math.min(2, devicePixelRatio || 1); st.W = r.width; st.H = r.height; cv.width = st.W * st.d; cv.height = st.H * st.d; if (st.onfit) st.onfit(); };
    fit(); new ResizeObserver(fit).observe(host); return st;
  }
  const img = src => { const i = new Image(); i.src = src; return i; };
  document.documentElement.classList.add('escena');

  /* =============== 1 · LA TELA: hay que romperla para entrar =============== */
  (function tela() {
    const vieja = $('#puerta'); if (vieja) vieja.remove();
    const root = document.documentElement;
    const ov = document.createElement('div'); ov.className = 'tela'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Bienvenida: rompé la tela para entrar');
    ov.innerHTML = '<canvas></canvas><p class="tela-hint">Agarrá la tela y rompela para entrar</p><button type="button" class="tela-saltar">Entrar sin romper →</button>';
    document.body.appendChild(ov);
    const cv = ov.querySelector('canvas'), g = cv.getContext('2d');
    let HK = [], VK = [], recorrido = 0;
    let W, H, d, S, cols, rows, P = [], K = [], tex = null, roto = 0, cayendo = false, fin = false, drag = null;
    const poster = img('assets/poster-oculto.webp'), logo = img('assets/marca/logo.png'), slogan = img('assets/marca/slogan-blanco.png');
    function textura() {
      const t = document.createElement('canvas'); t.width = W; t.height = H; const x = t.getContext('2d');
      x.fillStyle = C.oculto; x.fillRect(0, 0, W, H);
      if (poster.naturalWidth) { const k = Math.max(W / poster.naturalWidth, H / poster.naturalHeight); x.globalCompositeOperation = 'multiply'; x.drawImage(poster, (W - poster.naturalWidth * k) / 2, (H - poster.naturalHeight * k) / 2, poster.naturalWidth * k, poster.naturalHeight * k); x.globalCompositeOperation = 'source-over'; }
      x.fillStyle = 'rgba(0,20,70,.28)'; x.fillRect(0, 0, W, H);
      // trama de tela
      x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 1; for (let i = 0; i < W; i += 4) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); } for (let j = 0; j < H; j += 4) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }
      const lw = Math.min(W * .42, 520);
      if (logo.naturalWidth) { const lh = lw * logo.naturalHeight / logo.naturalWidth; x.drawImage(logo, (W - lw) / 2, H * .3 - lh / 2, lw, lh); }
      if (slogan.naturalWidth) { const sw = lw * .9, sh = sw * slogan.naturalHeight / slogan.naturalWidth; x.drawImage(slogan, (W - sw) / 2, H * .3 + lw * .2, sw, sh); }
      x.font = '800 ' + Math.round(Math.min(W, H) * .035) + 'px "Big Shoulders", Impact, sans-serif'; x.fillStyle = '#E19A00'; x.textAlign = 'center';
      x.fillText('9 · 10 · 11 DE ABRIL 2027 — HIPÓDROMO DE PALERMO', W / 2, H * .78);
      // costuras de borde
      x.setLineDash([14, 10]); x.strokeStyle = '#E19A00'; x.lineWidth = 3; x.strokeRect(18, 18, W - 36, H - 36); x.setLineDash([]);
      return t;
    }
    function armar() {
      d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d;
      S = Math.max(40, Math.round(Math.min(W, H) / 15)); cols = Math.ceil(W / S) + 1; rows = Math.ceil(H / S) + 1; P = []; K = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const x = i * S, y = j * S; P.push({ x, y, ox: x, oy: y, u: x / W, v: y / H, pin: j === 0 }); }
      const id = (i, j) => j * cols + i;
      HK = []; VK = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { if (i < cols - 1) { HK[id(i, j)] = K.length; K.push({ a: id(i, j), b: id(i + 1, j), on: 1 }); } if (j < rows - 1) { VK[id(i, j)] = K.length; K.push({ a: id(i, j), b: id(i, j + 1), on: 1 }); } }
      tex = textura(); roto = 0; recorrido = 0;
    }
    function quad(p0, p1, p2, u0, v0, u1, v1, u2, v2) { // triángulo texturizado (mapeo afín)
      const tw = tex.width, th = tex.height, x0 = u0 * tw, y0 = v0 * th, dx1 = u1 * tw - x0, dy1 = v1 * th - y0, dx2 = u2 * tw - x0, dy2 = v2 * th - y0;
      const det = dx1 * dy2 - dx2 * dy1; if (!det) return;
      const X1 = p1.x - p0.x, Y1 = p1.y - p0.y, X2 = p2.x - p0.x, Y2 = p2.y - p0.y;
      const ma = (X1 * dy2 - X2 * dy1) / det, mc = (X2 * dx1 - X1 * dx2) / det, mb = (Y1 * dy2 - Y2 * dy1) / det, md = (Y2 * dx1 - Y1 * dx2) / det;
      const me = p0.x - ma * x0 - mc * y0, mf = p0.y - mb * x0 - md * y0;
      const cx = (p0.x + p1.x + p2.x) / 3, cy = (p0.y + p1.y + p2.y) / 3, ex = p => [p.x + Math.sign(p.x - cx) * .8, p.y + Math.sign(p.y - cy) * .8];
      g.save(); g.beginPath(); g.moveTo(...ex(p0)); g.lineTo(...ex(p1)); g.lineTo(...ex(p2)); g.closePath(); g.clip();
      g.transform(ma, mb, mc, md, me, mf); g.drawImage(tex, 0, 0); g.restore();
    }
    function abrir() {
      if (fin) return; fin = true; ov.classList.add('fuera'); root.classList.remove('bf-cerrado'); root.classList.add('abierta');
      setTimeout(() => { ov.hidden = true; }, 900);
    }
    function soltar() { if (cayendo) return; cayendo = true; P.forEach(p => p.pin = false); ov.classList.add('cae'); setTimeout(abrir, 1300); }
    ov.querySelector('.tela-saltar').addEventListener('click', abrir);
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, pts: P.filter(p => Math.hypot(p.x - e.clientX, p.y - e.clientY) < S * 1.6) }; cv.setPointerCapture(e.pointerId); ov.classList.add('tocada'); });
    cv.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; recorrido += Math.hypot(dx, dy); drag.pts.forEach(p => { p.x += dx; p.y += dy; });
      // cortar lo que cruza el cursor rápido
      if (Math.hypot(dx, dy) > 18) K.forEach(k => { if (!k.on) return; const a = P[k.a], b = P[k.b], mxp = (a.x + b.x) / 2, myp = (a.y + b.y) / 2; if (Math.hypot(mxp - e.clientX, myp - e.clientY) < S * .7) { k.on = 0; roto++; } }); });
    const up = () => drag = null; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    if (reduce) { root.classList.remove('bf-cerrado'); ov.hidden = true; fin = true; return; }
    let listo = 0; [poster, logo, slogan].forEach(i => { const ok = () => { if (++listo === 3) { armar(); } }; i.complete && i.naturalWidth ? ok() : (i.onload = ok, i.onerror = ok); });
    addEventListener('resize', () => { if (!fin && !cayendo) armar(); });
    window.BF = window.BF || {}; BF.cerrarPuerta = () => { scrollTo({ top: 0 }); fin = false; cayendo = false; ov.hidden = false; ov.classList.remove('fuera', 'cae', 'tocada'); root.classList.add('bf-cerrado'); armar(); };
    (function f() {
      requestAnimationFrame(f); if (fin || !tex) return;
      const gr = cayendo ? 1.4 : .25;
      P.forEach(p => { if (p.pin) return; const vx = (p.x - p.ox) * .985, vy = (p.y - p.oy) * .985; p.ox = p.x; p.oy = p.y; p.x += vx; p.y += vy + gr; });
      for (let it = 0; it < 3; it++) K.forEach(k => {
        if (!k.on) return; const a = P[k.a], b = P[k.b], dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy) || 1;
        if (dd > S * 2.6) { k.on = 0; roto++; return; }
        const df = (dd - S) / dd * .5; if (!a.pin) { a.x += dx * df; a.y += dy * df; } if (!b.pin) { b.x -= dx * df; b.y -= dy * df; }
      });
      if (drag) drag.pts.forEach(p => { p.ox = p.x; p.oy = p.y; });
      if (!cayendo && !drag && (roto > K.length * .08 || recorrido > (W + H) * 2.2)) soltar();
      g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
      const on = new Uint8Array(K.length); K.forEach((k, i) => on[i] = k.on);
      // cada celda: dos triángulos si sus bordes siguen enteros
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
        const a =P[j * cols + i], b = P[j * cols + i + 1], c2 = P[(j + 1) * cols + i], e2 = P[(j + 1) * cols + i + 1];
        if (!a || !b || !c2 || !e2) continue;
        if (Math.hypot(a.x - e2.x, a.y - e2.y) > S * 3) continue;
        const n0 = j * cols + i;
        if (!K[HK[n0]].on || !K[VK[n0]].on) continue;
        quad(a, b, c2, a.u, a.v, b.u, b.v, c2.u, c2.v);
        if (K[VK[n0 + 1]].on && K[HK[n0 + cols]].on) quad(b, e2, c2, b.u, b.v, e2.u, e2.v, c2.u, c2.v);
      }
      if (cayendo && P.every(p => p.y > H + 50)) abrir();
    })();
  })();

  /* =============== 2 · el fondo de toda la página cambia al bajar =============== */
  const TONO = { inicio: ['#121112', 'osc'], 'que-es': ['#F3F3F1', 'cla'], concepto: ['#151415', 'osc'], agenda: ['#121112', 'osc'], emprendimientos: ['#121012', 'osc'], experiencias: ['#0f0e10', 'osc'], mapa: ['#121112', 'osc'], 'como-llegar': ['#F3F3F1', 'cla'], informacion: ['#171617', 'osc'], impacto: ['#111011', 'osc'], 'hecho-y-cosido': [C.giro, 'osc'], app: [C.oculto, 'osc'], entradas: ['#121112', 'osc'] };
  Object.entries(TONO).forEach(([id, t]) => { const s = document.getElementById(id); if (s) { s.dataset.tono = t[1]; s.dataset.bg = t[0]; } });
  let fondoActual = null;
  function fondo() {
    const y = innerHeight * .5; let elegido = null;
    $$('main>section[data-bg]').forEach(s => { const r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) elegido = s; });
    if (!elegido) return; const c = elegido.dataset.bgVivo || elegido.dataset.bg;
    if (c !== fondoActual) { fondoActual = c; document.body.style.setProperty('--fondo', c); document.documentElement.dataset.tono = elegido.dataset.tono; }
  }
  addEventListener('scroll', fondo, { passive: true }); setTimeout(fondo, 50);
  window.BFfondo = fondo;

  /* =============== 3 · separadores con frases de la campaña =============== */
  const FRASES = [['agenda', 'ALGO EMPIEZA A TIRAR', C.revelacion, C.tinta], ['emprendimientos', 'LO MÍNIMO TAMBIÉN TRANSFORMA', C.giro, '#fff'], ['mapa', 'TODO CONTACTO DEJA ALGO', C.pista, '#fff'], ['como-llegar', 'LO QUE NO SE VE TAMBIÉN FORMA PARTE', C.tinta, C.revelacion], ['hecho-y-cosido', 'NADA SOBRA', C.equilibrio, '#fff'], ['entradas', 'DESHACER PARA COMPRENDER', C.tinta, '#fff']];
  const bandas = [];
  FRASES.forEach(([id, w, bg, fg], i) => {
    const s = document.getElementById(id); if (!s) return;
    const b = document.createElement('div'); b.className = 'kin'; b.setAttribute('aria-hidden', 'true'); b.style.setProperty('--kc', bg); b.style.setProperty('--kf', fg); b.style.setProperty('--rot', (i % 2 ? 2 : -2) + 'deg');
    const fila = k => '<div class="kin-fila" data-dir="' + (k % 2 ? -1 : 1) + '">' + Array.from({ length: 6 }, (_, j) => '<span class="' + ((j + k) % 2 ? 'out' : '') + '">' + w + ' ✳</span>').join('') + '</div>';
    b.innerHTML = fila(0) + fila(1); s.before(b); bandas.push(b);
  });
  function moverBandas() { bandas.forEach(b => { const r = b.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) return; const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; $$('.kin-fila', b).forEach((f, i) => { f.style.transform = 'translate3d(' + (+f.dataset.dir * p * 500 - 700 + i * 160) + 'px,0,0)'; }); }); }
  if (!reduce) addEventListener('scroll', moverBandas, { passive: true }); moverBandas();

  /* =============== 4 · inicio: campo de puntos sobre el azul =============== */
  (function campo() {
    const host = $('#inicio'); if (!host) return;
    const L = lienzo(host, 'esc-puntos'); let on = true; visible(host, v => on = v);
    const M = [0, 1, 2, 3].map(i => ({ x: Math.random(), y: Math.random(), r: .12 + Math.random() * .1, c: ['#E19A00', '#C2186B', '#028EA5', '#A330B6'][i], vx: (Math.random() - .5) * .0004, vy: (Math.random() - .5) * .0004 }));
    (function f() {
      requestAnimationFrame(f); if (!on) return; const { g, W, H, d, cv } = L; g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
      const r = cv.getBoundingClientRect(), px = mx - r.left, py = my - r.top, S = 16;
      M.forEach(m => { if (!reduce) { m.x += m.vx * 16; m.y += m.vy * 16; if (m.x < 0 || m.x > 1) m.vx *= -1; if (m.y < 0 || m.y > 1) m.vy *= -1; } });
      for (let y = S / 2; y < H; y += S) for (let x = S / 2; x < W; x += S) {
        let k = 0, c = null; M.forEach(m => { const v = 1 - Math.hypot(x - m.x * W, y - m.y * H) / (m.r * Math.max(W, H)); if (v > k) { k = v; c = m.c; } });
        const cu = clamp(1 - Math.hypot(x - px, y - py) / 160, 0, 1); if (cu > k) { k = cu; c = '#E19A00'; }
        if (k <= .02) { g.fillStyle = 'rgba(255,255,255,.09)'; g.fillRect(x - 1, y - 1, 2, 2); continue; }
        g.globalAlpha = .25 + k * .6; g.fillStyle = c; g.beginPath(); g.arc(x, y, 1 + k * S * .42, 0, 7); g.fill(); g.globalAlpha = 1;
      }
    })();
  })();

  /* =============== 5 · la tensión: el título entre cuerdas tensadas (sin fotos) =============== */
  (function tension() {
    const sec = $('#que-es'), grid = $('.intro-grid', sec); if (!grid) return;
    grid.classList.add('esc-titular');
    const L = lienzo(grid, 'esc-cuerdas'); let on = false; visible(grid, v => on = v);
    const N = 34, cu = []; for (let i = 0; i < N; i++) cu.push({ a: 0, v: 0, t: i / (N - 1) });
    let lx = 0, ly = 0, tt = 0;
    (function f() {
      requestAnimationFrame(f); if (!on) return; tt += .01; const { g, W, H, d, cv } = L; g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
      const r = cv.getBoundingClientRect(), px = mx - r.left, py = my - r.top, mv = Math.hypot(px - lx, py - ly); lx = px; ly = py;
      // dos abanicos que se cruzan, como el pabellón de la bienvenida
      cu.forEach((c, i) => {
        const izq = i % 2 === 0, k = c.t;
        const x0 = izq ? 0 : W, y0 = H * k, x1 = izq ? W : 0, y1 = H * (1 - k);
        const ax = x1 - x0, ay = y1 - y0, L2 = ax * ax + ay * ay, s = clamp(((px - x0) * ax + (py - y0) * ay) / L2, 0, 1), qx = x0 + ax * s, qy = y0 + ay * s;
        if (Math.hypot(px - qx, py - qy) < 12 && mv > 2) c.v += (Math.random() < .5 ? -1 : 1) * Math.min(18, mv);
        c.v += -c.a * .16; c.v *= .94; c.a += c.v; const resp = reduce ? 0 : Math.sin(tt * 2 + i) * 1.5;
        const nl = Math.sqrt(L2), mxp = (x0 + x1) / 2 + (c.a + resp) * (-ay / nl), myp = (y0 + y1) / 2 + (c.a + resp) * (ax / nl);
        g.strokeStyle = i % 6 === 3 ? '#E19A00' : i % 6 === 0 ? '#C2186B' : 'rgba(255,255,255,.35)'; g.lineWidth = i % 3 === 0 ? 2.6 : 1.2;
        g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mxp, myp, x1, y1); g.stroke();
      });
    })();
  })();

  /* =============== 6 · calesita de subconceptos =============== */
  (function calesita() {
    const ol = $('.concept-grid'); if (!ol) return; const lis = $$('li', ol); if (lis.length !== 6) return;
    const sec = $('#concepto'); const esc = document.createElement('div'); esc.className = 'calesita';
    esc.innerHTML = '<div class="cal-techo" aria-hidden="true"></div><div class="cal-cintas" aria-hidden="true">' + Array.from({ length: 18 }, (_, i) => '<i style="--i:' + i + ';--c:' + SUBS[i % 6][1] + '"></i>').join('') + '</div><div class="cal-escena"></div><div class="cal-piso" aria-hidden="true"></div><div class="cal-mandos"><button type="button" class="cal-prev" aria-label="Subconcepto anterior">←</button><span class="cal-n">01 / 06</span><button type="button" class="cal-next" aria-label="Subconcepto siguiente">→</button></div>';
    ol.before(esc); esc.querySelector('.cal-escena').appendChild(ol);
    lis.forEach((li, i) => { li.style.setProperty('--a', (i * 60) + 'deg'); li.style.setProperty('--c', SUBS[i][1]); });
    let ang = 0, objetivo = 0, activo = -1, auto = !reduce, drag = null;
    function ir(i) { objetivo = -i * 60 + Math.round((ang + i * 60) / 360) * 360; auto = false; clearTimeout(ir.t); ir.t = setTimeout(() => auto = !reduce, 6000); }
    esc.querySelector('.cal-prev').addEventListener('click', () => ir((activo + 5) % 6));
    esc.querySelector('.cal-next').addEventListener('click', () => ir((activo + 1) % 6));
    lis.forEach((li, i) => li.addEventListener('click', () => ir(i)));
    const es = esc.querySelector('.cal-escena');
    es.addEventListener('pointerdown', e => { drag = { x: e.clientX, a: ang }; auto = false; });
    addEventListener('pointermove', e => { if (drag) { ang = drag.a + (e.clientX - drag.x) * .35; objetivo = ang; } });
    addEventListener('pointerup', () => { if (drag) { drag = null; objetivo = Math.round(ang / 60) * 60; setTimeout(() => auto = !reduce, 4000); } });
    let on = false; visible(sec, v => on = v);
    (function f() {
      requestAnimationFrame(f); if (!on) return;
      if (auto && !drag) objetivo -= .12;
      if (!drag) ang = lerp(ang, auto ? objetivo : objetivo, auto ? 1 : .08);
      ol.style.transform = 'translateZ(calc(var(--R) * -1)) rotateY(' + ang + 'deg)';
      $('.cal-cintas', esc).style.transform = 'rotateY(' + ang + 'deg)';
      const front = ((Math.round(-ang / 60) % 6) + 6) % 6;
      if (front !== activo) {
        activo = front; const b = lis[front].querySelector('.concept-select'); if (b) b.click();
        sec.style.setProperty('--cal', SUBS[front][1]);
        esc.querySelector('.cal-n').textContent = String(front + 1).padStart(2, '0') + ' / 06';
      }
    })();
  })();

  /* la rueda pasa a ser el selector de categorías */
  (function () { const r = $('#rueda'), lay = $('#emprendimientos .category-layout'); if (r && lay) lay.prepend(r); })();

  /* la rueda pasa a ser el selector de categorías */
  (function () { const r = $('#rueda'), lay = $('#emprendimientos .category-layout'); if (r && lay) lay.prepend(r); })();

  /* la clavija entra en la agenda, todo junto */
  (function () { const c = $('#clavija'), b = $('#agenda .agenda-board'); if (c && b) { c.classList.add('arriba'); b.before(c); } })();

  /* =============== 7 · los espacios 3D se entran desde el mapa =============== */
  (function () {
    const ex = $('#experiencias'); if (ex) ex.hidden = true;
    $$('a[href="#experiencias"]').forEach(a => a.remove());
  })();

  /* =============== 8 · la pista: el mapa se ilumina por capas =============== */
  (function mapa() {
    const cvs = $('.map-canvas'); if (!cvs) return; const base = $('img', cvs); base.src = 'assets/mapa/base.webp';
    const CAPAS = [['espacios', 'Los seis espacios', C.revelacion], ['naranja', 'Baños, accesibilidad, agua y comida', '#E0702B'], ['rosa', 'Reciclaje, residuos y cuidados', '#E8338A'], ['azul', 'Puestos y servicios', '#1446A0'], ['violeta', 'Salidas', '#9B3FB5']];
    const capas = CAPAS.map(([k]) => { const i = document.createElement('img'); i.src = 'assets/mapa/' + k + '.webp'; i.alt = ''; i.className = 'map-capa'; i.dataset.k = k; base.after(i); return i; });
    const bar = document.createElement('div'); bar.className = 'map-capas'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Iluminar partes del mapa');
    bar.innerHTML = '<span>Tocá para iluminar:</span>' + CAPAS.map(([k, n, c]) => '<button type="button" data-capa="' + k + '" aria-pressed="false" style="--cc:' + c + '"><i></i>' + n + '</button>').join('') + '<button type="button" data-capa="todo" aria-pressed="false" style="--cc:#fff">Todo</button>';
    $('.map-image-shell').before(bar);
    const on = new Set();
    function pintar() { capas.forEach(i => i.classList.toggle('on', on.has(i.dataset.k))); $$('button', bar).forEach(b => b.setAttribute('aria-pressed', b.dataset.capa === 'todo' ? on.size === CAPAS.length : on.has(b.dataset.capa))); cvs.classList.toggle('a-color', on.size > 0); }
    bar.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const k = b.dataset.capa; if (k === 'todo') { if (on.size === CAPAS.length) on.clear(); else CAPAS.forEach(c => on.add(c[0])); } else on.has(k) ? on.delete(k) : on.add(k); pintar(); });
    // al tocar un espacio del mapa también se iluminan los espacios
    $$('[data-zone]').forEach(b => b.addEventListener('click', () => { on.add('espacios'); pintar(); }));
    // globo sobre el punto tocado: entrar al espacio en 3D
    const globo = document.createElement('div'); globo.className = 'map-globo'; globo.hidden = true;
    globo.innerHTML = '<b></b><button type="button">Entrar al espacio en 3D ↗</button><button type="button" class="x" aria-label="Cerrar">×</button>';
    cvs.appendChild(globo);
    $$('.map-pin', cvs).forEach(p => p.addEventListener('click', () => {
      globo.hidden = false; globo.style.left = p.style.left || getComputedStyle(p).left; globo.style.top = p.style.top || getComputedStyle(p).top;
      globo.classList.toggle('abajo', p.offsetTop < cvs.clientHeight * .32);
      $('b', globo).textContent = p.getAttribute('aria-label').replace(/^\d+\s*/, '');
    }));
    globo.querySelector('button').addEventListener('click', () => { const b = $('.bf-map3d'); if (b) b.click(); });
    globo.querySelector('.x').addEventListener('click', () => globo.hidden = true);
  })();

  /* =============== 9 · transformación: paneles que se dan vuelta =============== */
  ['como-llegar', 'informacion'].forEach((id, n) => {
    const s = document.getElementById(id); if (!s) return;
    const pan = document.createElement('div'); pan.className = 'esc-paneles'; pan.setAttribute('aria-hidden', 'true');
    const CO = 8, FI = 5; let h = '';
    for (let j = 0; j < FI; j++) for (let i = 0; i < CO; i++) { const k = (i * 7 + j * 3 + n) % 9; h += '<i style="--d:' + ((i + j) * .045 + (k % 3) * .03).toFixed(2) + 's;--bp:' + (i / (CO - 1) * 100) + '% ' + (j / (FI - 1) * 100) + '%" class="' + (k === 2 ? 'foto' : k === 5 ? 'puntos' : '') + '"></i>'; }
    pan.innerHTML = h; s.appendChild(pan);
    const ps = $$('i', pan).map((el, k) => ({ el, t: ((k % CO) + Math.floor(k / CO)) / (CO + FI - 2) }));
    const girar = () => { const r = s.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const p = clamp((innerHeight * .95 - r.top) / (innerHeight * .75), 0, 1.2); ps.forEach(o => o.el.classList.toggle('vuelta', p > .1 + o.t * .85)); };
    addEventListener('scroll', girar, { passive: true }); girar();
  });

  /* =============== 10 · hecho y cosido: los personajes pasan uno a uno =============== */
  (function hecho() {
    const s = $('#hecho-y-cosido'); if (!s) return; const cards = $$('.hc-card-web', s); if (!cards.length) return;
    const lluvia = document.createElement('div'); lluvia.className = 'hc-lluvia'; lluvia.setAttribute('aria-hidden', 'true');
    const ids = ['tapita', 'tironcito', 'vueltita', 'pistin', 'justito', 'lucecita'];
    for (let k = 0; k < 22; k++) { const im = document.createElement('img'); im.src = 'assets/personajes/' + ids[k % 6] + (k % 3 ? '-sin' : '-con') + '.webp'; im.alt = ''; im.style.left = ((k * 37) % 100) + '%'; im.style.setProperty('--s', (.35 + ((k * 13) % 10) / 14).toFixed(2)); im.style.setProperty('--dur', (14 + (k % 7) * 3) + 's'); im.style.setProperty('--del', (-(k * 2.3)) + 's'); im.style.setProperty('--r', ((k % 2 ? 1 : -1) * (8 + k % 20)) + 'deg'); lluvia.appendChild(im); }
    s.prepend(lluvia);
    const grid = $('.hc-grid-web', s); grid.classList.add('hc-uno');
    const mand = document.createElement('div'); mand.className = 'hc-mandos'; mand.innerHTML = cards.map((c, i) => '<button type="button" data-i="' + i + '" aria-label="' + c.querySelector('h3').textContent + '" style="--pc:' + c.style.getPropertyValue('--pc') + '"><img src="assets/personajes/' + ids[i] + '-sin.webp" alt=""></button>').join('');
    grid.after(mand);
    const nombre = document.createElement('div'); nombre.className = 'hc-nombre'; nombre.setAttribute('aria-hidden', 'true'); grid.prepend(nombre);
    let i = 0, t = null;
    function mostrar(n) {
      i = (n + cards.length) % cards.length; cards.forEach((c, k) => c.classList.toggle('on', k === i));
      $$('button', mand).forEach((b, k) => b.classList.toggle('on', k === i));
      const c = cards[i], col = c.style.getPropertyValue('--pc'); s.dataset.bgVivo = col; fondo();
      nombre.textContent = c.querySelector('h3').textContent.toUpperCase(); nombre.style.setProperty('--pc', col);
      const f = $('.hc-foto', c); setTimeout(() => f.classList.add('vestido'), 900); f.classList.remove('vestido');
    }
    mand.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; mostrar(+b.dataset.i); clearInterval(t); t = setInterval(() => mostrar(i + 1), 4200); });
    mostrar(0); let corre = false; visible(s, v => { if (v && !corre && !reduce) { corre = true; t = setInterval(() => mostrar(i + 1), 4200); } if (!v && corre) { corre = false; clearInterval(t); } });
  })();

  /* =============== 11 · impacto: campo de frecuencias =============== */
  ['#impacto', '#que-es'].forEach(sel => (function frecuencia() {
    const s = $(sel); if (!s) return; const L = lienzo(s, 'esc-frec'); let on = false; visible(s, v => on = v);
    const PAL = [C.equilibrio, C.giro, C.revelacion, C.pista]; let seed = 3; const R = () => (seed = (seed * 9301 + 49297) % 233280) / 233280; const cel = []; let lw = 0;
    function armar() { cel.length = 0; const S = 22; for (let y = 0; y < L.H; y += S) for (let x = 0; x < L.W; x += S) { const n = Math.sin(x * .011) * Math.cos(y * .013) + Math.sin((x + y) * .006); if (n > .35 || R() < .05) cel.push({ x: x + S / 2, y: y + S / 2, t: R() < .7 ? 0 : 1, c: PAL[(n > 1 ? 0 : n > .7 ? 1 : 2)] }); } lw = L.W; }
    (function f() { requestAnimationFrame(f); if (!on) return; if (L.W !== lw) armar(); const { g, W, H, d, cv } = L; g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H); const r = cv.getBoundingClientRect(), px = mx - r.left, py = my - r.top;
      cel.forEach(c => { const dx = c.x - px, dy = c.y - py, dd = Math.hypot(dx, dy), k = clamp(1 - dd / 150, 0, 1), ox = dd ? dx / dd * k * 30 : 0, oy = dd ? dy / dd * k * 30 : 0, sz = 6 + k * 10; g.globalAlpha = .5 + k * .5; if (c.t === 0) { g.fillStyle = c.c; g.fillRect(c.x + ox - sz / 2, c.y + oy - sz / 2, sz, sz); } else { g.strokeStyle = s.id === 'que-es' ? 'rgba(20,18,20,.45)' : 'rgba(255,255,255,.5)'; g.lineWidth = 1.2; g.beginPath(); g.arc(c.x + ox, c.y + oy, sz * .55, 0, 7); g.stroke(); } }); g.globalAlpha = 1; })();
  })());

  /* inicio: el título como bloque justificado, slogan blanco */
  (function titular() {
    const h = $('.hero h1'); if (!h) return; const sp = $$('span', h).filter(x => x.parentElement === h); if (!sp.length) return;
    h.classList.add('bloque');
    const sl = $('.hero-tagline img'); if (sl) sl.src = 'assets/marca/slogan-blanco.png';
    function fit() {
      const W = Math.min(h.parentElement.clientWidth * .94, 1400);
      const fs = sp.map(x => { x.style.fontSize = '100px'; return 100 * W / (x.getBoundingClientRect().width || 1); });
      const alto = fs.reduce((a, b) => a + b * .86, 0), k = Math.min(1, innerHeight * .58 / alto);
      sp.forEach((x, i) => x.style.fontSize = (fs[i] * k) + 'px');
    }
    fit(); addEventListener('resize', fit); document.fonts && document.fonts.ready.then(fit);
  })();

  /* entradas: el afiche descosido es el fondo; al coserlo aparece el ticket */
  (function () {
    const s = $('#entradas'), sp = $('#sp'); if (!s || !sp) return;
    s.classList.add('esc-rev'); const fondo = document.createElement('div'); fondo.className = 'rev-fondo'; s.prepend(fondo); fondo.appendChild(sp);
    const marca = () => s.classList.toggle('cosido', sp.classList.contains('cosido')); marca();
    new MutationObserver(marca).observe(sp, { attributes: true, attributeFilter: ['class'] });
    // avisame cuando abre la preventa (simulado, queda en este navegador)
    const ref = s.querySelector('a.button'); const f = document.createElement('form'); f.className = 'avisame';
    f.innerHTML = '<label for="avMail">Avisame cuando abra la preventa</label><div><input id="avMail" type="email" required placeholder="tu@mail.com" autocomplete="email"><button type="submit" class="bf-btn">Avisame 🔔</button></div><p class="av-ok" hidden>Listo: te avisamos cuando abra la preventa.</p>';
    (ref || s.firstElementChild).after(f);
    let ya = false; try { ya = !!localStorage.getItem('bf-avisame'); } catch (e) {}
    const ok = () => { f.querySelector('div').hidden = true; f.querySelector('.av-ok').hidden = false; };
    if (ya) ok();
    f.addEventListener('submit', e => { e.preventDefault(); try { localStorage.setItem('bf-avisame', '1'); } catch (er) {} ok(); });
  })();

  /* footer: redes */
  (function () {
    const fb = $('.footer-bottom'); if (!fb) return; const r = document.createElement('div'); r.className = 'footer-redes';
    r.innerHTML = '<span>Seguinos</span><a href="https://www.instagram.com/hapto.bioferia" target="_blank" rel="noopener">Instagram @hapto.bioferia ↗</a><a href="https://www.tiktok.com/@hapto.bioferia" target="_blank" rel="noopener">TikTok @hapto.bioferia ↗</a><a href="https://www.facebook.com/hapto.bioferia" target="_blank" rel="noopener">Facebook @hapto.bioferia ↗</a>';
    fb.before(r);
  })();

  /* textura oscura de la presentación detrás de lo que hay que leer */
  ['inicio', 'concepto', 'agenda', 'emprendimientos', 'mapa', 'informacion', 'impacto', 'entradas'].forEach(id => { const s = document.getElementById(id); if (!s) return; const t = document.createElement('div'); t.className = 'esc-tex'; t.setAttribute('aria-hidden', 'true'); s.prepend(t); s.classList.add('con-tex'); });
})();
