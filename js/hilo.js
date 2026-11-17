/* running-stitch progress thread + countdown */
(function () {
  const box = document.getElementById('hilo'), base = document.getElementById('hiloBase'), live = document.getElementById('hiloLive');
  const knots = [...box.querySelectorAll('a')], secs = knots.map(a => document.querySelector(a.getAttribute('href')));
  let len = 1, vertical = true;
  function layout() {
    vertical = matchMedia('(min-width:900px)').matches;
    const W = box.clientWidth, H = box.clientHeight;
    let d;
    if (vertical) { d = 'M12 0'; for (let y = 0; y < H; y += 60) d += ' Q ' + (12 + ((y / 60) % 2 ? 7 : -7)) + ' ' + (y + 30) + ' 12 ' + Math.min(H, y + 60); }
    else { d = 'M0 7 L' + W + ' 7'; }
    base.setAttribute('d', d); live.setAttribute('d', d);
    len = live.getTotalLength(); live.style.strokeDasharray = len; update();
  }
  function update() {
    const max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? scrollY / max : 0;
    const span = vertical ? box.clientHeight : box.clientWidth;
    live.style.strokeDashoffset = len * (1 - p);
    let active = -1;
    knots.forEach((k, i) => {
      const s = secs[i]; if (!s) return;
      const f = BF.clamp(s.offsetTop / Math.max(1, max), 0, 1);
      if (vertical) { k.style.top = (f * span) + 'px'; k.style.left = '12px'; } else { k.style.left = (f * span) + 'px'; k.style.top = '7px'; }
      if (scrollY + innerHeight * .45 >= s.offsetTop) active = i;
    });
    knots.forEach((k, i) => k.classList.toggle('on', i === active));
  }
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', layout);
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  setTimeout(layout, 1200);
  window.BF.relayoutHilo = layout;

  /* countdown */
  const target = new Date('2027-04-09T10:30:00-03:00').getTime();
  const outs = [document.getElementById('countHero'), document.getElementById('countTicket')].filter(Boolean);
  function tick() {
    let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60); s -= m * 60;
    const html = [[d, 'días'], [h, 'horas'], [m, 'min'], [s, 'seg']].map(x => '<div><b>' + String(x[0]).padStart(2, '0') + '</b><span>' + x[1] + '</span></div>').join('');
    outs.forEach(o => o.innerHTML = html);
  }
  tick(); setInterval(tick, 1000);
})();
