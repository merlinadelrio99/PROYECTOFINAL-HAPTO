/* Bioferia app · Hecho y cosido (idea innovadora)
   Traés plásticos de tu casa y los entregás. Si te alcanza, elegís un personaje en la app, lo cazás con la cámara
   (AR simulada) y se imprime en 3D con ese plástico. Lo que sobra ayuda a otro; si te falta, alguien dejó de más.
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
  const IMPRESION_DEMO = 20; const GRAMOS = 60; // plástico que lleva un personaje // segundos (en el evento: menos de una hora)

  const KEY = 'bioferia-hecho-v2';
  const H = (function () { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && 'char' in s) return s; } catch (e) { } return { gramos: 0, banco: 340, ayuda: 0, elegido: null, char: null, pieces: 4, sentAt: 0, color: null, code: null, retirado: false, avisado: false }; })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) { } };
  const pj = () => PJ.find(p => p.id === H.char);
  function fase() {
    if (!H.gramos && !H.elegido) return 'traer';
    if (!H.elegido) return 'elegir';
    if (!H.char) return 'cazar';
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
    const F = fase(), p = pj() || PJ.find(x => x.id === H.elegido);
    let estado = '';
    if (F === 'traer') {
      estado = '<div class="hc-card hc-vacio"><div class="hc-silueta" aria-hidden="true">♻</div><div><p class="eyebrow">TODAVÍA NO ENTREGASTE PLÁSTICOS</p><h2>Traé tus plásticos de casa.</h2><p>Tapitas, botellas, envases: dejalos en el punto de entrega. Se pesan y se suman acá.</p></div>' +
        '<button class="primary blue" data-hc="entregar"><span>Entregar plásticos</span><span aria-hidden="true">↗</span></button><small class="hc-sim">Simulado: en el evento se escanea tu QR en el punto de entrega.</small></div>';
    } else if (F === 'elegir') {
      const alcanza = H.gramos >= GRAMOS, sobra = H.gramos - GRAMOS;
      estado = '<div class="hc-card hc-plastico"><p class="eyebrow">ENTREGASTE ' + H.gramos + ' g DE PLÁSTICO</p>' +
        '<div class="hc-bar"><i style="width:' + Math.min(100, H.gramos / GRAMOS * 100) + '%"></i></div>' +
        (alcanza ? '<h2>¡Te alcanza para un personaje!</h2><p>' + (sobra > 0 ? 'Te sobran <b>' + sobra + ' g</b>: quedan en el banco común para alguien al que le falte.' : 'Justo lo que hacía falta.') + '</p>'
                 : '<h2>Te faltan ' + (GRAMOS - H.gramos) + ' g, pero no pasa nada.</h2><p>Alguien dejó de más: el <b>banco común</b> completa lo que falta.</p>') +
        '<p class="hc-banco">Banco común de plástico: <b>' + H.banco + ' g</b></p><p class="hc-next"><b>Elegí tu personaje</b> y salí a cazarlo.</p></div>' +
        '<div class="hc-coleccion hc-elegir">' + PJ.map(x => '<button class="hc-pj" data-hc-elegir="' + x.id + '" style="--pc:' + x.c + '"><span class="hc-pj-img"><img class="sin" src="hc/' + x.id + '-sin.webp" alt=""><img class="con" src="hc/' + x.id + '-con.webp" alt=""></span><strong>' + x.name + '</strong><small>' + x.sub + '</small></button>').join('') + '</div>';
    } else {
      let accion = '';
      if (F === 'cazar') accion = '<p class="hc-next">Elegiste a <b>' + p.name + '</b>. Está escondido en algún lugar del predio: encontralo con la cámara.</p><button class="primary blue" data-hc="cam"><span>Cazar con la cámara</span><span aria-hidden="true">↗</span></button><button class="text-button" data-hc="cambiar">Elegir otro</button>';
      if (F === 'imprimiendo') accion = '<div class="hc-print"><p><b>Imprimiendo en el stand</b> · con el plástico que entregaste</p><div class="hc-bar"><i style="width:' + Math.min(100, (Date.now() - H.sentAt) / 10 / IMPRESION_DEMO) + '%"></i></div><small>En el evento tarda menos de una hora. Te avisamos con una notificación.</small></div>';
      if (F === 'impreso') accion = '<div class="hc-ready"><p class="eyebrow">YA ESTÁ IMPRESO</p><p>Retiralo en el <b>stand de impresión</b> mostrando este código:</p><div class="hc-code">' + H.code + '</div><button class="primary blue" data-hc="retirar"><span>Ya lo retiré</span><span aria-hidden="true">✓</span></button></div>';
      if (F === 'retirado') accion = '<div class="hc-ready"><p class="eyebrow">RETIRADO</p><p>' + (H.ayuda > 0 ? 'Y tus ' + H.ayuda + ' g de más ya están ayudando a otra persona.' : 'Lo que iba a descartarse vuelve como algo propio.') + '</p><button class="primary" data-hc="otro"><span>Traer más plásticos</span><span aria-hidden="true">↗</span></button></div>';
      const impreso = F === 'impreso' || F === 'retirado';
      estado = '<div class="hc-card hc-mio" style="--pc:' + p.c + '">' + muneco(p, F === 'cazar' ? 0 : 4, impreso ? { impreso: true, color: H.color } : {}) +
        '<div class="hc-info"><p class="eyebrow">' + (F === 'cazar' ? 'ELEGISTE' : 'TU PERSONAJE') + ' · ' + p.sub.toUpperCase() + '</p><h2>' + p.name + '</h2><p>' + p.txt + '</p>' +
        (impreso ? '<p class="hc-fil"><i style="background:' + H.color + '"></i>Color del plástico que entregaste</p>' : '') + '</div>' + accion + '</div>';
    }
    const pasos = [['Traer', 'Juntá plásticos en tu casa y traelos a Bioferia.'], ['Entregar', 'Los dejás en el punto de entrega. Se pesan y se suman a tu cuenta en la app.'], ['Elegir', 'Si te alcanza para un personaje, lo elegís desde la app. Si te falta, el banco común completa con lo que otros dejaron de más.'], ['Cazar', 'Encontrás a tu personaje por el predio con la cámara y lo atrapás.'], ['Retirar', 'Se imprime en 3D con ese plástico y lo retirás en el stand. Si te sobró, ayudaste a alguien más.']];
    const activo = { traer: 0, elegir: 2, cazar: 3, imprimiendo: 4, impreso: 4, retirado: 5 }[F];
    return '<section class="app-hero hc-hero"><p class="eyebrow">HECHO Y COSIDO</p><h1>Traelo,<br>cazalo,<br>llevátelo.</h1><p>Traés tus plásticos de casa y los entregás. Si te alcanza, elegís un personaje, lo cazás con realidad aumentada y se imprime en 3D. Si te sobra, ayudás a alguien al que le falta; si te falta, seguro alguien dejó de más.</p></section>' +
      '<section class="page-body">' + estado +
      '<div class="section-head"><h2>Cómo funciona</h2></div><ol class="hc-pasos">' + pasos.map((s, i) => '<li class="' + (i < activo ? 'hecho' : i === activo ? 'ahora' : '') + '"><b>' + (i + 1) + '</b><div><strong>' + s[0] + '</strong><p>' + s[1] + '</p></div></li>').join('') + '</ol>' +
      '<div class="section-head"><h2>La colección</h2></div><p class="hc-lead">Seis personajes, uno por subconcepto. Mismo estilo de cuerpo; cada uno lleva el símbolo de su subconcepto en la pose y en la ropa.</p>' +
      '<div class="hc-coleccion">' + PJ.map(x => '<button class="hc-pj' + (x.id === H.char ? ' mio' : '') + '" data-hc-ver="' + x.id + '" style="--pc:' + x.c + '"><span class="hc-pj-img"><img class="sin" src="hc/' + x.id + '-sin.webp" alt=""><img class="con" src="hc/' + x.id + '-con.webp" alt=""></span><strong>' + x.name + '</strong><small>' + x.sub + '</small></button>').join('') + '</div>' +
      '<div class="hc-pj-detalle" hidden></div>' +
      '<div class="section-head"><h2>El plástico</h2></div><div class="hc-facts"><div><strong>Si te sobra, ayudás</strong><p>Lo que entregás de más queda en el banco común para alguien al que no le alcanza.</p></div><div><strong>Si te falta, te ayudan</strong><p>Seguro alguien dejó de más: el banco completa lo que falta para tu personaje.</p></div><div><strong>Una sola pieza, 5 a 7 cm</strong><p>Todo el muñeco en un bloque compacto, para que la impresión tarde menos de una hora.</p></div></div>' +
      '<button class="text-button" data-hc="reset">Reiniciar Hecho y cosido</button></section>';
  };

  /* ---------- cámara simulada ---------- */
  let objetivo = null; // {tipo:'pj'|'pieza', p, pieza, lugar}
  screens.hcCam = function () {
    const F = fase();
    if (F !== 'cazar') return screens.hecho();
    if (!objetivo || objetivo.fase !== F + H.elegido) {
      const lugar = LUGARES[Math.floor(Math.random() * LUGARES.length)];
      objetivo = { tipo: 'pj', p: PJ.find(x => x.id === H.elegido), lugar, fase: F + H.elegido };
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
      H.char = o.p.id; H.sentAt = Date.now(); H.color = FILAMENTO[Math.floor(Math.random() * FILAMENTO.length)]; H.code = 'HC-' + String(Math.floor(1000 + Math.random() * 9000)); H.retirado = false; H.avisado = false; msg.textContent = '¡Atrapaste a ' + o.p.name + '! Ya se está imprimiendo.';
      save(); objetivo = null;
      setTimeout(() => { removeEventListener('deviceorientation', ori); go('hecho'); const m = $q('.hc-mio .hc-muneco'); if (m) { m.classList.add('nuevo'); } toast(o.p.name + ' es tuyo. Se está imprimiendo con tu plástico.'); }, reduce ? 200 : 1100);
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
    doc.querySelectorAll('[data-hc-elegir]').forEach(b => b.addEventListener('click', () => { H.elegido = b.dataset.hcElegir; save(); toast('Elegiste a ' + PJ.find(x => x.id === H.elegido).name + '. ¡A cazarlo!'); render(); }));
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
    if (a === 'entregar') { H.gramos = 30 + Math.floor(Math.random() * 9) * 10; if (H.gramos >= GRAMOS) { H.ayuda = H.gramos - GRAMOS; H.banco += H.ayuda; } else { H.ayuda = 0; H.banco = Math.max(0, H.banco - (GRAMOS - H.gramos)); } save(); toast(H.gramos >= GRAMOS ? 'Entregaste ' + H.gramos + ' g. ¡Te alcanza!' : 'Entregaste ' + H.gramos + ' g. El banco común completa el resto.'); buzz(20); render(); }
    if (a === 'cambiar') { H.elegido = null; save(); render(); }
    if (a === 'print') { H.sentAt = Date.now(); H.color = FILAMENTO[Math.floor(Math.random() * FILAMENTO.length)]; H.code = 'HC-' + String(Math.floor(1000 + Math.random() * 9000)); H.avisado = false; save(); toast('Enviado al stand de impresión.'); render(); }
    if (a === 'retirar') { H.retirado = true; save(); render(); }
    if (a === 'otro' || a === 'reset') { Object.assign(H, { gramos: 0, ayuda: 0, elegido: null, char: null, sentAt: 0, color: null, code: null, retirado: false, avisado: false }); save(); render(); }
  }, true);
})();
