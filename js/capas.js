/* Bioferia 2027 · capas dinámicas sobre la web de Merlina.
   No cambia los textos: agrega fondos de afiche, color por subconcepto, animación y tres juegos funcionales.
   Juego 1 · La tensión  (Agenda)          → la clavija arma tu plan y lo marca en la agenda.
   Juego 2 · El giro     (Emprendimientos) → la rueda elige el área y abre su ficha.
   Juego 3 · La revelación (Entradas)      → coser el afiche libera el talón de la entrada (preventa).
   Además: puerta con hilo, afiche para arrancar, mapa para coser y espacios 3D. */
(function () {
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const COL = { oculto: '#003B94', tension: '#A330B6', giro: '#C15F2B', pista: '#028EA5', equilibrio: '#C2186B', revelacion: '#E19A00', tinta: '#1F1C1E', papel: '#F3F3F1', rojo: '#D7262C' };
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } }
  const toastEl = $('#wtoast');
  function toast(m) { toastEl.textContent = m; toastEl.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => toastEl.classList.remove('on'), 3400); }
  // cuerda pulsada (Karplus–Strong)
  let ac = null; const ks = {};
  function pluck(f, vol) {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
    if (ac.state === 'suspended') ac.resume();
    const key = Math.round(f); let b = ks[key];
    if (!b) { const sr = ac.sampleRate, len = Math.floor(sr * 1.6), N = Math.max(2, Math.round(sr / f)); b = ac.createBuffer(1, len, sr); const y = b.getChannelData(0); for (let n = 0; n < N; n++) y[n] = Math.random() * 2 - 1; for (let n = N; n < len; n++) y[n] = .497 * (y[n - N] + (n - N - 1 >= 0 ? y[n - N - 1] : 0)); ks[key] = b; }
    const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; g.gain.value = vol == null ? .4 : vol; s.connect(g); g.connect(ac.destination); s.start();
  }
  function fitCanvas(cv) { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = Math.max(1, r.width * d); cv.height = Math.max(1, r.height * d); return { W: r.width, H: r.height, d }; }
  function onScreen(el, fn) { new IntersectionObserver(es => fn(es[0].isIntersecting), { rootMargin: '80px' }).observe(el); }
  function loop(el, fn) { let vis = true, last = performance.now(); onScreen(el, v => vis = v); (function f(t) { requestAnimationFrame(f); const dt = Math.min(.05, (t - last) / 1000); last = t; if (vis) fn(dt, t / 1000); })(last); }
  function jag(g, x, y, r, seed) { g.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, k = .72 + ((Math.sin(seed * 9.1 + i * 12.9898) * 43758.5453) % 1 + 1) % 1 * .45; const px = x + Math.cos(a) * r * k, py = y + Math.sin(a) * r * k; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); }
  function img(src) { const i = new Image(); i.src = src; return i; }

  /* ============ 1 · un subconcepto, un color y un afiche por sección ============ */
  const SECC = [
    ['que-es', 'oculto', 'assets/poster-oculto.webp'],
    ['concepto', 'oculto', 'assets/poster-pista.webp'],
    ['agenda', 'tension', 'assets/poster-tension.webp'],
    ['emprendimientos', 'giro', 'assets/poster-giro.webp'],
    ['experiencias', 'equilibrio', 'assets/poster-equilibrio.webp'],
    ['mapa', 'pista', null],
    ['como-llegar', 'oculto', 'assets/poster-oculto.webp'],
    ['informacion', 'tension', 'assets/poster-tension.webp'],
    ['impacto', 'equilibrio', 'assets/poster-equilibrio.webp'],
    ['app', 'giro', 'assets/poster-giro.webp'],
    ['entradas', 'revelacion', 'assets/poster-revelacion.webp']
  ];
  const fondos = [];
  SECC.forEach(([id, sub, src]) => {
    const s = document.getElementById(id); if (!s) return;
    s.dataset.sub = sub; s.classList.add('bf-sec');
    if (src) { const f = document.createElement('div'); f.className = 'bf-fondo'; f.setAttribute('aria-hidden', 'true'); f.style.backgroundImage = 'url(' + src + ')'; s.prepend(f); fondos.push([s, f]); }
    const tira = document.createElement('i'); tira.className = 'bf-tira'; tira.setAttribute('aria-hidden', 'true'); s.prepend(tira);
  });
  document.getElementById('inicio').dataset.sub = 'oculto';
  // parallax de los afiches
  function parallax() { fondos.forEach(([s, f]) => { const r = s.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; f.style.transform = 'translate3d(0,' + (r.top * -.12).toFixed(1) + 'px,0) scale(1.12)'; }); }
  if (!reduce) { addEventListener('scroll', parallax, { passive: true }); parallax(); }

  // aparecer al entrar en pantalla
  const aparecen = $$('.section-index, .section-heading, .intro-grid > *, .date-band, .countdown-wrap, .concept-grid li, .agenda-board, .ventures-intro, .category-layout, .experience-card, .map-layout, .arrival-grid article, .faq details, .impact-stats > div, .impact-actions, .app-copy, .device-stage, .tickets-section > div, .bf-juego');
  aparecen.forEach((el, i) => { el.classList.add('bf-aparece'); el.style.setProperty('--d', ((i % 4) * 70) + 'ms'); });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('bf-in'); io.unobserve(e.target); } }), { threshold: .12 });
  aparecen.forEach(el => io.observe(el));
  // los titulares se cosen: subrayado de hilo bajo cada <em>
  $$('h2 em').forEach(em => em.classList.add('bf-cosido'));

  // contadores de impacto (el texto final queda igual al original)
  $$('.impact-stats strong').forEach(st => {
    const node = st.firstChild; if (!node || node.nodeType !== 3) return;
    const orig = node.textContent, num = parseInt(orig.replace(/\D/g, ''), 10); if (!num) return;
    const fmt = n => orig.replace(/[\d.]+/, n >= 1000 ? n.toLocaleString('es-AR') : String(n));
    if (reduce) return;
    node.textContent = fmt(0);
    onScreen(st, v => { if (!v || st.dataset.done) return; st.dataset.done = 1; const t0 = performance.now(); (function f(t) { const k = clamp((t - t0) / 1600, 0, 1), e = 1 - Math.pow(1 - k, 3); node.textContent = k < 1 ? fmt(Math.round(num * e)) : orig; if (k < 1) requestAnimationFrame(f); })(t0); });
  });

  // concepto: cada momento lleva su color y lleva a su sección
  const DESTINO = ['#inicio', '#agenda', '#emprendimientos', '#mapa', '#experiencias', '#entradas'];
  $$('.concept-grid li').forEach((li, i) => {
    li.style.setProperty('--c', Object.values(COL)[i]);
    const a = document.createElement('a'); a.className = 'bf-ir'; a.href = DESTINO[i]; a.textContent = 'Ir a la sección ↗'; li.querySelector('div').appendChild(a);
  });

  /* ============ 2 · Lo oculto · arrancar el afiche del hero ============ */
  (function rasgar() {
    const cv = $('#rasgar'), hint = $('#rasgarHint'), tapar = $('#tapar'); if (!cv) return;
    const g = cv.getContext('2d'), poster = img('assets/poster-oculto.webp'), capa = img('assets/poster-pista.webp');
    const GX = 30, GY = 30; let grid, count = 0, dims = { W: 1, H: 1, d: 1 }, done = false, last = null, seed = 1;
    function cover(im, W, H, a) { if (!im.naturalWidth) return; const k = Math.max(W / im.naturalWidth, H / im.naturalHeight) * (a || 1); g.drawImage(im, (W - im.naturalWidth * k) / 2, (H - im.naturalHeight * k) / 2, im.naturalWidth * k, im.naturalHeight * k); }
    function paint() {
      dims = fitCanvas(cv); const { W, H, d } = dims; g.setTransform(d, 0, 0, d, 0, 0);
      g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
      g.fillStyle = '#ECE7DB'; g.fillRect(0, 0, W, H); cover(poster, W, H);
      // segunda capa: el fragmento tipográfico, pegado en diagonal
      g.save(); g.globalAlpha = .92; g.beginPath(); g.moveTo(0, H * .62); g.lineTo(W, H * .44); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.clip(); cover(capa, W, H, 1.05); g.restore();
      g.strokeStyle = 'rgba(20,20,20,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, H * .62); g.lineTo(W, H * .44); g.stroke();
      grid = new Uint8Array(GX * GY); count = 0; done = false; cv.classList.remove('gone'); hint.style.opacity = 1; tapar.hidden = true;
    }
    function tear(x, y) {
      const { W, H } = dims, r = Math.max(26, Math.min(W, H) * .085);
      g.globalCompositeOperation = 'destination-out'; jag(g, x, y, r, seed++); g.fill();
      g.globalCompositeOperation = 'source-over';
      const gx0 = Math.floor((x - r) / W * GX), gx1 = Math.floor((x + r) / W * GX), gy0 = Math.floor((y - r) / H * GY), gy1 = Math.floor((y + r) / H * GY);
      for (let j = Math.max(0, gy0); j <= Math.min(GY - 1, gy1); j++) for (let i = Math.max(0, gx0); i <= Math.min(GX - 1, gx1); i++) if (!grid[j * GX + i]) { grid[j * GX + i] = 1; count++; }
      if (!done && count / (GX * GY) > .45) finish();
    }
    function finish() { done = true; cv.classList.add('gone'); tapar.hidden = false; hint.style.opacity = 0; buzz([20, 30, 20]); toast('Lo que buscás ya está acá.'); }
    function pos(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    cv.addEventListener('pointerdown', e => { if (done) return; cv.setPointerCapture(e.pointerId); last = pos(e); tear(...last); hint.style.opacity = 0;  });
    cv.addEventListener('pointermove', e => { if (!last || done) return; const p = pos(e), dx = p[0] - last[0], dy = p[1] - last[1], n = Math.ceil(Math.hypot(dx, dy) / 14); for (let k = 1; k <= n; k++) tear(last[0] + dx * k / n, last[1] + dy * k / n); last = p; });
    const up = () => last = null; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    tapar.addEventListener('click', paint);
    let ready = 0; [poster, capa].forEach(im => { const ok = () => { if (++ready === 2) paint(); }; im.complete && im.naturalWidth ? ok() : (im.onload = ok, im.onerror = ok); });
    addEventListener('resize', () => { if (!done) paint(); });
  })();

  /* ============ 3 · Juego 1 · La tensión · afiná tu visita (agenda) ============ */
  const DIAS = { 9: 'VIE 9', 10: 'SÁB 10', 11: 'DOM 11' }, TIPOS = { charlas: 'Charlas', talleres: 'Talleres', actividades: 'Actividades' };
  const ORDEN = [[10, 'charlas'], [9, 'actividades'], [11, 'talleres'], [10, 'talleres'], [9, 'charlas'], [11, 'actividades'], [10, 'actividades'], [9, 'talleres'], [11, 'charlas']];
  let plan = store.get('bf-plan-web', []);
  function marcarAgenda() {
    $$('.agenda-days button').forEach(b => { const n = plan.filter(p => String(p[0]) === b.dataset.day).length; b.dataset.plan = n || ''; b.classList.toggle('bf-en-plan', n > 0); });
    const dia = ($('.agenda-days button.active') || {}).dataset?.day;
    $$('.agenda-list article').forEach(a => {
      const dias = plan.filter(p => p[1] === a.dataset.type).map(p => p[0]);
      let chip = $('.bf-chip-plan', a);
      if (!dias.length) { chip && chip.remove(); a.classList.remove('bf-en-plan', 'bf-hoy'); return; }
      if (!chip) { chip = document.createElement('em'); chip.className = 'bf-chip-plan'; a.appendChild(chip); }
      chip.textContent = 'En tu plan · ' + dias.sort((a, b) => a - b).map(d => DIAS[d]).join(' · ');
      a.classList.add('bf-en-plan'); a.classList.toggle('bf-hoy', dias.map(String).includes(dia));
    });
  }
  $$('.agenda-days button').forEach(b => b.addEventListener('click', () => setTimeout(marcarAgenda)));
  marcarAgenda();
  (function clavija() {
    const cv = $('#tuneCv'); if (!cv) return;
    const g = cv.getContext('2d'), range = $('#tuneR'), lvl = $('#tuneLvl'), title = $('#tuneTitle'), list = $('#tuneList'), save = $('#tuneSave');
    const NIV = [[.15, 0, 'Muy muy floja', 'No suena', 'Subí un poco la clavija: con una sola actividad ya empieza a sonar.'], [.35, 2, 'Tranquila', 'Una visita tranquila', ''], [.6, 4, 'A tu medida', 'Una visita a tu ritmo', ''], [.82, 6, 'Con ritmo', 'Una visita con ritmo', ''], [.97, 8, 'Tan tan', 'Casi se corta', 'Así no se disfruta: aflojá un poco.']];
    let t = .5, amp = 0, ph = 0, snapped = 0, drag = false, lastY = 0, lastN = -1, D = fitCanvas(cv), elegido = [];
    const nivel = () => NIV.find(l => t < l[0]) || NIV[NIV.length - 1];
    function render() {
      const L = nivel(), n = L[1]; lvl.textContent = L[2]; title.textContent = L[3];
      elegido = ORDEN.slice(0, n).sort((a, b) => a[0] - b[0]);
      list.innerHTML = n ? elegido.map(p => '<li><span>' + DIAS[p[0]] + '</span><b>' + TIPOS[p[1]] + '</b></li>').join('') : '<li class="vacio">' + L[4] + '</li>';
      if (n && L[4]) list.insertAdjacentHTML('beforeend', '<li class="vacio">' + L[4] + '</li>');
      save.disabled = !n;
      if (n !== lastN) { if (lastN >= 0) { amp = 10; pluck(110 * Math.pow(2, t * 2), .35); buzz(8); } lastN = n; }
    }
    function set(v) { t = clamp(v, 0, 1); range.value = Math.round(t * 100); if (t > .97 && snapped <= 0) snap(); render(); }
    function snap() { snapped = 1.3; buzz([60, 40, 60]); pluck(880, .2); toast('Tan tan: se cortó la cuerda. Probá con menos.'); setTimeout(() => set(.5), 900); }
    range.addEventListener('input', () => set(range.value / 100));
    addEventListener('resize', () => D = fitCanvas(cv));
    cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left; if (x > D.W * .7) { drag = true; lastY = e.clientY; cv.setPointerCapture(e.pointerId); } else { amp = 14; ph = 0; pluck(110 * Math.pow(2, t * 2), .45); buzz(10); } });
    cv.addEventListener('pointermove', e => { if (!drag) return; set(t - (e.clientY - lastY) / 240); lastY = e.clientY; });
    const up = () => drag = false; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    save.addEventListener('click', () => {
      plan = elegido.slice(); store.set('bf-plan-web', plan); marcarAgenda();
      const primero = plan[0]; if (primero) { const b = $('.agenda-days button[data-day="' + primero[0] + '"]'); b && b.click(); }
      toast('Guardaste tu plan: ' + plan.length + ' momentos. Quedaron marcados en la agenda.'); pluck(330, .3); buzz(15);
      $('.agenda-board').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
    render();
    loop(cv, dt => {
      const { W, H, d } = D; if (snapped > 0) snapped -= dt;
      g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
      const sx0 = 26, sx1 = W - 76, sy = H * .44, peg = [W - 42, sy];
      const col = snapped > 0 || t > .82 ? COL.rojo : t < .15 ? '#8a8780' : COL.tension;
      if (snapped > 0) {
        const k = 1 - snapped / 1.3; g.strokeStyle = COL.rojo; g.lineWidth = 3;
        g.beginPath(); g.moveTo(sx0, sy); g.quadraticCurveTo(sx0 + 90, sy + 10 + k * 40, sx0 + 70 + k * 20, sy + 70 + k * 40); g.stroke();
        g.beginPath(); g.moveTo(sx1, sy); g.quadraticCurveTo(sx1 - 90, sy + 10 + k * 40, sx1 - 70 - k * 20, sy + 70 + k * 40); g.stroke();
      } else {
        ph += dt * (30 + t * 70); amp *= Math.exp(-dt * 2.4);
        g.strokeStyle = col; g.lineWidth = 3 + (1 - t) * 3; g.lineCap = 'round'; g.beginPath();
        for (let i = 0; i <= 60; i++) { const u = i / 60, x = lerp(sx0, sx1, u), y = sy + Math.sin(Math.PI * u) * ((1 - t) * H * .3 + amp * Math.cos(ph)); i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.2; g.setLineDash([3, 6]); g.stroke(); g.setLineDash([]);
      }
      g.fillStyle = COL.tinta; g.beginPath(); g.arc(sx0, sy, 7, 0, 7); g.fill();
      g.save(); g.translate(peg[0], peg[1]); g.rotate(t * 9); g.fillStyle = COL.tinta; g.beginPath(); g.ellipse(0, 0, 26, 13, 0, 0, 7); g.fill(); g.fillStyle = COL.revelacion; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill(); g.restore();
      g.font = '700 15px "Big Shoulders", sans-serif'; g.fillStyle = COL.tinta; g.textAlign = 'center'; g.fillText('CLAVIJA ↕', peg[0] - 4, peg[1] + 44);
      const ry = H - 30, rx0 = 26, rx1 = W - 26; g.strokeStyle = COL.tinta; g.lineWidth = 2; g.beginPath(); g.moveTo(rx0, ry); g.lineTo(rx1, ry); g.stroke();
      g.fillStyle = 'rgba(225,154,0,.55)'; g.fillRect(lerp(rx0, rx1, .35), ry - 9, lerp(rx0, rx1, .82) - lerp(rx0, rx1, .35), 9);
      g.fillStyle = COL.tinta; g.beginPath(); g.arc(lerp(rx0, rx1, t), ry, 7, 0, 7); g.fill();
      g.font = '600 13px "Big Shoulders", sans-serif'; g.textAlign = 'left'; g.fillText('FLOJA', rx0, ry + 20); g.textAlign = 'right'; g.fillText('TENSA', rx1, ry + 20); g.textAlign = 'center'; g.fillText('JUSTA', lerp(rx0, rx1, .58), ry + 20);
    });
  })();

  /* ============ 4 · Juego 2 · El giro · la rueda de áreas (emprendimientos) ============ */
  (function rueda() {
    const cv = $('#ruedaCv'); if (!cv) return;
    const g = cv.getContext('2d'), btns = $$('.category-list button'), res = $('#ruedaRes');
    const N = btns.length, paso = Math.PI * 2 / N, colores = [COL.giro, COL.tinta, COL.oculto, COL.tension, COL.pista, COL.equilibrio, COL.revelacion];
    let ang = 0, vel = 0, drag = false, lastA = 0, lastT = 0, D = fitCanvas(cv), girando = false, tick = -1, objetivo = null;
    const idxEn = a => { let k = Math.round(((-Math.PI / 2 - a - paso / 2) / paso) % N); return ((k % N) + N) % N; };
    function elegir(i, desdeRueda) {
      const b = btns[i]; if (!b) return;
      if (desdeRueda) { b.click(); res.innerHTML = 'Quedó bajo la aguja: <b>' + b.firstChild.textContent.trim() + '</b>'; buzz(12); }
    }
    function aCentro(i) { const a = -Math.PI / 2 - paso / 2 - i * paso; let k = Math.round((ang - a) / (Math.PI * 2)); return a + k * Math.PI * 2; }
    btns.forEach((b, i) => b.addEventListener('click', e => { if (e.isTrusted) { objetivo = aCentro(i); vel = 0; } }));
    addEventListener('resize', () => D = fitCanvas(cv));
    const angPtr = e => { const r = cv.getBoundingClientRect(); return Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2); };
    cv.addEventListener('pointerdown', e => { drag = true; objetivo = null; lastA = angPtr(e); lastT = performance.now(); vel = 0; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (!drag) return; const a = angPtr(e); let da = a - lastA; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; ang += da; const now = performance.now(); vel = da / Math.max(.008, (now - lastT) / 1000); lastA = a; lastT = now; });
    const up = () => { if (!drag) return; drag = false; vel = clamp(vel, -18, 18); if (Math.abs(vel) > .6) girando = true; else elegir(idxEn(ang), true); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    $('#ruedaGirar').addEventListener('click', () => { objetivo = null; vel = 9 + Math.random() * 7; girando = true; });
    loop(cv, dt => {
      if (!drag) {
        if (objetivo != null) { ang = lerp(ang, objetivo, Math.min(1, dt * 7)); if (Math.abs(ang - objetivo) < .002) { ang = objetivo; objetivo = null; } }
        else if (girando) { ang += vel * dt; vel *= Math.exp(-dt * 1.1); if (Math.abs(vel) < .25) { girando = false; const i = idxEn(ang); objetivo = aCentro(i); elegir(i, true); } }
      }
      const i = idxEn(ang); if (i !== tick) { if (tick >= 0 && (girando || drag)) { buzz(3); } tick = i; }
      const { W, H, d } = D, R = Math.min(W, H) / 2 - 8, cx = W / 2, cy = H / 2;
      g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
      g.save(); g.translate(cx, cy); g.rotate(ang);
      for (let k = 0; k < N; k++) {
        const a0 = k * paso, a1 = a0 + paso, on = k === i;
        g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, a0, a1); g.closePath(); g.fillStyle = on ? COL.revelacion : colores[k % colores.length]; g.fill();
        g.strokeStyle = COL.papel; g.lineWidth = 2; g.stroke();
        g.save(); g.rotate(a0 + paso / 2); g.fillStyle = on ? COL.tinta : COL.papel; g.font = '700 ' + Math.round(R * .085) + 'px "Big Shoulders", sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle';
        g.fillText(btns[k].firstChild.textContent.trim().toUpperCase().slice(0, 18), R - 14, 0); g.restore();
      }
      // puntada espiga en el borde
      g.strokeStyle = COL.papel; g.lineWidth = 2; for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2, s = k % 2 ? 1 : -1; g.beginPath(); g.moveTo(Math.cos(a) * (R - 5 + s * 3), Math.sin(a) * (R - 5 + s * 3)); g.lineTo(Math.cos(a + .08) * (R - 5 - s * 3), Math.sin(a + .08) * (R - 5 - s * 3)); g.stroke(); }
      g.restore();
      g.fillStyle = COL.papel; g.beginPath(); g.arc(cx, cy, R * .2, 0, 7); g.fill(); g.strokeStyle = COL.tinta; g.lineWidth = 3; g.stroke();
      g.strokeStyle = COL.giro; g.lineWidth = 4; g.beginPath(); for (let k = 0; k <= 80; k++) { const a = k / 80 * 9.42 + ang, r = k / 80 * R * .16; k ? g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : g.moveTo(cx, cy); } g.stroke();
    });
  })();

  /* ============ 5 · La pista · el mapa se cose y cada espacio se abre en 3D ============ */
  const ESPACIOS = {
    ingreso: ['espacios/portal.html', 'Portal de ingreso', '01 · Lo oculto'],
    bienvenida: ['espacios/ingreso.html', 'Bienvenida', '02 · La tensión'],
    expositores: ['espacios/stands.html', 'Expositores', '03 · El giro'],
    pista: ['espacios/calesita.html', 'Calesita', '04 · La pista'],
    charlas: ['espacios/charlas.html', 'Charlas y streaming', '05 · El equilibrio'],
    escenario: ['espacios/anfiteatro.html', 'Anfiteatro', '06 · La revelación']
  };
  const ZONAS = Object.keys(ESPACIOS);
  const dlg = $('#bf3d'), frame = $('#bf3dFrame'); let actual = 0;
  function abrir3D(i) {
    actual = (i + ZONAS.length) % ZONAS.length; const z = ESPACIOS[ZONAS[actual]];
    $('#bf3dTitulo').textContent = z[1]; $('#bf3dSub').textContent = z[2]; frame.src = z[0] + '?embed=1';
    if (!dlg.open) { dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', ''); }
    coser(ZONAS[actual], true);
  }
  function cerrar3D() { frame.src = 'about:blank'; dlg.close ? dlg.close() : dlg.removeAttribute('open'); }
  $('#bf3dClose').addEventListener('click', cerrar3D);
  dlg.addEventListener('close', () => { frame.src = 'about:blank'; });
  $('#bf3dPrev').addEventListener('click', () => abrir3D(actual - 1));
  $('#bf3dNext').addEventListener('click', () => abrir3D(actual + 1));
  window.BFabrir3D = abrir3D;
  // experiencias: cada tarjeta entra a su espacio
  $$('.experience-card').forEach((c, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'bf-entrar3d'; b.innerHTML = 'Entrar en 3D <span aria-hidden="true">↗</span>';
    b.setAttribute('aria-label', 'Entrar en 3D: ' + ($('h3', c) || {}).textContent); b.addEventListener('click', () => abrir3D(i)); c.appendChild(b);
  });
  // mapa: hilo cosido entre los puntos visitados
  const canvasMapa = $('.map-canvas');
  let cosidos = store.get('bf-cosidos', []);
  const svgNS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'bf-costura'); svg.setAttribute('aria-hidden', 'true'); canvasMapa.insertBefore(svg, canvasMapa.querySelector('.map-pin'));
  const contador = document.createElement('span'); contador.className = 'bf-contador';
  $('.map-image-footer').prepend(contador);
  const detalle = $('.map-detail'), b3d = document.createElement('button'); b3d.type = 'button'; b3d.className = 'bf-btn bf-map3d'; b3d.innerHTML = 'Entrar al espacio en 3D ↗';
  $('#map-description').after(b3d);
  let zonaActual = 'ingreso';
  b3d.addEventListener('click', () => abrir3D(ZONAS.indexOf(zonaActual)));
  function punto(z) { const p = $('.map-pin[data-zone="' + z + '"]'), r = canvasMapa.getBoundingClientRect(), q = p.getBoundingClientRect(); return [q.left + q.width / 2 - r.left, q.top + q.height / 2 - r.top]; }
  function dibujarCostura(animar) {
    const r = canvasMapa.getBoundingClientRect(); svg.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height); svg.innerHTML = '';
    $$('.map-pin').forEach(p => p.classList.toggle('bf-cosido', cosidos.includes(p.dataset.zone)));
    contador.innerHTML = '<b>' + cosidos.length + '</b> / 6 espacios cosidos';
    for (let k = 1; k < cosidos.length; k++) {
      const a = punto(cosidos[k - 1]), b = punto(cosidos[k]), mx = (a[0] + b[0]) / 2 + (b[1] - a[1]) * .18, my = (a[1] + b[1]) / 2 - (b[0] - a[0]) * .18;
      const d = 'M' + a.join(' ') + ' Q' + mx + ' ' + my + ' ' + b.join(' ');
      const hilo = document.createElementNS(svgNS, 'path'); hilo.setAttribute('d', d); hilo.setAttribute('class', 'h'); svg.appendChild(hilo);
      const punt = document.createElementNS(svgNS, 'path'); punt.setAttribute('d', d); punt.setAttribute('class', 'p'); svg.appendChild(punt);
      if (animar && k === cosidos.length - 1 && !reduce) { const L = hilo.getTotalLength(); [hilo, punt].forEach(el => { el.style.strokeDasharray = el === hilo ? L : '7 6'; }); hilo.style.strokeDashoffset = L; punt.style.opacity = 0; requestAnimationFrame(() => { hilo.style.transition = 'stroke-dashoffset .9s cubic-bezier(.6,0,.2,1)'; hilo.style.strokeDashoffset = 0; setTimeout(() => { punt.style.transition = 'opacity .4s'; punt.style.opacity = 1; }, 800); }); }
    }
  }
  function coser(z, silencioso) {
    zonaActual = z;
    if (cosidos.includes(z)) return;
    cosidos.push(z); store.set('bf-cosidos', cosidos); dibujarCostura(true);
    if (!silencioso) { buzz(12); }
    if (cosidos.length === 6) toast('Cosiste el recorrido completo: los seis espacios quedaron unidos por el hilo.');
  }
  $$('[data-zone]').forEach(b => b.addEventListener('click', () => coser(b.dataset.zone)));
  addEventListener('resize', () => dibujarCostura(false));
  ($('.map-canvas img').complete ? Promise.resolve() : new Promise(r => $('.map-canvas img').addEventListener('load', r, { once: true }))).then(() => dibujarCostura(false));
  if (!cosidos.length) { cosidos = []; }
  // fondo de La pista: el merch detrás de la chapa perforada
  (function chapa() {
    const s = $('#mapa'), MERCH = ['tote', 'taza', 'yoyo', 'pines', 'stickers', 'kit', 'pulsera', 'cuponera', 'senalador', 'postal', 'sopa', 'staff', 'artistas', 'talleristas', 'guias', 'expositores'];
    const wrap = document.createElement('div'); wrap.className = 'bf-chapa-wrap'; wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<div class="bf-merch">' + MERCH.concat(MERCH.slice(0, 8)).map(m => '<img src="assets/merch/' + m + '.jpg" alt="" loading="lazy">').join('') + '</div><div class="bf-chapa"></div>';
    s.prepend(wrap);
    s.addEventListener('pointermove', e => { const r = s.getBoundingClientRect(); wrap.style.setProperty('--mx', (e.clientX - r.left) + 'px'); wrap.style.setProperty('--my', (e.clientY - r.top) + 'px'); wrap.classList.add('on'); });
    s.addEventListener('pointerleave', () => wrap.classList.remove('on'));
  })();

  /* ============ 6 · Juego 3 · La revelación · coser el afiche → preventa → talón ============ */
  (function revela() {
    const sp = $('#sp'); if (!sp) return;
    const status = $('#spStatus'), solveBtn = $('#spSolve'), ent = $('#entrada'), stub = $('#stub'), msg = $('#eMsg'), hint = $('#eHint');
    const N = 3; let cells = [...Array(N * N).keys()], resuelto = store.get('bf-preventa', 0) >= 1, cortado = store.get('bf-preventa', 0) >= 2, movs = 0;
    const tiles = [];
    for (let k = 0; k < N * N - 1; k++) { const t = document.createElement('button'); t.type = 'button'; t.className = 'bf-tile'; t.style.backgroundPosition = (k % N) * 50 + '% ' + Math.floor(k / N) * 50 + '%'; t.setAttribute('aria-label', 'Cuadro ' + (k + 1)); t.addEventListener('click', () => mover(k)); sp.appendChild(t); tiles.push(t); }
    const hueco = () => cells.indexOf(N * N - 1);
    function vecinos(i) { const r = Math.floor(i / N), c = i % N, v = []; if (r > 0) v.push(i - N); if (r < N - 1) v.push(i + N); if (c > 0) v.push(i - 1); if (c < N - 1) v.push(i + 1); return v; }
    function layout() { cells.forEach((tile, pos) => { if (tile === N * N - 1) return; tiles[tile].style.transform = 'translate(' + (pos % N) * 100 + '%,' + Math.floor(pos / N) * 100 + '%)'; }); }
    function mezclar() { let h = hueco(), prev = -1; for (let k = 0; k < 60; k++) { const v = vecinos(h).filter(x => x !== prev); const n = v[Math.floor(Math.random() * v.length)]; [cells[h], cells[n]] = [cells[n], cells[h]]; prev = h; h = n; } if (cells.every((c, i) => c === i)) mezclar(); }
    function mover(tile) {
      if (resuelto) return; const pos = cells.indexOf(tile), h = hueco();
      if (!vecinos(h).includes(pos)) { tiles[tile].animate && !reduce && tiles[tile].animate([{ translate: '0 0' }, { translate: '3px 0' }, { translate: '-3px 0' }, { translate: '0 0' }], 200); return; }
      [cells[h], cells[pos]] = [cells[pos], cells[h]]; movs++; layout(); buzz(5);
      status.textContent = movs + ' puntadas'; if (cells.every((c, i) => c === i)) ganar();
    }
    function ganar() {
      resuelto = true; sp.classList.add('cosido'); status.textContent = 'Cosido. La imagen se revela.'; solveBtn.hidden = true;
      if (!cortado) { store.set('bf-preventa', 1); ent.classList.remove('locked'); stub.setAttribute('aria-disabled', 'false'); hint.textContent = 'Arrastrá el talón (o tocalo) para cortarlo por el troquel.'; toast('Afiche cosido: el talón de tu entrada quedó liberado.'); buzz([20, 40, 20]); }
    }
    solveBtn.addEventListener('click', () => {
      if (resuelto) return; // se cose de a una puntada, para que se vea
      const path = []; const target = [...Array(N * N).keys()];
      cells = target.slice(); layout(); ganar();
    });
    function cortar() {
      if (cortado || !resuelto) return; cortado = true; store.set('bf-preventa', 2);
      ent.classList.add('cortada'); msg.hidden = false; hint.hidden = true; buzz([30, 20, 60]); toast('Estás en la preventa.');
    }
    let sx = null, dx = 0;
    stub.addEventListener('pointerdown', e => { if (!resuelto || cortado) return; sx = e.clientX; stub.setPointerCapture(e.pointerId); });
    stub.addEventListener('pointermove', e => { if (sx == null) return; dx = Math.max(0, e.clientX - sx); stub.style.transform = 'translateX(' + dx + 'px) rotate(' + dx * .08 + 'deg)'; if (dx > 70) { sx = null; stub.style.transform = ''; cortar(); } });
    const up = () => { if (sx != null && dx < 8) cortar(); sx = null; dx = 0; if (!cortado) stub.style.transform = ''; };
    stub.addEventListener('pointerup', up); stub.addEventListener('pointercancel', up);
    stub.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cortar(); } });
    if (resuelto) { layout(); ganar(); if (cortado) { ent.classList.add('cortada'); msg.hidden = false; hint.hidden = true; } }
    else { mezclar(); layout(); status.textContent = 'Mové los cuadros al hueco.'; }
  })();

  // volver a ver la puerta desde el pie de página
  const pie = $('.footer-top'); if (pie) { const b = document.createElement('button'); b.type = 'button'; b.className = 'bf-btn ghost bf-repuerta'; b.textContent = 'Volver a cerrar las capas ↑'; b.addEventListener('click', () => BF.cerrarPuerta && BF.cerrarPuerta()); pie.appendChild(b); }
})();
