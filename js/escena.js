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
  const AZ = '#003B94', MG = '#C2186B', NG = '#141214', BL = '#F4F3EF';
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
      x.font = '800 ' + Math.round(Math.min(W, H) * .035) + 'px "Big Shoulders", Impact, sans-serif'; x.fillStyle = '#fff'; x.textAlign = 'center';
      x.fillText('9 · 10 · 11 DE ABRIL 2027 — HIPÓDROMO DE PALERMO', W / 2, H * .78);
      // costuras de borde
      x.setLineDash([14, 10]); x.strokeStyle = MG; x.lineWidth = 3; x.strokeRect(18, 18, W - 36, H - 36); x.setLineDash([]);
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
  const TONO = { inicio: [BL, 'cla'], 'que-es': [BL, 'cla'], concepto: [AZ, 'osc'], agenda: [AZ, 'osc'], emprendimientos: [NG, 'osc'], experiencias: [AZ, 'osc'], mapa: ['#EEEEEE', 'cla'], 'como-llegar': [MG, 'osc'], informacion: [BL, 'cla'], impacto: [AZ, 'osc'], 'hecho-y-cosido': [NG, 'osc'], app: [AZ, 'osc'], merch: [MG, 'osc'], entradas: [BL, 'cla'] };
  Object.entries(TONO).forEach(([id, t]) => { const s = document.getElementById(id); if (s) { s.dataset.tono = t[1]; s.dataset.bg = t[0]; } });
  let fondoActual = null;
  function fondo() {
    const y = innerHeight * .5; let elegido = null;
    $$('main>section[data-bg]').forEach(s => { const r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) elegido = s; });
    if (!elegido) return; const c = elegido.dataset.bgVivo || elegido.dataset.bg;
    const t = elegido.dataset.tonoVivo || elegido.dataset.tonoBase || elegido.dataset.tono; if (!elegido.dataset.tonoBase) elegido.dataset.tonoBase = elegido.dataset.tono; elegido.dataset.tono = t;
    if (c !== fondoActual) { fondoActual = c; document.body.style.setProperty('--fondo', c); document.documentElement.dataset.tono = t; }
  }
  addEventListener('scroll', fondo, { passive: true }); setTimeout(fondo, 50);
  window.BFfondo = fondo;

  /* =============== 3 · separadores con frases de la campaña =============== */
  const FRASES = [['agenda', 'ALGO EMPIEZA A TIRAR', NG, '#fff'], ['emprendimientos', 'LO MÍNIMO TAMBIÉN TRANSFORMA', MG, '#fff'], ['mapa', 'TODO CONTACTO DEJA ALGO', AZ, '#fff'], ['como-llegar', 'LO QUE NO SE VE TAMBIÉN FORMA PARTE', NG, '#fff'], ['hecho-y-cosido', 'NADA SOBRA', MG, '#fff'], ['entradas', 'DESHACER PARA COMPRENDER', AZ, '#fff']];
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
    const M = [0, 1, 2, 3].map(i => ({ x: Math.random(), y: Math.random(), r: .12 + Math.random() * .1, c: [MG, AZ, MG, AZ][i], vx: (Math.random() - .5) * .0004, vy: (Math.random() - .5) * .0004 }));
    (function f() {
      requestAnimationFrame(f); if (!on) return; const { g, W, H, d, cv } = L; g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
      const r = cv.getBoundingClientRect(), px = mx - r.left, py = my - r.top, S = 16; const libres = $$('#inicio .hero-sub, #inicio .hero-actions').map(e => { const q = e.getBoundingClientRect(); return [q.left - r.left - 24, q.top - r.top - 18, q.right - r.left + 24, q.bottom - r.top + 18]; });
      M.forEach(m => { if (!reduce) { m.x += m.vx * 16; m.y += m.vy * 16; if (m.x < 0 || m.x > 1) m.vx *= -1; if (m.y < 0 || m.y > 1) m.vy *= -1; } });
      for (let y = S / 2; y < H; y += S) for (let x = S / 2; x < W; x += S) {
        if (libres.some(q => x > q[0] && x < q[2] && y > q[1] && y < q[3])) continue;
        let k = 0, c = null; M.forEach(m => { const v = 1 - Math.hypot(x - m.x * W, y - m.y * H) / (m.r * Math.max(W, H)); if (v > k) { k = v; c = m.c; } });
        const cu = clamp(1 - Math.hypot(x - px, y - py) / 160, 0, 1); if (cu > k) { k = cu; c = MG; }
        if (k <= .02) { g.fillStyle = 'rgba(20,18,20,.12)'; g.fillRect(x - 1, y - 1, 2, 2); continue; }
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

  /* =============== 6 · los subconceptos se acercan con la rueda del mouse =============== */
  const TXT = { [C.oculto]: 'osc', [C.tension]: 'osc', [C.giro]: 'osc', [C.pista]: 'cla', [C.equilibrio]: 'osc', [C.revelacion]: 'cla' };
  (function acerca() {
    const ol = $('.concept-grid'); if (!ol) return; const lis = $$('li', ol); if (lis.length !== 6) return;
    const sec = $('#concepto'); const w = document.createElement('div'); w.className = 'acerca';
    w.innerHTML = '<div class="ac-pin"><div class="ac-eco" aria-hidden="true"><b></b><b class="out"></b></div><p class="ac-label"><span class="ac-n">01</span><i></i><span class="ac-nom"></span></p><div class="ac-escena"></div><p class="ac-hint">Bajá para acercarte · tocá un fragmento</p><div class="ac-barra" aria-hidden="true"><i></i></div></div>';
    ol.before(w); $('.ac-escena', w).appendChild(ol);
    const POS = [[-16, -6, -4], [18, 8, 3], [-20, 10, 5], [16, -10, -3], [-8, 12, -5], [12, -2, 4]];
    const ETAPA = [[BL, 'cla'], [NG, 'osc'], [NG, 'osc'], [NG, 'osc'], [MG, 'osc'], [NG, 'osc']];
    lis.forEach((li, i) => { const cla = ETAPA[i][1] === 'cla'; li.style.setProperty('--c', cla ? NG : '#fff'); li.style.setProperty('--tx', cla ? '#fff' : NG); li.style.setProperty('--ac', cla ? MG : ETAPA[i][0] === NG ? MG : ETAPA[i][0]); });
    // la pantalla cambia con cada subconcepto: una trama distinta que reacciona al mouse
    const pin = $('.ac-pin', w), PT = lienzo(pin, 'ac-patron'); let enVista = false; visible(w, v => enVista = v);
    const huella = []; let t0 = 0;
    // fondos animados de cada subconcepto (inspirados en las referencias), en azul, magenta, blanco y negro
    let vx0 = 0, vy0 = 0, prevP = 0, ang = 0;
    const rnd = (a, b) => a + Math.random() * (b - a);
    // 0 · lo oculto: papel arrugado que cambia
    const papeles = [];
    function papel(Wp, Hp) {
      const c = document.createElement('canvas'); c.width = Wp; c.height = Hp; const x = c.getContext('2d');
      x.fillStyle = '#f2f2f0'; x.fillRect(0, 0, Wp, Hp);
      const P = []; const S = 46; for (let j = -1; j <= Hp / S + 1; j++) for (let i = -1; i <= Wp / S + 1; i++) P.push([i * S + rnd(-S * .45, S * .45), j * S + rnd(-S * .45, S * .45)]);
      const cols = Math.ceil(Wp / S) + 3;
      for (let k = 0; k < P.length - cols - 1; k++) { if ((k + 1) % cols === 0) continue; const a = P[k], b = P[k + 1], c2 = P[k + cols], d2 = P[k + cols + 1];
        [[a, b, c2], [b, d2, c2]].forEach(t => { const l = 225 + Math.floor(rnd(-22, 28)); x.fillStyle = 'rgb(' + l + ',' + l + ',' + Math.min(255, l + 3) + ')'; x.beginPath(); x.moveTo(...t[0]); x.lineTo(...t[1]); x.lineTo(...t[2]); x.closePath(); x.fill(); }); }
      x.globalAlpha = .18; for (let k = 0; k < 0; k++) { x.strokeStyle = Math.random() < .5 ? '#fff' : '#b8b8bc'; x.lineWidth = rnd(.5, 2); x.beginPath(); const sx = rnd(0, Wp), sy = rnd(0, Hp); x.moveTo(sx, sy); x.lineTo(sx + rnd(-160, 160), sy + rnd(-90, 90)); x.stroke(); }
      x.globalAlpha = 1; x.filter = 'blur(2.5px)'; x.drawImage(c, 0, 0); x.filter = 'none'; return c;
    }
    // 1 · la tensión: agujas que salen del centro
    const AG = Array.from({ length: 140 }, () => ({ a: rnd(0, 7), z: rnd(0, 1), w: rnd(.006, .02), v: rnd(.6, 1.4) }));
    // 2 · el giro: nube de puntos (cubo ↔ túnel) que gira
    const CUBO = []; for (let k = 0; k < 1600; k++) { const f = k % 6, u = rnd(-1, 1), v = rnd(-1, 1); CUBO.push(f === 0 ? [1, u, v] : f === 1 ? [-1, u, v] : f === 2 ? [u, 1, v] : f === 3 ? [u, -1, v] : f === 4 ? [u, v, 1] : [u, v, -1]); }
    const TUN = CUBO.map((_, k) => { const a = k / 1600 * Math.PI * 2 * 40, z = (k / 1600) * 2 - 1; return [Math.cos(a) * 1.1, Math.sin(a) * 1.1, z * 3]; });
    // 4 · el equilibrio: rayos de guiones
    const RAY = 24;
    // 5 · la revelación: vidrio acanalado sobre degradé
    const vid = document.createElement('canvas'), vg = vid.getContext('2d');
    (function dib() {
      requestAnimationFrame(dib); if (!enVista || activo < 0) return; t0 += .016;
      const { g, W, H, d, cv } = PT, r = cv.getBoundingClientRect(), et = activo;
      const r2 = w.getBoundingClientRect(), pr = clamp(-r2.top / (r2.height - innerHeight), 0, 1), pv = pr * (N - 1), vel = clamp(Math.abs(pv - prevP) * 60, 0, 6); prevP = pv;
      const mxr = mx > -1000 ? (mx - r.left) / W - .5 : 0, myr = my > -1000 ? (my - r.top) / H - .5 : 0;
      vx0 = lerp(vx0, W / 2 - mxr * W * .3, .06); vy0 = lerp(vy0, H / 2 - myr * H * .3, .06);
      $('.ac-escena', w).style.transform = 'rotateY(' + (mxr * 10).toFixed(2) + 'deg) rotateX(' + (-myr * 8).toFixed(2) + 'deg)';
      g.setTransform(d, 0, 0, d, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      const D = Math.max(W, H), vrap = 1 + vel * 1.5;

      if (et === 0) { // papel arrugado que se reacomoda
        if (papeles.length < 4 || papeles[0].width !== Math.ceil(W)) { papeles.length = 0; for (let k = 0; k < 4; k++) papeles.push(papel(Math.ceil(W), Math.ceil(H))); }
        const fase = t0 * 2.2 * vrap, i = Math.floor(fase) % 4, f = fase % 1;
        const z = 1.04 + Math.sin(t0 * .7) * .03, ox = mxr * -30, oy = myr * -30;
        g.save(); g.translate(W / 2 + ox, H / 2 + oy); g.scale(z, z); g.translate(-W / 2, -H / 2);
        g.drawImage(papeles[i], 0, 0); g.globalAlpha = f < .7 ? 0 : (f - .7) / .3; g.drawImage(papeles[(i + 1) % 4], 0, 0); g.restore(); g.globalAlpha = 1;
        g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(0,59,148,.85)'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
      }
      else if (et === 1) { // la tensión: planos de luz y líneas en perspectiva (glow magenta sobre negro)
        g.fillStyle = '#050405'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
        const fx = vx0, fy = vy0, ph = t0 * .35 * vrap, sal = Math.floor(t0 * 1.3 * vrap);
        const cx = W * (.5 + Math.sin(sal * 2.1) * .25), cy = H * (.5 + Math.cos(sal * 1.7) * .2);
        const gl = g.createRadialGradient(cx, cy, 0, cx, cy, D * .35); gl.addColorStop(0, 'rgba(240,200,250,.55)'); gl.addColorStop(.25, 'rgba(163,48,182,.32)'); gl.addColorStop(1, 'rgba(163,48,182,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
        for (let k = 0; k < 7; k++) { const x = W * (((k * .37 + ph * .2) % 1)), wv = 1 + (k % 3) * 1.5; g.fillStyle = 'rgba(215,150,235,' + (.12 + (k % 2) * .18) + ')'; g.fillRect(x, 0, wv, H); }
        for (let k = 0; k < 5; k++) { const y = H * (((k * .29 + ph * .13) % 1)); g.fillStyle = 'rgba(215,150,235,' + (.1 + (k % 2) * .14) + ')'; g.fillRect(0, y, W, 1 + (k % 2) * 2); }
        g.lineWidth = 1; for (let k = 0; k < 26; k++) { const a = k / 26 * Math.PI * 2 + ph * .3; g.strokeStyle = 'rgba(190,100,220,' + (.08 + (k % 4 === 0) * .25) + ')'; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(a) * D, fy + Math.sin(a) * D); g.stroke(); }
        // planos tensados: trapecios que se estiran hacia el punto de fuga
        for (let k = 0; k < 3; k++) { const z = ((t0 * .25 * vrap + k / 3) % 1), sz = D * (.08 + z * z * .9), o = (1 - Math.abs(z - .5) * 2) * .35;
          const x0 = fx - sz * (k === 1 ? .2 : 1), y0 = fy + (k === 2 ? -sz * .6 : sz * .3);
          const gp = g.createLinearGradient(x0, y0, x0 + sz, y0); gp.addColorStop(0, 'rgba(163,48,182,0)'); gp.addColorStop(.5, 'rgba(225,180,245,' + o + ')'); gp.addColorStop(1, 'rgba(163,48,182,0)'); g.fillStyle = gp;
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + sz, y0); g.lineTo(x0 + sz * 1.4, y0 + sz * .25); g.lineTo(x0 - sz * .4, y0 + sz * .25); g.closePath(); g.fill(); }
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = .12; for (let k = 0; k < 900; k++) { g.fillStyle = Math.random() < .5 ? '#fff' : '#A330B6'; g.fillRect(Math.random() * W, Math.random() * H, 1, 1); } g.globalAlpha = 1;
        if ((t0 * 60 | 0) % 47 < 3) { g.fillStyle = 'rgba(225,180,245,.1)'; for (let k = 0; k < 30; k++) g.fillRect(0, Math.random() * H, W, 1 + Math.random() * 3); }
      }
      else if (et === 2) { // el giro: anillos concéntricos que rotan y se deforman (blanco y azul sobre negro)
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H); ang += .01 * vrap + vel * .03;
        const R = Math.min(W, H) * .46, def = (Math.sin(t0 * .6) + 1) / 2;
        g.save(); g.translate(vx0, vy0); g.globalCompositeOperation = 'lighter';
        for (let k = 1; k < 46; k++) { const r0 = k / 46 * R; g.lineWidth = 1 + (k % 5 === 0) * 1.2;
          g.strokeStyle = k % 7 === 0 ? 'rgba(232,130,70,.9)' : (k % 2 ? 'rgba(193,95,43,' : 'rgba(255,235,220,') + (.22 + (k % 3 === 0) * .35) + ')';
          g.beginPath(); for (let a = 0; a <= Math.PI * 2 + .05; a += .05) { const tw = Math.sin(a * 2 + ang * 2) * def * r0 * .28 * (k / 46), rr = r0 + tw + Math.sin(a * 6 + t0 * 2 + k) * 1.5, aa = a + ang * (1 + k * .02) + def * Math.sin(r0 * .02 + t0) * .8;
            const x = Math.cos(aa) * rr, y = Math.sin(aa) * rr * (1 - def * .25); a === 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
          g.stroke(); }
        // brillo que barre
        const sw = g.createConicGradient ? g.createConicGradient(ang * 3, 0, 0) : null; if (sw) { sw.addColorStop(0, 'rgba(255,255,255,.22)'); sw.addColorStop(.08, 'rgba(255,255,255,0)'); sw.addColorStop(.5, 'rgba(193,95,43,0)'); sw.addColorStop(.58, 'rgba(232,130,70,.25)'); sw.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sw; g.beginPath(); g.arc(0, 0, R * 1.2, 0, 7); g.fill(); }
        g.restore(); g.globalCompositeOperation = 'source-over';
        const vg = g.createRadialGradient(W / 2, H / 2, R * .6, W / 2, H / 2, D * .7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.85)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
      }
      else if (et === 3) { // la pista: trama de puntos (halftone) sobre formas que se mueven, como una huella
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        const S = W < 700 ? 9 : 11, bl = [[.3 + Math.sin(t0 * .4) * .25, .4 + Math.cos(t0 * .33) * .2, .32], [.7 + Math.cos(t0 * .27) * .2, .6 + Math.sin(t0 * .45) * .25, .28], [.5 + mxr * .8, .5 + myr * .8, .2]];
        for (let y = S / 2; y < H; y += S) for (let x = S / 2; x < W; x += S) { const u = x / W, v = y / H;
          let k = 0; bl.forEach((b, j) => { const dd = Math.hypot((u - b[0]) * (W / H), v - b[1]); k += Math.max(0, 1 - dd / b[2]) * (j === 2 ? 1.2 : 1); });
          k += Math.sin(u * 7 + t0) * Math.cos(v * 5 - t0 * .8) * .25; k = clamp(k, 0, 1); if (k < .05) continue;
          const rr = k * S * .52; g.fillStyle = k > .8 && (x / S | 0) % 2 === 0 ? '#ffffff' : '#11B3CC'; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
      }
      else if (et === 4) { // rayos de guiones que laten (sobre azul)
        g.fillStyle = '#C2186B'; g.fillRect(0, 0, W, H); g.lineCap = 'round';
        const pul = (t0 * .9 * vrap) % 1;
        for (let k = 0; k < RAY; k++) { const a = k / RAY * Math.PI * 2 + Math.sin(t0 * .5) * .15;
          for (let s = 0; s < 16; s++) { const rr = Math.pow((s + pul) / 16, 1.6) * D * .75; if (rr < 8) continue; const zig = (s % 4 === 3) ? .05 : 0, len = 4 + rr * .035, aa = a + zig;
            const x0 = vx0 + Math.cos(aa) * rr, y0 = vy0 + Math.sin(aa) * rr; g.strokeStyle = s % 5 === 2 ? '#141214' : '#fff'; g.lineWidth = 1.5 + rr / D * 4; g.globalAlpha = clamp(rr / 120, .2, 1);
            g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + Math.cos(aa) * len, y0 + Math.sin(aa) * len); g.stroke(); } }
        g.globalAlpha = 1;
      }
      else { // la revelación: tiras de película que se iluminan cuadro por cuadro (colores, sin fotos)
        g.fillStyle = '#0d0d0c'; g.fillRect(0, 0, W, H);
        const tiras = Math.max(3, Math.round(W / 150)), tw = W / tiras, fh = tw * 1.05, PAL2 = ['#E19A00', '#FFC94A', '#F4F3EF', '#B36B00', '#FFB020', '#5a3a00'];
        const prog = (t0 * .35 * vrap) % 1.4;
        for (let i = 0; i < tiras; i++) { const x = i * tw, desp = ((t0 * (i % 2 ? 18 : -14) * vrap) % fh + fh) % fh;
          g.fillStyle = '#151513'; g.fillRect(x + 3, 0, tw - 6, H);
          g.fillStyle = '#2a2a26'; for (let y = -fh + desp; y < H; y += 18) { g.fillRect(x + 7, y, 6, 9); g.fillRect(x + tw - 13, y, 6, 9); }
          g.fillStyle = 'rgba(225,120,40,.5)'; g.font = '700 9px monospace'; g.save(); g.translate(x + tw - 18, H * .8); g.rotate(-Math.PI / 2); g.fillText('BF 27  ' + (i + 1) + 'A', 0, 0); g.restore();
          for (let y = -fh + desp, n = 0; y < H + fh; y += fh, n++) { const fx = x + 18, fw = tw - 36, fy = y + 6, fhh = fh - 12;
            const sem = (i * 7 + n * 13) % 11, on = sem / 11 < prog - .15 && (sem + i) % 3 !== 0;
            if (!on) { g.fillStyle = '#0a0a09'; g.fillRect(fx, fy, fw, fhh); continue; }
            const c1 = PAL2[(i + n) % PAL2.length], c2 = PAL2[(i + n * 2 + 1) % PAL2.length];
            const gr = g.createLinearGradient(fx, fy, fx + fw, fy + fhh); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(fx, fy, fw, fhh);
            g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(fx, fy, fw, fhh * .35); } }
        const lg = g.createRadialGradient(vx0, vy0, 0, vx0, vy0, D * .5); lg.addColorStop(0, 'rgba(255,255,255,.12)'); lg.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
      }
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    })();
    const N = lis.length; w.style.height = (N * 85 + 100) + 'vh';
    let activo = -1;
    lis.forEach((li, i) => li.addEventListener('click', e => { if (e.target.closest('a,button')) return; const r = w.getBoundingClientRect(), tot = r.height - innerHeight; scrollTo({ top: scrollY + r.top + tot * (i / (N - 1)) + 2, behavior: 'smooth' }); }));
    function paso() {
      const r = w.getBoundingClientRect(), tot = r.height - innerHeight; if (r.bottom < -100 || r.top > innerHeight + 100) return;
      const pr = clamp(-r.top / tot, 0, 1), p0 = pr * (N - 1), fr = p0 % 1, p = Math.floor(p0) + (fr < .5 ? 4 * fr * fr * fr : 1 - Math.pow(-2 * fr + 2, 3) / 2);
      $('.ac-barra i', w).style.transform = 'scaleX(' + pr.toFixed(3) + ')';
      lis.forEach((li, i) => {
        const dz = i - p, k = innerWidth < 700 ? .2 : 1, cerca = clamp(dz, 0, 1);
        const x = POS[i][0] * k * cerca, y = POS[i][1] * (innerWidth < 700 ? .6 : 1) * cerca, rz = POS[i][2] * cerca;
        const z = dz >= 0 ? -dz * 1400 : -dz * 1700;
        const op = dz >= 0 ? clamp(1 - (dz - 1) * .35, 0, 1) : clamp(1 - (z - 700) / 350, 0, 1);
        li.style.setProperty('--t', 'translate(-50%,-50%) translate3d(' + x.toFixed(2) + 'vw,' + y.toFixed(2) + 'vh,' + z.toFixed(0) + 'px) rotateZ(' + rz.toFixed(2) + 'deg)');
        li.style.setProperty('--o', op.toFixed(3)); li.style.opacity = op.toFixed(3); li.style.zIndex = 100 - Math.round(dz * 10); li.style.visibility = op < .01 ? 'hidden' : 'visible'; li.style.pointerEvents = Math.abs(dz) < .4 ? 'auto' : 'none';
        li.classList.toggle('frente', Math.abs(dz) < .4);
      });
      const eco = $('.ac-eco', w); eco.style.transform = 'translate3d(' + (-pr * 60) + 'vw,0,0) rotateX(' + ((pr * N % 1) - .5) * 16 + 'deg)';
      const f = clamp(Math.round(p), 0, N - 1);
      if (f !== activo) {
        activo = f; const b = lis[f].querySelector('.concept-select'); if (b) b.click();
        const nom = lis[f].querySelector('h3').textContent.trim();
        sec.dataset.bgVivo = ETAPA[f][0]; sec.dataset.tonoVivo = ETAPA[f][1]; fondo();
        $('.ac-n', w).textContent = String(f + 1).padStart(2, '0'); $('.ac-nom', w).textContent = nom.toUpperCase();
        $$('.ac-eco b', w).forEach(b => b.textContent = (nom.toUpperCase() + ' · ').repeat(4));
      }
    }
    addEventListener('scroll', paso, { passive: true }); addEventListener('resize', paso); paso();
  })();

  /* la rueda pasa a ser el selector de categorías */
  (function () { const r = $('#rueda'), lay = $('#emprendimientos .category-layout'); if (r && lay) lay.prepend(r); })();

  /* la rueda pasa a ser el selector de categorías */
  (function () { const r = $('#rueda'), lay = $('#emprendimientos .category-layout'); if (r && lay) lay.prepend(r); })();

  /* la clavija entra en la agenda, todo junto */
  (function () { const c = $('#clavija'), b = $('#agenda .agenda-board'); if (c && b) { c.classList.add('arriba'); b.before(c); } })();

  /* =============== 7 · los espacios 3D se entran desde el mapa =============== */
  (function () {
    const ex = $('#experiencias'); if (ex) ex.hidden = true; const ap = $('#app'); if (ap) ap.hidden = true; $$('a[href="#app"], a[href*="app/"]').forEach(a => { if (a.closest('#hecho-y-cosido')) a.remove(); });
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

  /* =============== 10 · hecho y cosido: los personajes pasan uno a uno =============== */
  (function hecho() {
    const s = $('#hecho-y-cosido'); if (!s) return; const cards = $$('.hc-card-web', s); if (!cards.length) return;
    const ids = ['tapita', 'tironcito', 'vueltita', 'pistin', 'justito', 'lucecita'];
    cards.forEach((c, k) => { const f = $('.hc-foto', c); if (!f) return; const nom = c.querySelector('h3').textContent; f.innerHTML = '<img class="fig" src="assets/figuritas/' + ids[k] + '.webp" alt="' + nom + ', figura impresa en 3D">'; });
    const grid = $('.hc-grid-web', s); grid.classList.add('hc-uno');
    const mand = document.createElement('div'); mand.className = 'hc-mandos'; mand.innerHTML = cards.map((c, i) => '<button type="button" data-i="' + i + '" aria-label="' + c.querySelector('h3').textContent + '" style="--pc:' + c.style.getPropertyValue('--pc') + '"><img src="assets/figuritas/' + ids[i] + '.webp" alt=""></button>').join('');
    grid.after(mand);
    const nombre = document.createElement('div'); nombre.className = 'hc-nombre'; nombre.setAttribute('aria-hidden', 'true'); grid.prepend(nombre);
    let i = 0, t = null;
    function mostrar(n) {
      i = (n + cards.length) % cards.length; cards.forEach((c, k) => c.classList.toggle('on', k === i));
      $$('button', mand).forEach((b, k) => b.classList.toggle('on', k === i));
      const c = cards[i], col = c.style.getPropertyValue('--pc').trim(); 
      nombre.textContent = c.querySelector('h3').textContent.toUpperCase(); nombre.style.setProperty('--pc', col);
      
    }
    mand.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; mostrar(+b.dataset.i); clearInterval(t); t = setInterval(() => mostrar(i + 1), 4200); });
    mostrar(0); let corre = false; visible(s, v => { if (v && !corre && !reduce) { corre = true; t = setInterval(() => mostrar(i + 1), 4200); } if (!v && corre) { corre = false; clearInterval(t); } });
  })();

  /* =============== 11 · impacto: campo de frecuencias =============== */
  ['#impacto', '#que-es', '#agenda', '#informacion', '#merch'].forEach(sel => (function frecuencia() {
    const s = $(sel); if (!s) return; const L = lienzo(s, 'esc-frec'); let on = false; visible(s, v => on = v);
    const bg = s.dataset.bg, PAL = [MG, AZ, NG, '#fff'].filter(c => c !== bg && !(bg === BL && c === '#fff')).concat(bg === BL ? [MG] : []).slice(0, 3); let seed = 3 + sel.length; const R = () => (seed = (seed * 9301 + 49297) % 233280) / 233280; const cel = []; let lw = 0;
    function armar() { cel.length = 0; const S = 22; for (let y = 0; y < L.H; y += S) for (let x = 0; x < L.W; x += S) { const n = Math.sin(x * .011) * Math.cos(y * .013) + Math.sin((x + y) * .006); if (n > .35 || R() < .05) cel.push({ x: x + S / 2, y: y + S / 2, t: R() < .7 ? 0 : 1, c: PAL[(n > 1 ? 0 : n > .7 ? 1 : 2)] }); } lw = L.W; }
    (function f() { requestAnimationFrame(f); if (!on) return; if (L.W !== lw) armar(); const { g, W, H, d, cv } = L; g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H); const r = cv.getBoundingClientRect(), px = mx - r.left, py = my - r.top;
      cel.forEach(c => { const dx = c.x - px, dy = c.y - py, dd = Math.hypot(dx, dy), k = clamp(1 - dd / 150, 0, 1), ox = dd ? dx / dd * k * 30 : 0, oy = dd ? dy / dd * k * 30 : 0, sz = 6 + k * 10; g.globalAlpha = .5 + k * .5; if (c.t === 0) { g.fillStyle = c.c; g.fillRect(c.x + ox - sz / 2, c.y + oy - sz / 2, sz, sz); } else { g.strokeStyle = s.dataset.tono === 'cla' ? 'rgba(20,18,20,.45)' : 'rgba(255,255,255,.6)'; g.lineWidth = 1.2; g.beginPath(); g.arc(c.x + ox, c.y + oy, sz * .55, 0, 7); g.stroke(); } }); g.globalAlpha = 1; })();
  })());

  /* inicio: el título como bloque justificado, slogan blanco */
  (function titular() {
    const h = $('.hero h1'); if (!h) return; const sp = $$('span', h).filter(x => x.parentElement === h); if (!sp.length) return;
    h.classList.add('bloque');
    const sl = $('.hero-tagline img'); if (sl) sl.src = 'assets/marca/slogan.png';
    function fit() {
      const W = Math.min(h.parentElement.clientWidth * .94, 1400);
      const fs = sp.map(x => { x.style.fontSize = '100px'; return 100 * W / (x.getBoundingClientRect().width || 1); });
      const alto = fs.reduce((a, b) => a + b * .86, 0), k = Math.min(1, innerHeight * .58 / alto);
      sp.forEach((x, i) => x.style.fontSize = (fs[i] * k) + 'px');
    }
    fit(); addEventListener('resize', fit); document.fonts && document.fonts.ready.then(fit);
  })();

  /* entradas: sin juego; el ticket ya está, con el talón para cortar */
  (function () {
    const s = $('#entradas'); if (!s) return; s.classList.add('sin-juego');
    const sp = $('#sp'), solve = $('#spSolve'), ent = $('#entrada');
    if (ent && ent.classList.contains('locked') && solve) { solve.click(); const t = $('#wtoast'); if (t) { t.className = 'wtoast'; t.textContent = ''; } }
    const hint = $('#eHint'); if (hint && !$('#eMsg').hidden === false) hint.textContent = 'Arrastrá el talón (o tocalo) para cortarlo por el troquel.';
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

  /* =============== 13 · las palabras llegan desde el fondo al bajar =============== */
  (function palabras() {
    const hs = $$('main>section:not(#inicio) h2').filter(h => !h.closest('.acerca'));
    function envolver(n) { [...n.childNodes].forEach(c => { if (c.nodeType === 3) { const fr = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(t => { if (!t) return; if (/^\s+$/.test(t)) fr.appendChild(document.createTextNode(t)); else { const sp = document.createElement('span'); sp.className = 'pal'; sp.textContent = t; fr.appendChild(sp); } }); c.replaceWith(fr); } else if (c.nodeType === 1 && !c.classList.contains('pal')) envolver(c); }); }
    hs.forEach(h => { envolver(h); h.classList.add('pal3d'); h._p = $$('.pal', h); });
    function mover() { if (reduce) return; hs.forEach(h => { const r = h.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) return; const t = clamp((innerHeight * .95 - r.top) / (innerHeight * .55), 0, 1); h._p.forEach((p, k) => { const l = clamp(t * 1.5 - k * .1, 0, 1), e = 1 - Math.pow(1 - l, 3); p.style.transform = 'translate3d(0,' + ((1 - e) * 40).toFixed(1) + 'px,' + ((1 - e) * -700).toFixed(0) + 'px) rotateX(' + ((1 - e) * 75).toFixed(1) + 'deg)'; p.style.opacity = (.15 + e * .85).toFixed(2); }); }); }
    addEventListener('scroll', mover, { passive: true }); mover();
  })();
  /* =============== 14 · merch y carrito =============== */
  (function tienda() {
    const lista = $('#merchLista'), carro = $('#carro'), btn = $('.carro-btn'); if (!lista || !carro) return;
    const P = [['taza', 'Taza Bioferia', 'taza', 9500], ['senaladores', 'Señaladores con visor', 'senaladores', 3500], ['cuaderno', 'Cuaderno 2027', 'cuaderno', 8500], ['abanico', 'Abanico Ni muy muy, ni tan tan', 'abanico', 6000], ['kit-hilo', 'Kit Un hilo, muchas conexiones', 'kit-hilo', 7000], ['yoyo', 'Yoyó Mirar de otro lugar', 'yoyo', 6500]];
    const $$P = Object.fromEntries(P.map(x => [x[0], x])), plata = n => '$' + n.toLocaleString('es-AR');
    lista.innerHTML = P.map(([id, n, img, pr], i) => '<li style="--r:' + ((i % 3) - 1) * 2.5 + 'deg"><div class="mp-foto"><img src="assets/merch2/' + img + '.jpg" alt="' + n + '" loading="lazy"></div><h3>' + n + '</h3><p>' + plata(pr) + '</p><button type="button" data-add="' + id + '">+ Sumar al carrito</button></li>').join('');
    let c = {}; try { c = JSON.parse(localStorage.getItem('bf-carrito2') || '{}'); } catch (e) {}
    const guardar = () => { try { localStorage.setItem('bf-carrito2', JSON.stringify(c)); } catch (e) {} };
    function pintar() {
      const ks = Object.keys(c).filter(k => c[k] > 0 && $$P[k]); let tot = 0, n = 0;
      $('.carro-items', carro).innerHTML = ks.map(k => { const [, nom, img, pr] = $$P[k]; tot += pr * c[k]; n += c[k]; return '<li><img src="assets/merch2/' + img + '.jpg" alt=""><div><b>' + nom + '</b><span>' + plata(pr) + '</span></div><div class="cq"><button type="button" data-menos="' + k + '" aria-label="Quitar uno">−</button><span>' + c[k] + '</span><button type="button" data-mas="' + k + '" aria-label="Sumar uno">+</button></div></li>'; }).join('');
      $('.carro-vacio', carro).hidden = ks.length > 0; $('.carro-pie', carro).hidden = !ks.length;
      $('.carro-total b', carro).textContent = plata(tot); $('.carro-n', btn).textContent = n; btn.classList.toggle('lleno', n > 0);
    }
    function abrir(v) { carro.hidden = !v; carro.classList.toggle('on', v); btn.setAttribute('aria-expanded', v); }
    lista.addEventListener('click', e => { const b = e.target.closest('[data-add]'); if (!b) return; const k = b.dataset.add; c[k] = (c[k] || 0) + 1; guardar(); pintar(); btn.classList.remove('salta'); void btn.offsetWidth; btn.classList.add('salta'); b.textContent = '✓ Sumado'; setTimeout(() => b.textContent = '+ Sumar al carrito', 1200); $('.carro-ok', carro).hidden = true; });
    carro.addEventListener('click', e => { const m = e.target.closest('[data-mas],[data-menos]'); if (m) { const k = m.dataset.mas || m.dataset.menos; c[k] = Math.max(0, (c[k] || 0) + (m.dataset.mas ? 1 : -1)); guardar(); pintar(); } });
    btn.addEventListener('click', () => abrir(carro.hidden)); $('.carro-cerrar', carro).addEventListener('click', () => abrir(false));
    addEventListener('keydown', e => { if (e.key === 'Escape' && !carro.hidden) abrir(false); });
    $('.carro-pagar', carro).addEventListener('click', () => { c = {}; guardar(); pintar(); $('.carro-pie', carro).hidden = false; $('.carro-ok', carro).hidden = false; $('.carro-total', carro).hidden = true; $('.carro-pagar', carro).hidden = true; setTimeout(() => { $('.carro-total', carro).hidden = false; $('.carro-pagar', carro).hidden = false; }, 4000); });
    pintar();
    // los productos se inclinan con el mouse
    if (fino && !reduce) lista.addEventListener('pointermove', e => { const li = e.target.closest('li'); if (!li) return; const r = li.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; li.style.transform = 'perspective(700px) rotateY(' + (x * 18) + 'deg) rotateX(' + (-y * 18) + 'deg) translateZ(20px)'; });
    lista.addEventListener('pointerout', e => { const li = e.target.closest('li'); if (li && !li.contains(e.relatedTarget)) li.style.transform = ''; });
  })();
  /* nav: se esconde al bajar, vuelve al subir */
  (function () { const h = $('.site-header'); if (!h) return; let y0 = scrollY; addEventListener('scroll', () => { const y = scrollY; if (Math.abs(y - y0) < 6) return; h.classList.toggle('oculto', y > y0 && y > 200 && !document.body.classList.contains('menu-open')); y0 = y; }, { passive: true }); })();
  /* =============== 15 · agenda compacta: día + franja horaria =============== */
  (function agendaCorta() {
    const cl = $('#clavija'); if (cl) cl.hidden = true;
    const board = $('#agenda .agenda-board'); if (!board) return;
    const arts = $$('#agenda .agenda-list article'), info = Object.fromEntries(arts.map(a => [a.dataset.type, [a.querySelector('h4').textContent, a.querySelector('p').textContent]]));
    const HOR = ['11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00'];
    const PROG = { 9: ['actividades', 'charlas', 'talleres', 'charlas', 'actividades', 'talleres', 'actividades'], 10: ['talleres', 'charlas', 'actividades', 'talleres', 'charlas', 'actividades', 'actividades'], 11: ['charlas', 'talleres', 'charlas', 'actividades', 'talleres', 'charlas', 'actividades'] };
    const ESC = ['Anfiteatro', 'Charlas y streaming', 'Calesita', 'Bienvenida', 'Expositores'];
    const tira = document.createElement('div'); tira.className = 'ag-tira'; tira.setAttribute('aria-live', 'polite');
    const nota = document.createElement('p'); nota.className = 'ag-nota'; nota.textContent = 'Franja de ejemplo: los horarios y protagonistas se confirman más cerca del festival.';
    $('#agenda .agenda-filters').after(tira); tira.after(nota);
    function pintar() {
      const dia = ($('#agenda .agenda-days button.active') || {}).dataset?.day || '9', f = ($('#agenda .agenda-filters .active') || {}).dataset?.filter || 'todas';
      tira.innerHTML = HOR.map((h, i) => { const t = PROG[dia][i], [tit, desc] = info[t] || [t, '']; const on = f === 'todas' || f === t;
        return '<button type="button" class="ag-slot' + (on ? '' : ' apagado') + '" data-t="' + t + '"><time>' + h + '</time><span class="ag-tipo">' + t.toUpperCase() + '</span><b>' + tit + '</b><small>' + ESC[(i + +dia) % ESC.length] + '</small><p>' + desc + '</p></button>'; }).join('');
    }
    tira.addEventListener('click', e => { const b = e.target.closest('.ag-slot'); if (!b) return; $$('.ag-slot', tira).forEach(x => x.classList.toggle('abierto', x === b && !x.classList.contains('abierto'))); });
    const mo = new MutationObserver(pintar); ['.agenda-days', '.agenda-filters'].forEach(q => { const el = $('#agenda ' + q); if (el) mo.observe(el, { subtree: true, attributes: true, attributeFilter: ['class'] }); }); pintar();
  })();
})();
