const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const menuButton = $('.menu-toggle');
const nav = $('#primary-nav');
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});
$$('.primary-nav a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menú');
}));

const veilButton = $('#reveal-veil');
const heroArt = $('.hero-art');
veilButton.addEventListener('click', () => {
  const revealed = heroArt.classList.toggle('is-revealed');
  veilButton.setAttribute('aria-pressed', String(revealed));
  veilButton.firstChild.textContent = revealed ? 'Volver a cubrir ' : 'Corré el velo ';
});

const festivalStart = new Date('2027-04-09T00:00:00-03:00').getTime();
function updateCountdown() {
  const remaining = Math.max(0, festivalStart - Date.now());
  const seconds = Math.floor(remaining / 1000);
  const values = {
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60
  };
  Object.entries(values).forEach(([unit, value]) => {
    $(`[data-unit="${unit}"]`).textContent = String(value).padStart(2, '0');
  });
}
updateCountdown();
setInterval(updateCountdown, 1000);

const dayNames = { '9': 'VIERNES 9', '10': 'SÁBADO 10', '11': 'DOMINGO 11' };
$$('.agenda-days button').forEach(button => button.addEventListener('click', () => {
  $$('.agenda-days button').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  $('#selected-day').textContent = dayNames[button.dataset.day];
}));
$$('.agenda-filters button').forEach(button => button.addEventListener('click', () => {
  $$('.agenda-filters button').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  $$('.agenda-list article').forEach(card => {
    card.hidden = button.dataset.filter !== 'todas' && card.dataset.type !== button.dataset.filter;
  });
}));

const categories = {
  mercado: ['Mercado', 'Un espacio para conocer emprendimientos y nuevas formas de producir, elegir y consumir.', 'Objetos, alimentos y propuestas de consumo consciente.'],
  gastronomia: ['Gastronomía', 'Sabores y proyectos que ponen la alimentación consciente en el centro.', 'Alimentos, bebidas y propuestas de cocina.'],
  bienestar: ['Bienestar', 'Ideas para cuidarnos y encontrar un ritmo propio, en comunidad.', 'Servicios, hábitos y productos de bienestar.'],
  moda: ['Moda', 'Prendas y accesorios que invitan a mirar su material, proceso y duración.', 'Ropa, accesorios y reparación textil.'],
  diseno: ['Diseño y deco', 'Objetos para habitar los espacios con una relación más atenta con los recursos.', 'Objetos, mobiliario y decoración.'],
  infancia: ['Infancia', 'Experiencias y productos para aprender y jugar desde pequeños.', 'Juegos, libros y objetos para infancias.'],
  turismo: ['Turismo', 'Otras maneras de viajar, conocer lugares y vincularse con sus comunidades.', 'Experiencias, destinos y propuestas de viaje.'],
  arquitectura: ['Arquitectura y jardinería', 'Ideas para construir, cultivar y vivir mejor los espacios.', 'Soluciones para espacios, plantas y jardines.'],
  energia: ['Energías renovables', 'Proyectos que exploran otras formas de generar y usar energía.', 'Tecnologías y soluciones energéticas.'],
  movilidad: ['Movilidad', 'Alternativas para movernos y conectar lugares de manera más consciente.', 'Servicios y soluciones de movilidad.'],
  ong: ['ONG', 'Organizaciones que unen personas, causas y acciones con impacto social y ambiental.', 'Iniciativas, campañas y proyectos colectivos.']
};
const categoryIds = Object.keys(categories);
$$('.category-list button').forEach(button => button.addEventListener('click', () => {
  $$('.category-list button').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  const data = categories[button.dataset.category];
  $('.detail-top span:first-child').textContent = `ÁREA ${String(categoryIds.indexOf(button.dataset.category) + 1).padStart(2, '0')} / 11`;
  $('#category-name').textContent = data[0];
  $('#category-description').textContent = data[1];
  $('#category-products').textContent = data[2];
}));

const zones = {
  ingreso: ['01', 'LO OCULTO', 'Portal de ingreso', 'Un umbral de hilos que se corren. La feria se revela al atravesarlo.'],
  bienvenida: ['02', 'LA TENSIÓN', 'Bienvenida', 'Hilos tensados marcan el primer impulso del recorrido y orientan hacia los espacios.'],
  expositores: ['03', 'EL GIRO', 'Expositores', 'Una retícula reúne emprendimientos y nuevas formas de mirar los materiales.'],
  pista: ['04', 'LA PISTA', 'Calesita', 'El movimiento circular y los hilos conectan el juego con los recuerdos compartidos.'],
  charlas: ['05', 'EL EQUILIBRIO', 'Charlas y streaming', 'Una red de hilos distribuye y conecta las conversaciones.'],
  escenario: ['06', 'LA REVELACIÓN', 'Anfiteatro', 'Un espacio de encuentro donde personas e historias se conectan mediante el hilo.']
};
$$('[data-zone]').forEach(button => button.addEventListener('click', () => {
  $$('[data-zone]').forEach(item => {
    const active = item.dataset.zone === button.dataset.zone;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  const [number, concept, name, description] = zones[button.dataset.zone];
  $('#map-number').textContent = number;
  $('#map-concept').textContent = concept;
  $('#map-name').textContent = name;
  $('#map-description').textContent = description;
}));

const mapDialog = $('#map-dialog');
$$('.concept-select').forEach(button => button.addEventListener('click', () => {
  $$('.concept-select').forEach(item => {
    const selected = item === button;
    item.closest('li').classList.toggle('is-active', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
}));
$('#open-map').addEventListener('click', () => mapDialog.showModal());
$$('[data-close]').forEach(button => button.addEventListener('click', () => $('#' + button.dataset.close).close()));
[mapDialog].forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
}));
