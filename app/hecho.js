/* Bioferia app · Hecho y cosido (idea innovadora)
   Cazar un personaje con la cámara (AR simulada), vestirlo con los objetos que aparecen por el predio,
   enviarlo a imprimir en 3D con plástico sobrante y retirarlo en el stand de impresión.
   Textos de personajes y del funcionamiento: documento "Idea innovadora: los personajes de Bio Feria". */
(function () {
  const doc = document, $q = s => doc.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } }

  const PJ = [
    { id: 'tapita', name: 'Tapita', sub: 'Lo oculto', c: '#003B94', txt: 'No todo lo que importa se ve a primera vista. Tapita guarda lo suyo hasta que alguien se toma el tiempo de mirar.' },
    { id: 'tironcito', name: 'Tironcito', sub: 'La tensión', c: '#A330B6', txt: 'Tironcito sabe que sin tensión nada se sostiene, pero que si tirás de más, se corta. Busca el punto justo.' },
    { id: 'vueltita', name: 'Vueltita', sub: 'El giro', c: '#C15F2B', txt: 'Vueltita ve el mundo del otro lado. Cuando todo parece igual, le da una vuelta y aparece otra forma de verlo.' },
    { id: 'pistin', name: 'Pistín', sub: 'La pista', c: '#028EA5', txt: 'Pistín no se pierde: cada paso deja una marca para el que viene detrás.' },
    { id: 'justito', name: 'Justito', sub: 'El equilibrio', c: '#C2186B', txt: 'Justito no se pasa ni se queda corto. Es el que mejor entiende el "ni muy muy ni tan tan".' },
    { id: 'lucecita', name: 'Lucecita', sub: 'La revelación', c: '#E19A00', txt: 'Lucecita tardó en salir, pero cuando lo hizo, se mostró entera.' }
  ];
  const PIEZAS = [
    { n: 'Zapatos', f: .2, ico: '<path d="M4 15h9l3 2h4v2H4z" /><path d="M6 15V9h5l2 6" />' },
    { n: 'Parte de abajo', f: .48, ico: '<path d="M7 4h10l1 16h-4l-2-9-2 9H6z" />' },
    { n: 'Parte de arriba', f: .78, ico: '<path d="M8 4l-4 3 2 4 2-1v10h8V10l2 1 2-4-4-3c-1 2-3 2-4 2s-3 0-4-2z" />' },
    { n: 'El extra', f: 1, ico: '<path d="M12 3l2.6 5.6 6 .7-4.5 4 1.3 6L12 16.4 6.6 19.3l1.3-6-4.5-4 6-.7z" />' }
  ];
  const LUGARES = [
    { img: 'hc/lugar-portal.webp', n: 'Portal de ingreso' }, { img: 'hc/lugar-bienvenida.webp', n: 'Bienvenida' },
    { img: 'hc/lugar-expositores.webp', n: 'Expositores' }, { img: 'hc/lugar-pista.webp', n: 'Calesita' },
    { img: 'hc/lugar-charlas.webp', n: 'Charlas y streaming' }, { img: 'hc/lugar-escenario.webp', n: 'Anfiteatro' }
  ];
  const FILAMENTO = ['#5B7FA6', '#C15F2B', '#3F7F63', '#8159A8', '#C99A1E', '#8E8A84', '#B5475E', '#2C7486'];
  const IMPRESION_DEMO = 20; // segundos (en el evento: menos de una hora)

  const KEY = 'bioferia-hecho-v1';
  const H = (function () { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && 'char' in s) return s; } catch (e) { } return { char: null, pieces: 0, sentAt: 0, color: null, code: null, retirado: false, avisado: false }; })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) { } };
  const pj = () => PJ.find(p => p.id === H.char);
  function fase() {
    if (!H.char) return 'cazar';
    if (H.pieces < 4) return 'buscar';
    if (!H.sentAt) return 'completo';
    if (H.retirado) return 'retirado';
    return (Date.now() - H.sentAt) / 1000 < IMPRESION_DEMO ? 'imprimiendo' : 'impreso';
  }
  function toast(m) { const t = $q('.jg-toast'); if (!t) return; t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3600); }

  /* ---------- el muñeco: se viste de abajo hacia arriba ---------- */
  function muneco(p, piezas, opts) {
    opts = opts || {};
    const f = piezas ? PIEZAS[piezas - 1].f : 0;
    return '<div class="hc-muneco' + (opts.impreso ? ' impreso' : '') + '" style="--pc:' + p.c + ';--rev:' + (100 - f * 100) + '%' + (opts.color ? ';--fil:' + opts.color + ';--m:url(hc/' + p.id + '-con.webp)' : '') + '">' +
      '<img class="sin" src="hc/' + p.id + '-sin.webp" alt="' + p.name + (piezas ? ', vestido con ' + piezas + ' de 4 objetos' : ', sin vestir') + '">' +
      '<img class="con" src="hc/' + p.id + '-con.webp" alt="" aria-hidden="true">' +
      '<span class="piso" aria-hidden="true"></span></div>';
  }
  const ico = p => '<svg viewBox="0 0 24 24" aria-hidden="true">' + p.ico + '</svg>';

  /* ---------- pantalla principal ---------- */
  screens.hecho = function () {
    const F = fase(), p = pj();
    let estado = '';
    if (F === 'cazar') {
      estado = '<div class="hc-card hc-vacio"><div class="hc-silueta" aria-hidden="true">?</div><div><p class="eyebrow">TODAVÍA NO TENÉS PERSONAJE</p><h2>Al recorrer el evento, aparece un personaje.</h2><p>Atrapalo desde la app y pasa a ser tuyo.</p></div>' +
        '<button class="primary blue" data-hc="cam"><span>Abrir la cámara</span><span aria-hidden="true">↗</span></button></div>';
    } else {
      const piezas = PIEZAS.map((x, i) => '<li class="' + (i < H.pieces ? 'on' : '') + '">' + ico(x) + '<span>' + x.n + '</span></li>').join('');
      let accion = '';
      if (F === 'buscar') accion = '<p class="hc-next">Próximo objeto: <b>' + PIEZAS[H.pieces].n + '</b>. Aparecen al azar por todo el predio.</p><button class="primary blue" data-hc="cam"><span>Buscar con la cámara</span><span aria-hidden="true">↗</span></button>';
      if (F === 'completo') accion = '<p class="hc-next"><b>¡Está completo!</b> Ya está listo para enviar a imprimir.</p><button class="primary blue" data-hc="print"><span>Enviar a imprimir</span><span aria-hidden="true">↗</span></button>';
      if (F === 'imprimiendo') accion = '<div class="hc-print"><p><b>Imprimiendo en el stand</b> · filamento de plásticos e hilos sobrantes</p><div class="hc-bar"><i style="width:' + Math.min(100, (Date.now() - H.sentAt) / 10 / IMPRESION_DEMO) + '%"></i></div><small>En el evento tarda menos de una hora. Te avisamos con una notificación.</small></div>';
      if (F === 'impreso') accion = '<div class="hc-ready"><p class="eyebrow">YA ESTÁ IMPRESO</p><p>Retiralo en el <b>stand de impresión</b> mostrando este código:</p><div class="hc-code">' + H.code + '</div><button class="primary blue" data-hc="retirar"><span>Ya lo retiré</span><span aria-hidden="true">✓</span></button></div>';
      if (F === 'retirado') accion = '<div class="hc-ready"><p class="eyebrow">RETIRADO</p><p>Lo que iba a descartarse vuelve como algo propio.</p><button class="primary" data-hc="otro"><span>Cazar otro personaje</span><span aria-hidden="true">↗</span></button></div>';
      const impreso = F === 'impreso' || F === 'retirado';
      estado = '<div class="hc-card hc-mio" style="--pc:' + p.c + '">' + muneco(p, H.pieces, impreso ? { impreso: true, color: H.color } : {}) +
        '<div class="hc-info"><p class="eyebrow">TU PERSONAJE · ' + p.sub.toUpperCase() + '</p><h2>' + p.name + '</h2><p>' + p.txt + '</p>' +
        (impreso ? '<p class="hc-fil"><i style="background:' + H.color + '"></i>Color del filamento sobrante que había</p>' : '') + '</div>' + (impreso ? '' : '<ol class="hc-piezas" aria-label="' + H.pieces + ' de 4 objetos">' + piezas + '</ol>') + accion + '</div>';
    }
    const pasos = [['Cazar', 'Al recorrer el evento, aparece un personaje. Lo atrapás desde la app y pasa a ser tuyo.'], ['Buscar', 'Aparecen objetos al azar por todo el evento. A medida que los encontrás, el personaje se va vistiendo: zapatos, parte de abajo, parte de arriba y un extra.'], ['Completar', 'Al completar el personaje, ya está listo para enviar a imprimir.'], ['Retirar', 'Una notificación avisa cuando está impreso, y se retira en el stand de impresión.']];
    const n = pasos.findIndex((_, i) => i === ['cazar', 'buscar', 'completo', 'imprimiendo'].indexOf(F)), activo = F === 'impreso' || F === 'retirado' ? 3 : n;
    return '<section class="app-hero hc-hero"><p class="eyebrow">HECHO Y COSIDO</p><h1>Cazalo,<br>vestilo,<br>llevátelo.</h1><p>Recorrés el evento con realidad aumentada, cazás un personaje y lo vas vistiendo con los objetos que encontrás. Cuando está completo, te lo llevás impreso en 3D con plásticos sobrantes.</p></section>' +
      '<section class="page-body">' + estado +
      '<div class="section-head"><h2>Cómo funciona</h2></div><ol class="hc-pasos">' + pasos.map((s, i) => '<li class="' + (i < activo ? 'hecho' : i === activo ? 'ahora' : '') + '"><b>' + (i + 1) + '</b><div><strong>' + s[0] + '</strong><p>' + s[1] + '</p></div></li>').join('') + '</ol>' +
      '<div class="section-head"><h2>La colección</h2></div><p class="hc-lead">Seis personajes, uno por subconcepto. Mismo estilo de cuerpo; cada uno lleva el símbolo de su subconcepto en la pose y en la ropa.</p>' +
      '<div class="hc-coleccion">' + PJ.map(x => '<button class="hc-pj' + (x.id === H.char ? ' mio' : '') + '" data-hc-ver="' + x.id + '" style="--pc:' + x.c + '"><span class="hc-pj-img"><img class="sin" src="hc/' + x.id + '-sin.webp" alt=""><img class="con" src="hc/' + x.id + '-con.webp" alt=""></span><strong>' + x.name + '</strong><small>' + x.sub + '</small></button>').join('') + '</div>' +
      '<div class="hc-pj-detalle" hidden></div>' +
      '<div class="section-head"><h2>La impresión</h2></div><div class="hc-facts"><div><strong>Una sola pieza</strong><p>Todo el muñeco, ropa e hilos incluidos, se diseña como un solo bloque compacto, sin partes sueltas ni detalles finitos que se quiebren.</p></div><div><strong>El color no se elige</strong><p>Sale del filamento sobrante que haya. Ningún muñeco es igual a otro: lo que iba a descartarse vuelve como algo propio.</p></div><div><strong>5 a 7 cm</strong><p>Para que la impresión tarde menos de una hora.</p></div></div>' +
      '<button class="text-button" data-hc="reset">Reiniciar Hecho y cosido</button></section>';
  };

  /* ---------- cámara simulada ---------- */
  let objetivo = null; // {tipo:'pj'|'pieza', p, pieza, lugar}
  screens.hcCam = function () {
    const F = fase();
    if (F !== 'cazar' && F !== 'buscar') return screens.hecho();
    if (!objetivo || objetivo.fase !== F + H.pieces) {
      const lugar = LUGARES[Math.floor(Math.random() * LUGARES.length)];
      const pp = F === 'cazar' ? PJ[Math.floor(Math.random() * PJ.length)] : pj();
      objetivo = F === 'cazar' ? { tipo: 'pj', p: pp, lugar } : { tipo: 'pieza', p: pp, pieza: PIEZAS[H.pieces], lugar };
      objetivo.fase = F + H.pieces;
    }
    const lugar = objetivo.lugar, p = objetivo.p;
    const cosa = objetivo.tipo === 'pj' ? '<img src="hc/' + p.id + '-sin.webp" alt="' + p.name + '">' : '<span class="hc-obj" style="--pc:' + p.c + '">' + ico(objetivo.pieza) + '<em>' + objetivo.pieza.n + '</em></span>';
    return '<div class="hc-cam" style="--pc:' + p.c + '"><div class="hc-pan"><img class="hc-lugar" src="' + lugar.img + '" alt="Vista de la cámara: ' + lugar.n + '" draggable="false"><button class="hc-target" type="button" aria-label="Atrapar">' + cosa + '<i class="hc-sombra"></i></button></div>' +
      '<div class="hc-scan" aria-hidden="true"></div><div class="hc-reticula" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
      '<span class="hc-flecha izq" aria-hidden="true">‹</span><span class="hc-flecha der" aria-hidden="true">›</span>' +
      '<div class="hc-top"><button class="hc-back" data-go="hecho">← Hecho y cosido</button><span class="hc-badge">AR SIMULADA · ' + lugar.n.toUpperCase() + '</span></div>' +
      '<div class="hc-bottom"><p class="hc-msg" aria-live="polite">Buscando…</p><button class="hc-catch" type="button" disabled>' + (objetivo.tipo === 'pj' ? 'Atrapar' : 'Agarrar') + '</button><small>Mové el celular (o arrastrá la imagen) hasta que quede dentro del cuadro.</small></div></div>';
  };
  function mountCam() {
    const cam = $q('.hc-cam'); if (!cam || !objetivo) return;
    const pan = cam.querySelector('.hc-pan'), img = cam.querySelector('.hc-lugar'), tgt = cam.querySelector('.hc-target'), msg = cam.querySelector('.hc-msg'), btn = cam.querySelector('.hc-catch'), ret = cam.querySelector('.hc-reticula');
    const fl = cam.querySelector('.izq'), fr = cam.querySelector('.der');
    let W = 1, Hh = 1, IW = 1, x = 0, vx = 0, drag = null, tx = 0, ty = 0, visible = false, done = false, tilt = null;
    function size() { const r = cam.getBoundingClientRect(); W = r.width; Hh = r.height; IW = Math.max(W * 1.6, Hh * (img.naturalWidth / img.naturalHeight || 1.78)); img.style.width = IW + 'px'; pan.style.width = IW + 'px'; }
    function start() {
      size(); x = -(IW - W) / 2;
      tx = IW * (.12 + Math.random() * .76); ty = Hh * (.42 + Math.random() * .2);
      if (Math.abs(tx - (IW / 2)) < W * .5) tx = tx < IW / 2 ? IW / 2 - W * .7 : IW / 2 + W * .7; // que haya que buscarlo
      tx = Math.max(60, Math.min(IW - 60, tx));
      tgt.style.left = tx + 'px'; tgt.style.top = ty + 'px';
      setTimeout(() => { if (!cam.isConnected) return; visible = true; tgt.classList.add('on'); cam.classList.add('listo'); msg.textContent = objetivo.tipo === 'pj' ? '¡Apareció un personaje cerca!' : 'Hay un objeto cerca: ' + objetivo.pieza.n.toLowerCase(); buzz(20); }, reduce ? 50 : 1300);
    }
    img.complete && img.naturalWidth ? start() : img.addEventListener('load', start, { once: true });
    cam.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; drag = { x: e.clientX, x0: x }; vx = 0; cam.setPointerCapture(e.pointerId); });
    cam.addEventListener('pointermove', e => { if (!drag) return; const nx = drag.x0 + (e.clientX - drag.x); vx = nx - x; x = nx; });
    const up = () => drag = null; cam.addEventListener('pointerup', up); cam.addEventListener('pointercancel', up);
    function ori(e) { if (e.gamma == null) return; if (tilt == null) tilt = e.gamma; x = -(IW - W) / 2 - (e.gamma - tilt) * 14; }
    addEventListener('deviceorientation', ori);
    function catchIt() {
      if (done || !btn.classList.contains('cerca')) { if (!done) { msg.textContent = 'Acercalo al centro del cuadro.'; ret.classList.remove('nope'); void ret.offsetWidth; ret.classList.add('nope'); } return; }
      done = true; buzz([30, 40, 80]); tgt.classList.add('atrapado'); cam.classList.add('flash');
      const o = objetivo;
      if (o.tipo === 'pj') { H.char = o.p.id; H.pieces = 0; H.sentAt = 0; H.retirado = false; H.avisado = false; msg.textContent = '¡Atrapaste a ' + o.p.name + '! Ahora es tuyo.'; }
      else { H.pieces = Math.min(4, H.pieces + 1); msg.textContent = o.pieza.n + ': ' + o.p.name + ' ya lo tiene puesto.'; }
      save(); objetivo = null;
      setTimeout(() => { removeEventListener('deviceorientation', ori); go('hecho'); const m = $q('.hc-mio .hc-muneco'); if (m) { m.classList.add('nuevo'); } toast(o.tipo === 'pj' ? o.p.name + ' es tuyo. Ahora buscá los objetos para vestirlo.' : (H.pieces === 4 ? '¡' + o.p.name + ' está completo! Ya lo podés enviar a imprimir.' : 'Encontraste ' + o.pieza.n.toLowerCase() + '. Faltan ' + (4 - H.pieces) + '.')); }, reduce ? 200 : 1100);
    }
    tgt.addEventListener('click', catchIt); btn.addEventListener('click', catchIt);
    (function loop() {
      if (!cam.isConnected) { removeEventListener('deviceorientation', ori); return; }
      requestAnimationFrame(loop);
      if (!drag) { x += vx; vx *= .9; }
      x = Math.min(0, Math.max(W - IW, x)); pan.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      if (!visible || done) return;
      const sx = tx + x, d = Math.abs(sx - W / 2), cerca = d < W * .16;
      btn.disabled = false; btn.classList.toggle('cerca', cerca); ret.classList.toggle('cerca', cerca);
      fl.classList.toggle('on', sx < W * .08); fr.classList.toggle('on', sx > W * .92);
    })();
    addEventListener('resize', () => { if (cam.isConnected) { size(); } }, { once: true });
  }

  /* ---------- envolver render ---------- */
  const prev = render;
  render = function () {
    prev();
    const scr = state.screen;
    if (scr === 'hcCam') { $q('#app-content').classList.add('hc-mode'); mountCam(); } else $q('#app-content').classList.remove('hc-mode');
    if (scr === 'hecho') mountHecho();
  };
  let tick = null;
  function mountHecho() {
    clearInterval(tick);
    if (fase() === 'imprimiendo') tick = setInterval(() => { if (state.screen !== 'hecho') return; const bar = $q('.hc-bar i'); if (bar) bar.style.width = Math.min(100, (Date.now() - H.sentAt) / 10 / IMPRESION_DEMO) + '%'; if (fase() !== 'imprimiendo') { clearInterval(tick); render(); } }, 250);
    const det = $q('.hc-pj-detalle');
    doc.querySelectorAll('[data-hc-ver]').forEach(b => b.addEventListener('click', () => {
      const x = PJ.find(p => p.id === b.dataset.hcVer); det.hidden = false; det.style.setProperty('--pc', x.c);
      det.innerHTML = '<div class="hc-par"><figure><img src="hc/' + x.id + '-sin.webp" alt="' + x.name + ' sin vestir"><figcaption>Sin vestir</figcaption></figure><figure><img src="hc/' + x.id + '-con.webp" alt="' + x.name + ' vestido"><figcaption>Vestido</figcaption></figure></div><div><p class="eyebrow">' + x.sub.toUpperCase() + '</p><h3>' + x.name + '</h3><p>' + x.txt + '</p></div>';
      det.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    }));
  }
  // aviso de impresión aunque estés en otra pantalla
  setInterval(() => { if (H.sentAt && !H.avisado && fase() === 'impreso') { H.avisado = true; save(); const p = pj(); toast('🔔 ' + p.name + ' ya está impreso. Retiralo en el stand de impresión.'); buzz([60, 40, 60]); if (state.screen === 'hecho') render(); } }, 1000);

  doc.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !b.dataset.hc) return; e.stopImmediatePropagation();
    const a = b.dataset.hc;
    if (a === 'cam') go('hcCam');
    if (a === 'print') { H.sentAt = Date.now(); H.color = FILAMENTO[Math.floor(Math.random() * FILAMENTO.length)]; H.code = 'HC-' + String(Math.floor(1000 + Math.random() * 9000)); H.avisado = false; save(); toast('Enviado al stand de impresión.'); render(); }
    if (a === 'retirar') { H.retirado = true; save(); render(); }
    if (a === 'otro' || a === 'reset') { Object.assign(H, { char: null, pieces: 0, sentAt: 0, color: null, code: null, retirado: false, avisado: false }); save(); render(); }
  }, true);
})();
