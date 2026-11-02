/* Bio Feria · shared kit: palette, seeded random, canvas grunge (splatter, halftone, scribble, dry brush, torn paper), loops */
window.BF = (function () {
  const C = {
    papel: '#F3F3F1', tinta: '#141414', gris: '#5C5A55',
    azul: '#003DA5', violeta: '#9B26B6', oxido: '#C05131',
    magenta: '#C2187A', petroleo: '#028EA5', ambar: '#DBA015', rojo: '#D93A26'
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function fit(cv) {
    const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    return { w, h, d, cw: r.width, ch: r.height };
  }

  // run fn(dt, t) only while el is on screen
  function loop(el, fn) {
    let vis = false, raf = 0, last = 0;
    function tick(now) {
      const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
      fn(dt, now / 1000);
      raf = vis ? requestAnimationFrame(tick) : 0;
    }
    new IntersectionObserver(es => {
      vis = es[0].isIntersecting;
      if (vis && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    }, { rootMargin: '120px' }).observe(el);
  }

  /* ---------- drawing primitives ---------- */
  function poly(g, p) { g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); }
  function jagCircle(cx, cy, r, R, sq) {
    const p = [], n = Math.max(24, Math.round(r / 4)); let d = 0;
    for (let i = 0; i < n; i++) { d += (R() - .5) * .16; d *= .86; const a = i / n * Math.PI * 2, rr = r * (1 + d + (R() - .5) * .08); p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * (sq || .86)]); }
    return p;
  }
  function jagRect(W, H, ins, amp, R) {
    const p = [], st = 12, j = () => (R() < .07 ? (R() - .5) * amp * 3.5 : (R() - .5) * amp);
    for (let x = ins; x <= W - ins; x += st) p.push([x, ins + j()]);
    for (let y = ins; y <= H - ins; y += st) p.push([W - ins + j(), y]);
    for (let x = W - ins; x >= ins; x -= st) p.push([x, H - ins + j()]);
    for (let y = H - ins; y >= ins; y -= st) p.push([ins + j(), y]);
    return p;
  }
  function splat(g, x, y, r, col, R, a) {
    g.save(); g.globalAlpha = a == null ? 1 : a; g.fillStyle = col; g.strokeStyle = col;
    poly(g, jagCircle(x, y, r * .7, R, 1)); g.fill();
    const n = 10 + (R() * 10 | 0);
    for (let k = 0; k < n; k++) { // tendrils
      const an = R() * Math.PI * 2, len = r * (.9 + R() * 1.4);
      g.lineWidth = Math.max(1, r * (.05 + R() * .12)); g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an) * len, y + Math.sin(an) * len); g.stroke();
      g.beginPath(); g.arc(x + Math.cos(an) * len, y + Math.sin(an) * len, g.lineWidth * .9, 0, 7); g.fill();
    }
    for (let k = 0; k < 40; k++) { // droplets
      const an = R() * Math.PI * 2, d = r * (1 + Math.pow(R(), 1.5) * 2.6), s = Math.max(.8, r * .07 * Math.pow(R(), 2) * 2);
      g.beginPath(); g.arc(x + Math.cos(an) * d, y + Math.sin(an) * d, s, 0, 7); g.fill();
    }
    g.restore();
  }
  function halftone(g, x, y, w, h, col, s, R, dir) {
    g.save(); g.fillStyle = col; g.beginPath();
    for (let yy = 0; yy < h; yy += s) for (let xx = 0; xx < w; xx += s) {
      const f = dir === 'r' ? xx / w : dir === 'c' ? 1 - Math.hypot(xx / w - .5, yy / h - .5) * 2 : (xx / w + yy / h) / 2;
      const rr = Math.max(0, f) * s * .55 * (.85 + R() * .3);
      if (rr > .5) { const px = x + xx + ((yy / s) % 2) * s / 2, py = y + yy; g.moveTo(px + rr, py); g.arc(px, py, rr, 0, 7); }
    }
    g.fill(); g.restore();
  }
  function scribble(g, x, y, w, h, col, lw, R, n) {
    g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); let px = x + R() * w, py = y + R() * h; g.moveTo(px, py);
    for (let k = 0; k < (n || 26); k++) { const nx = x + R() * w, ny = y + R() * h; g.quadraticCurveTo(px + (R() - .5) * w * .6, py + (R() - .5) * h * .6, nx, ny); px = nx; py = ny; }
    g.stroke(); g.restore();
  }
  function dryBrush(g, x, y, len, ang, wid, col, R, a) {
    g.save(); g.translate(x, y); g.rotate(ang); g.strokeStyle = col; g.globalAlpha = a == null ? .9 : a;
    const lines = Math.max(6, wid / 2.2 | 0);
    for (let i = 0; i < lines; i++) {
      const oy = (i / lines - .5) * wid, start = R() * len * .15, end = len * (.7 + R() * .3);
      g.lineWidth = 1 + R() * 2.4; g.beginPath(); let xx = start; g.moveTo(xx, oy);
      while (xx < end) { const seg = 8 + R() * 40; xx += seg; if (R() < .18) { g.moveTo(xx, oy + (R() - .5) * 2); } else g.lineTo(xx, oy + (R() - .5) * 3); }
      g.stroke();
    }
    g.restore();
  }
  function specks(g, W, H, R, n, col, a) {
    g.save(); g.fillStyle = col;
    for (let k = 0; k < n; k++) { g.globalAlpha = (a || .5) * R(); g.fillRect(R() * W, R() * H, 1 + R() * 2.2, 1 + R() * 2.2); }
    g.restore();
  }
  function grain(g, W, H, R, a) {
    const n = Math.round(W * H / 90);
    for (let k = 0; k < n; k++) { const v = R() < .5 ? 0 : 255; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (a * R()).toFixed(3) + ')'; g.fillRect(R() * W, R() * H, 1.5, 1.5); }
  }
  function crossStitch(g, x, y, cell, pattern, cols) { // pattern: array of strings, chars index into cols
    g.save(); g.lineCap = 'round';
    pattern.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.') return; const c = cols[+ch] || cols[0]; const px = x + i * cell, py = y + j * cell, p = cell * .18;
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = cell * .32;
      g.beginPath(); g.moveTo(px + p + 1, py + p + 1); g.lineTo(px + cell - p + 1, py + cell - p + 1); g.moveTo(px + cell - p + 1, py + p + 1); g.lineTo(px + p + 1, py + cell - p + 1); g.stroke();
      g.strokeStyle = c; g.lineWidth = cell * .28;
      g.beginPath(); g.moveTo(px + p, py + p); g.lineTo(px + cell - p, py + cell - p); g.moveTo(px + cell - p, py + p); g.lineTo(px + p, py + cell - p); g.stroke();
    }));
    g.restore();
  }
  function chevrons(g, x, y, len, size, col) { // »»»» ribbon
    g.save(); g.strokeStyle = col; g.lineWidth = Math.max(1.5, size * .22);
    for (let xx = 0; xx < len; xx += size * .7) { g.beginPath(); g.moveTo(x + xx, y - size / 2); g.lineTo(x + xx + size * .45, y); g.lineTo(x + xx, y + size / 2); g.stroke(); }
    g.restore();
  }
  function typeLines(g, x, y, w, rows, col, R, size) { // unreadable typewritten lines
    g.save(); g.fillStyle = col; g.font = (size || 13) + 'px "Special Elite", "Courier New", monospace';
    const abc = 'abcdefghijklmnopqrstuvwxyzáéíóúñ    ';
    for (let r = 0; r < rows; r++) {
      let s = ''; const n = (w / ((size || 13) * .6)) | 0; for (let i = 0; i < n; i++) s += abc[(R() * abc.length) | 0];
      g.globalAlpha = .45 + R() * .5; g.fillText(s, x, y + r * (size || 13) * 1.35);
    }
    g.restore();
  }

  /* ---------- section textures (transparent PNG data URLs) ---------- */
  const texCache = {};
  function texture(kind, w, h, seed) {
    const key = kind + w + 'x' + h + seed; if (texCache[key]) return texCache[key];
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), R = rng(seed || 7);
    const k = TEX[kind]; if (k) k(g, w, h, R);
    return (texCache[key] = c.toDataURL('image/png'));
  }
  const TEX = {
    oculto(g, W, H, R) {
      halftone(g, W * .55, 0, W * .45, H * .7, 'rgba(0,20,70,.22)', 12, R, 'r');
      for (let i = 0; i < 4; i++) splat(g, R() * W, R() * H, 30 + R() * 50, 'rgba(0,61,165,.35)', R);
      dryBrush(g, W * .05, H * .82, W * .5, -.05, 26, 'rgba(219,160,21,.65)', R);
      scribble(g, W * .7, H * .6, W * .25, H * .3, 'rgba(20,20,20,.5)', 2, R, 14);
      typeLines(g, W * .06, H * .1, W * .3, 8, 'rgba(20,20,20,.35)', R, 12);
      specks(g, W, H, R, 900, '#141414', .35);
    },
    tension(g, W, H, R) {
      for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(155,38,182,.18)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, H * R()); g.lineTo(W, H * R()); g.stroke(); }
      halftone(g, 0, H * .55, W * .4, H * .45, 'rgba(155,38,182,.25)', 10, R, 'c');
      dryBrush(g, W * .6, H * .15, W * .4, .5, 40, 'rgba(20,20,20,.75)', R);
      dryBrush(g, 0, H * .92, W, 0, 30, 'rgba(219,160,21,.55)', R);
      splat(g, W * .85, H * .8, 40, 'rgba(155,38,182,.5)', R);
      specks(g, W, H, R, 800, '#141414', .35);
    },
    giro(g, W, H, R) {
      for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(255,255,255,' + (.015 + R() * .03) + ')'; poly(g, jagCircle(R() * W, R() * H, 60 + R() * 200, R)); g.fill(); }
      for (let i = 0; i < 70; i++) { g.strokeStyle = 'rgba(255,255,255,' + (.04 + R() * .08) + ')'; g.lineWidth = .7; g.beginPath(); const x = R() * W, y = R() * H; g.moveTo(x, y); g.lineTo(x + (R() - .5) * 120, y + (R() - .5) * 30); g.stroke(); }
      specks(g, W, H, R, 2600, '#ffffff', .22);
      splat(g, W * .9, H * .15, 50, 'rgba(192,81,49,.6)', R);
      splat(g, W * .1, H * .85, 36, 'rgba(194,24,122,.5)', R);
    },
    pista(g, W, H, R) {
      g.fillStyle = 'rgba(255,255,255,.55)';
      for (let y = 18; y < H; y += 26) for (let x = 18; x < W; x += 26) if (R() < .22) { g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.setLineDash([16, 10]);
      for (let y = 40; y < H; y += 120) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + (R() - .5) * 10); g.stroke(); } g.setLineDash([]);
      crossStitch(g, W * .82, H * .08, 14, ['1.1.1', '.1.1.', '1.1.1', '.1.1.'], ['#C2187A', '#C2187A']);
      dryBrush(g, W * .02, H * .7, W * .4, -.2, 34, 'rgba(219,160,21,.55)', R);
      typeLines(g, W * .62, H * .78, W * .32, 6, 'rgba(255,255,255,.35)', R, 12);
      specks(g, W, H, R, 900, '#000', .3);
    },
    equilibrio(g, W, H, R) {
      function br(x, y, a, w, d) { if (d > 7 || w < .6) return; const len = 30 + R() * 60, nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + nx) / 2 + (R() - .5) * 26, (y + ny) / 2 + (R() - .5) * 26, nx, ny); g.stroke(); br(nx, ny, a + (R() - .5) * .7, w * .8, d + 1); if (R() < .5) br(nx, ny, a + (R() < .5 ? -1 : 1) * (.5 + R() * .6), w * .6, d + 1); }
      g.lineCap = 'round'; g.strokeStyle = 'rgba(194,24,122,.35)'; for (let k = 0; k < 4; k++) br(W * (.02 + R() * .2), H, -Math.PI / 2 + (R() - .5) * .8, 7, 0);
      g.strokeStyle = 'rgba(0,61,165,.28)'; for (let k = 0; k < 3; k++) br(W * (.75 + R() * .2), 0, Math.PI / 2 + (R() - .5) * .8, 6, 0);
      splat(g, W * .12, H * .88, 46, 'rgba(194,24,122,.45)', R); splat(g, W * .9, H * .12, 40, 'rgba(0,61,165,.4)', R);
      scribble(g, W * .4, H * .4, W * .3, H * .2, 'rgba(20,20,20,.25)', 1.5, R, 20);
      specks(g, W, H, R, 900, '#141414', .3);
    },
    revelacion(g, W, H, R) {
      const s = 110; g.strokeStyle = 'rgba(20,20,20,.14)'; g.lineWidth = 1.5;
      for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) g.strokeRect(x + (R() - .5) * 10, y + (R() - .5) * 10, s - 6, s - 6);
      dryBrush(g, W * .55, H * .1, W * .45, .1, 46, 'rgba(219,160,21,.5)', R);
      splat(g, W * .92, H * .1, 40, 'rgba(155,38,182,.35)', R);
      scribble(g, W * .05, H * .75, W * .2, H * .2, 'rgba(20,20,20,.4)', 2, R, 12);
      specks(g, W, H, R, 900, '#141414', .3);
    },
    hero(g, W, H, R) {
      splat(g, W * .86, H * .2, 70, 'rgba(219,160,21,.75)', R);
      splat(g, W * .93, H * .55, 38, 'rgba(155,38,182,.55)', R);
      halftone(g, W * .7, H * .55, W * .3, H * .45, 'rgba(0,61,165,.5)', 12, R, 'r');
      dryBrush(g, W * .62, H * .38, W * .38, -.35, 38, 'rgba(0,61,165,.8)', R);
      scribble(g, W * .74, H * .1, W * .22, H * .3, 'rgba(20,20,20,.7)', 2.2, R, 16);
      crossStitch(g, W * .66, H * .78, 13, ['..0..', '.010.', '01210', '.010.', '..0..'], ['#DBA015', '#028EA5', '#C2187A']);
      chevrons(g, W * .58, H * .95, W * .42, 16, 'rgba(155,38,182,.8)');
      specks(g, W, H, R, 900, '#141414', .3);
    }
  };

  /* ---------- torn edge for section joins ---------- */
  function tornSVG(seed, fill) {
    const R = rng(seed), pts = []; let x = 0;
    while (x <= 1000) { pts.push(x.toFixed(0) + ',' + (10 + (R() < .1 ? R() * 18 : R() * 9)).toFixed(1)); x += 6 + R() * 14; }
    const d = 'M0,40 L' + pts.join(' L') + ' L1000,40 Z';
    return 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 40" preserveAspectRatio="none"><path d="' + d + '" fill="' + (fill || '#000') + '"/></svg>') + '")';
  }

  return { C, reduce, rng, clamp, lerp, ease, fit, loop, poly, jagCircle, jagRect, splat, halftone, scribble, dryBrush, specks, grain, crossStitch, chevrons, typeLines, texture, tornSVG };
})();

/* apply textures + torn edges once the fonts are ready */
(function () {
  function apply() {
    document.querySelectorAll('[data-tex]').forEach((el, i) => {
      el.style.setProperty('--tex', 'url(' + BF.texture(el.dataset.tex, 1100, 760, 13 + i * 7) + ')');
    });
    const root = document.documentElement.style;
    root.setProperty('--torn-a', BF.tornSVG(3)); root.setProperty('--torn-b', BF.tornSVG(9));
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(apply);
})();
