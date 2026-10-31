/* Bioferia app · piel de poster.
   Lleva el lenguaje gráfico de cada subconcepto a la app sin cambiar sus textos:
   portada collage generada por sección, títulos que caen como letras pegadas, cinta corrida,
   hilo que sigue al dedo, transición de papel rasgado y parallax. */
(function () {
  const doc = document, shell = doc.querySelector('.app-shell'), content = doc.querySelector('#app-content');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  shell.classList.add('poster');

  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const K = { azul: '#003B94', violeta: '#A330B6', oxido: '#C15F2B', petroleo: '#287C8B', vino: '#861064', magenta: '#D81987', ambar: '#E9A900', tinta: '#1F1C1E', papel: '#F7F5F0' };
  const THEMES = {
    home: { n: '01', name: 'Lo oculto', bg: K.azul, acc: K.ambar, ink: '#fff' },
    profile: { n: '02', name: 'La tensión', bg: K.violeta, acc: K.ambar, ink: '#fff' },
    giro: { n: '03', name: 'El giro', bg: '#161616', acc: K.oxido, ink: '#fff' },
    guide: { n: '04', name: 'La pista', bg: K.petroleo, acc: K.magenta, ink: '#fff' },
    wallet: { n: '05', name: 'El equilibrio', bg: K.vino, acc: '#3D6BFF', ink: '#fff' },
    festival: { n: '06', name: 'La revelación', bg: K.ambar, acc: K.violeta, ink: K.azul }
  };

  /* ---------- pinceles ---------- */
  function poly(g, p) { g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); }
  function jag(cx, cy, r, R) { const p = []; for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, rr = r * (.8 + R() * .34); p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return p; }
  function jagRect(x, y, w, h, amp, R) { const p = [], st = 10; for (let i = 0; i <= w; i += st) p.push([x + i, y + (R() - .5) * amp]); for (let i = 0; i <= h; i += st) p.push([x + w + (R() - .5) * amp, y + i]); for (let i = w; i >= 0; i -= st) p.push([x + i, y + h + (R() - .5) * amp]); for (let i = h; i >= 0; i -= st) p.push([x + (R() - .5) * amp, y + i]); return p; }
  function splat(g, x, y, r, col, R, a) {
    g.save(); g.globalAlpha = a == null ? 1 : a; g.fillStyle = col; g.strokeStyle = col; poly(g, jag(x, y, r * .7, R)); g.fill();
    for (let k = 0; k < 14; k++) { const an = R() * 6.283, l = r * (.9 + R() * 1.5); g.lineWidth = Math.max(1, r * (.05 + R() * .11)); g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l); g.stroke(); g.beginPath(); g.arc(x + Math.cos(an) * l, y + Math.sin(an) * l, g.lineWidth * .9, 0, 7); g.fill(); }
    for (let k = 0; k < 40; k++) { const an = R() * 6.283, d = r * (1 + Math.pow(R(), 1.5) * 2.4); g.beginPath(); g.arc(x + Math.cos(an) * d, y + Math.sin(an) * d, Math.max(.8, r * .07 * R() * 2), 0, 7); g.fill(); }
    g.restore();
  }
  function halftone(g, x, y, w, h, col, s, R, dir) {
    g.save(); g.fillStyle = col; g.beginPath();
    for (let yy = 0; yy < h; yy += s) for (let xx = 0; xx < w; xx += s) { const f = dir === 'c' ? 1 - Math.hypot(xx / w - .5, yy / h - .5) * 2 : dir === 'r' ? xx / w : dir === 'u' ? 1 - yy / h : (xx / w + (1 - yy / h)) / 2; const rr = Math.max(0, f) * s * .55; if (rr > .5) { const px = x + xx + ((yy / s) % 2) * s / 2, py = y + yy; g.moveTo(px + rr, py); g.arc(px, py, rr, 0, 7); } }
    g.fill(); g.restore();
  }
  function dry(g, x, y, len, ang, wid, col, R, a) { g.save(); g.translate(x, y); g.rotate(ang); g.strokeStyle = col; g.globalAlpha = a == null ? .9 : a; const n = Math.max(6, wid / 2.2 | 0); for (let i = 0; i < n; i++) { const oy = (i / n - .5) * wid, end = len * (.7 + R() * .3); let xx = R() * len * .12; g.lineWidth = 1 + R() * 2.6; g.beginPath(); g.moveTo(xx, oy); while (xx < end) { xx += 8 + R() * 40; if (R() < .18) g.moveTo(xx, oy + (R() - .5) * 2); else g.lineTo(xx, oy + (R() - .5) * 3); } g.stroke(); } g.restore(); }
  function scribble(g, x, y, w, h, col, lw, R, n) { g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = g.lineJoin = 'round'; g.beginPath(); let px = x + R() * w, py = y + R() * h; g.moveTo(px, py); for (let k = 0; k < (n || 24); k++) { const nx = x + R() * w, ny = y + R() * h; g.quadraticCurveTo(px + (R() - .5) * w * .6, py + (R() - .5) * h * .6, nx, ny); px = nx; py = ny; } g.stroke(); g.restore(); }
  function specks(g, W, H, R, n, col, a) { g.save(); g.fillStyle = col; for (let k = 0; k < n; k++) { g.globalAlpha = a * R(); g.fillRect(R() * W, R() * H, 1 + R() * 2.4, 1 + R() * 2.4); } g.restore(); }
  function typed(g, x, y, w, rows, col, R, size) { g.save(); g.fillStyle = col; g.font = size + 'px "Courier New", monospace'; const abc = 'abcdefghijklmnopqrstuvwxyzáéíóúñ    '; for (let r = 0; r < rows; r++) { let s = ''; for (let i = 0; i < w / (size * .6); i++) s += abc[(R() * abc.length) | 0]; g.globalAlpha = .4 + R() * .5; g.fillText(s, x, y + r * size * 1.35); } g.restore(); }
  function cross(g, x, y, c, pat, col) { g.save(); g.strokeStyle = col; g.lineWidth = c * .28; g.lineCap = 'round'; pat.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== 'x') return; const px = x + i * c, py = y + j * c, p = c * .2; g.beginPath(); g.moveTo(px + p, py + p); g.lineTo(px + c - p, py + c - p); g.moveTo(px + c - p, py + p); g.lineTo(px + p, py + c - p); g.stroke(); })); g.restore(); }
  function torn(g, x, y, w, h, fill, R, rot) { g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot || 0); g.fillStyle = '#EDE8DC'; poly(g, jagRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 10, R)); g.fill(); g.fillStyle = fill; poly(g, jagRect(-w / 2, -h / 2, w, h, 8, R)); g.fill(); g.restore(); }

  /* ---------- portada collage por subconcepto ---------- */
  const ART = {
    home(g, W, H, R) { // Lo oculto: décollage, medio tono, texto ilegible, rayón ámbar, velo
      halftone(g, W * .35, 0, W * .65, H * .75, 'rgba(0,10,50,.55)', 15, R, 'r');
      torn(g, W * .48, H * .06, W * .46, H * .2, '#F1ECE0', R, .06); typed(g, W * .52, H * .1, W * .4, 6, 'rgba(31,28,30,.6)', R, 15);
      torn(g, W * .62, H * .3, W * .34, H * .16, K.tinta, R, -.08); typed(g, W * .65, H * .34, W * .3, 4, 'rgba(255,255,255,.55)', R, 14);
      dry(g, W * .3, H * .52, W * .7, -.12, 54, 'rgba(233,169,0,.95)', R);
      splat(g, W * .86, H * .62, 46, K.tinta, R, .85);
      scribble(g, W * .58, H * .08, W * .38, H * .4, 'rgba(255,255,255,.7)', 3, R, 18);
      g.fillStyle = 'rgba(247,245,240,.28)'; poly(g, jagRect(W * .72, -10, W * .32, H * .9, 12, R)); g.fill();
    },
    profile(g, W, H, R) { // La tensión: cuerdas tensas hacia un punto, efes de violín, regla
      const fx = W * .98, fy = H * .14; g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2;
      for (let k = 0; k < 26; k++) { g.beginPath(); g.moveTo(W * .2 + k * W * .03, H); g.lineTo(fx, fy + (R() - .5) * 18); g.stroke(); }
      g.strokeStyle = K.tinta; g.lineWidth = 16; g.lineCap = 'round';
      [[.7, .18], [.88, .3]].forEach(([x, y]) => { g.beginPath(); g.moveTo(W * x, H * y); g.bezierCurveTo(W * (x - .12), H * (y + .12), W * (x + .1), H * (y + .26), W * (x - .03), H * (y + .4)); g.stroke(); g.fillStyle = K.tinta; g.beginPath(); g.arc(W * x, H * y, 16, 0, 7); g.arc(W * (x - .03), H * (y + .4), 16, 0, 7); g.fill(); });
      halftone(g, W * .45, H * .55, W * .55, H * .45, 'rgba(233,169,0,.7)', 14, R, 'r');
      g.fillStyle = 'rgba(31,28,30,.6)'; for (let x = 12; x < W; x += 14) { const h = ((x - 12) / 14) % 5 === 0 ? 28 : 12; g.fillRect(x, 18, 2, h); }
      splat(g, W * .58, H * .5, 30, K.ambar, R, .9);
    },
    giro(g, W, H, R) { // El giro: pared nocturna, estelas de luz, yoyó óxido, puntada espiga
      specks(g, W, H, R, 2600, '#ffffff', .35);
      g.lineCap = 'round'; [[K.magenta, 0], [K.violeta, 18], ['#3D6BFF', -18], ['#F29BC5', 8]].forEach(([c, o]) => { g.strokeStyle = c; g.globalAlpha = .8; g.lineWidth = 14; g.beginPath(); g.moveTo(-20, H * .95 + o); g.bezierCurveTo(W * .3, H * .55 + o, W * .6, H * .6 + o, W + 20, H * .05 + o); g.stroke(); }); g.globalAlpha = 1;
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(W * .74, 0); g.lineTo(W * .74, H * .28); g.stroke();
      g.fillStyle = K.oxido; g.beginPath(); g.arc(W * .74, H * .36, W * .17, 0, 7); g.fill(); g.strokeStyle = 'rgba(31,28,30,.6)'; g.lineWidth = 4; g.beginPath(); for (let a = 0; a < Math.PI * 7; a += .12) { const r = a / (Math.PI * 7) * W * .16; g.lineTo(W * .74 + Math.cos(a) * r, H * .36 + Math.sin(a) * r); } g.stroke();
      splat(g, W * .5, H * .62, 40, K.oxido, R); splat(g, W * .9, H * .7, 26, K.magenta, R, .9);
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); for (let y = 0; y <= H; y += 18) g.lineTo(W - 16 + ((y / 18) % 2 ? 8 : -8), y); g.stroke();
    },
    guide(g, W, H, R) { // La pista: matriz de puntos, sashiko, cruces jūji-zashi, pincel ámbar
      g.fillStyle = 'rgba(255,255,255,.8)'; for (let y = 24; y < H * .7; y += 22) for (let x = W * .4; x < W; x += 22) if (R() < .32) { g.beginPath(); g.arc(x, y, 4.2, 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 4; g.setLineDash([22, 14]); for (let y = 40; y < H; y += 54) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + (R() - .5) * 8); g.stroke(); } g.setLineDash([]);
      cross(g, W * .62, H * .52, 24, ['x.x.x.x', '.x.x.x.', 'x.x.x.x', '.x.x.x.'], K.magenta);
      dry(g, W * .25, H * .18, W * .7, .2, 60, 'rgba(233,169,0,.9)', R);
      g.fillStyle = K.tinta; g.save(); g.translate(W * .78, H * .3); g.rotate(-.2); g.fillRect(-60, -10, 120, 20); g.fillRect(-12, -40, 24, 34); g.beginPath(); g.arc(0, -46, 18, 0, 7); g.fill(); g.restore();
      typed(g, W * .45, H * .82, W * .5, 4, 'rgba(255,255,255,.45)', R, 15);
    },
    wallet(g, W, H, R) { // El equilibrio: venas que se ramifican, ovillo, carbonilla
      g.lineCap = 'round';
      function br(x, y, a, w, d, col) { if (d > 8 || w < .6) return; const len = 40 + R() * 70, nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + nx) / 2 + (R() - .5) * 30, (y + ny) / 2 + (R() - .5) * 30, nx, ny); g.stroke(); br(nx, ny, a + (R() - .5) * .7, w * .82, d + 1, col); if (R() < .55) br(nx, ny, a + (R() < .5 ? -1 : 1) * (.5 + R() * .6), w * .6, d + 1, col); }
      for (let k = 0; k < 5; k++) br(W * (.45 + R() * .25), H * .98, -Math.PI / 2 + (R() - .5) * .9, 11, 0, 'rgba(255,150,210,.75)');
      for (let k = 0; k < 4; k++) br(W * (.75 + R() * .25), 0, Math.PI / 2 + (R() - .5), 8, 0, 'rgba(61,107,255,.85)');
      g.strokeStyle = 'rgba(255,190,230,.8)'; g.lineWidth = 2; for (let k = 0; k < 40; k++) { g.beginPath(); g.ellipse(W * .82, H * .82, 30 + R() * 50, 20 + R() * 40, R() * 3, 0, 7); g.stroke(); }
      g.fillStyle = 'rgba(31,28,30,.45)'; poly(g, jag(W * .62, H * .2, 70, R)); g.fill(); specks(g, W, H, R, 900, '#000', .3);
    },
    festival(g, W, H, R) { // La revelación: retícula desplazada, foto b/n en módulos, violeta
      const s = 96; for (let y = -s; y < H + s; y += s) for (let x = W * .3; x < W + s; x += s) { const ox = (R() - .5) * 18, oy = (R() - .5) * 18; if (R() < .28) { g.save(); g.beginPath(); g.rect(x + ox, y + oy, s * .92, s * .92); g.clip(); g.fillStyle = '#EDEDED'; g.fill(); halftone(g, x + ox, y + oy, s, s, 'rgba(31,28,30,.75)', 8, R, 'c'); g.restore(); } g.strokeStyle = 'rgba(31,28,30,.35)'; g.lineWidth = 2.5; g.strokeRect(x + ox, y + oy, s * .92, s * .92); }
      splat(g, W * .82, H * .14, 46, K.violeta, R, .9); splat(g, W * .5, H * .7, 24, K.magenta, R, .8);
      g.fillStyle = K.tinta; g.save(); g.translate(W * .76, H * .5); g.fillRect(-70, -50, 40, 100); for (let k = 0; k < 5; k++) g.fillRect(-26 + k * 16, -44 + k * 5, 10, 88 - k * 10); g.beginPath(); g.arc(70, 0, 32, 0, 7); g.fill(); g.fillStyle = '#EDEDED'; g.beginPath(); g.arc(70, 0, 16, 0, 7); g.fill(); g.restore();
      scribble(g, W * .4, H * .78, W * .3, H * .18, 'rgba(31,28,30,.7)', 3, R, 12);
    }
  };
  const cache = {};
  function heroArt(theme) {
    if (cache[theme]) return cache[theme];
    const W = 720, H = 960, c = doc.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), R = rng(theme.length * 131);
    (ART[theme] || ART.home)(g, W, H, R); specks(g, W, H, R, 1600, '#000', .22);
    return (cache[theme] = c.toDataURL('image/png'));
  }
  const paperCache = {};
  function paper(theme) {
    if (paperCache[theme]) return paperCache[theme];
    const t = THEMES[theme] || THEMES.home, W = 520, H = 520, c = doc.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), R = rng(7 + theme.length);
    specks(g, W, H, R, 2600, '#000', .1); specks(g, W, H, R, 900, t.bg, .18);
    g.strokeStyle = 'rgba(31,28,30,.05)'; for (let k = 0; k < 60; k++) { const x = R() * W, y = R() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 60, y + (R() - .5) * 14); g.stroke(); }
    return (paperCache[theme] = c.toDataURL('image/png'));
  }
  // precalentar
  Object.keys(THEMES).forEach(k => setTimeout(() => heroArt(k), 50));

  /* ---------- capas: hilo, rasgado ---------- */
  const trail = doc.createElement('canvas'); trail.className = 'pz-trail'; trail.setAttribute('aria-hidden', 'true'); shell.appendChild(trail);
  const wipe = doc.createElement('div'); wipe.className = 'pz-wipe'; wipe.setAttribute('aria-hidden', 'true'); shell.appendChild(wipe);
  const tg = trail.getContext('2d'); let pts = [], TW = 0, TH = 0, td = 1, tcolor = '#fff';
  function fitTrail() { const r = shell.getBoundingClientRect(); td = Math.min(2, devicePixelRatio || 1); TW = r.width; TH = r.height; trail.width = TW * td; trail.height = TH * td; }
  fitTrail(); addEventListener('resize', fitTrail);
  shell.addEventListener('pointermove', e => { if (reduce) return; const r = shell.getBoundingClientRect(); pts.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }); if (pts.length > 80) pts.shift(); }, { passive: true });
  shell.addEventListener('pointerdown', e => { if (reduce) return; const r = shell.getBoundingClientRect(); pts.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now(), knot: 1 }); }, { passive: true });
  (function draw() {
    requestAnimationFrame(draw);
    const now = performance.now(); pts = pts.filter(p => now - p.t < 900);
    tg.setTransform(td, 0, 0, td, 0, 0); tg.clearRect(0, 0, TW, TH); if (pts.length < 2) return;
    tg.lineCap = tg.lineJoin = 'round';
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], age = (now - b.t) / 900; tg.strokeStyle = tcolor; tg.globalAlpha = (1 - age) * .9; tg.lineWidth = 3.2 * (1 - age * .6); tg.setLineDash([8, 6]); tg.lineDashOffset = -now / 30; tg.beginPath(); tg.moveTo(a.x, a.y); tg.lineTo(b.x, b.y); tg.stroke(); }
    tg.setLineDash([]); pts.forEach(p => { if (!p.knot) return; const age = (now - p.t) / 900; tg.globalAlpha = 1 - age; tg.strokeStyle = tcolor; tg.lineWidth = 2.5; tg.beginPath(); tg.arc(p.x, p.y, 6 + age * 18, 0, 7); tg.stroke(); });
    tg.globalAlpha = 1;
  })();

  /* ---------- títulos que caen ---------- */
  function kinetic(h) {
    if (!h || h.dataset.pz) return; h.dataset.pz = '1'; const R = rng((h.textContent.length * 97) | 0); let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) { const parts = n.textContent.split(/(\s+)/), frag = doc.createDocumentFragment(); parts.forEach(p => { if (!p) return; if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; } const s = doc.createElement('span'); s.className = 'pz-w'; s.textContent = p; s.style.setProperty('--d', (i++ * .07) + 's'); s.style.setProperty('--r', ((R() - .5) * 5).toFixed(1) + 'deg'); s.style.setProperty('--y', ((R() - .5) * 6).toFixed(0) + 'px'); frag.appendChild(s); }); n.replaceWith(frag); }
      else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(h); h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
  }

  /* ---------- envolver render ---------- */
  let last = null;
  const prevRender = render;
  render = function () {
    prevRender();
    const theme = shell.dataset.theme || 'home', t = THEMES[theme] || THEMES.home, scr = state.screen, changed = scr !== last; last = scr;
    shell.style.setProperty('--pz-art', 'url(' + heroArt(theme) + ')');
    shell.style.setProperty('--pz-paper', 'url(' + paper(theme) + ')');
    shell.style.setProperty('--pz-acc', t.acc); shell.style.setProperty('--pz-bg', t.bg); shell.style.setProperty('--pz-ink', t.ink);
    tcolor = theme === 'festival' ? K.azul : t.bg === '#161616' ? K.oxido : t.bg;
    const hero = content.querySelector('.app-hero');
    if (hero && !hero.querySelector('.pz-num')) hero.insertAdjacentHTML('afterbegin', '<span class="pz-num" aria-hidden="true">' + t.n + '</span>');
    kinetic(content.querySelector('.app-hero h1')); kinetic(content.querySelector('.screen-title')); kinetic(content.querySelector('.article-hero h1'));
    const body = content.querySelector('.page-body') || content;
    if (!content.querySelector('.pz-marquee')) {
      const txt = ('NI MUY MUY · NI TAN TAN · ' + t.n + ' ' + t.name.toUpperCase() + ' · ').repeat(4);
      const m = '<div class="pz-marquee" aria-hidden="true"><div><span>' + txt + '</span><span>' + txt + '</span></div></div>';
      if (hero) hero.insertAdjacentHTML('afterend', m); else { const ttl = content.querySelector('.screen-intro') || content.querySelector('.screen-title'); if (ttl) ttl.insertAdjacentHTML('afterend', m); }
    }
    if (changed && !reduce && last !== null) { wipe.style.setProperty('--wc', t.bg); wipe.classList.remove('go'); void wipe.offsetWidth; wipe.classList.add('go'); }
    content.scrollTop = content.scrollTop; onScroll();
  };
  function onScroll() { const y = content.scrollTop; shell.style.setProperty('--pz-y', y.toFixed(0)); }
  content.addEventListener('scroll', onScroll, { passive: true });
  render();
})();
