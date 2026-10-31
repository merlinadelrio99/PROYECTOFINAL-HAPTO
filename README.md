# Bioferia · web

Código estático de la web. `index.html` está en la raíz. La carpeta `app/` incluye la vista integrada de la app para que esta web funcione por sí sola.

Para publicarla en su propio repositorio de GitHub Pages, subí **el contenido descomprimido** de este ZIP a la raíz de la rama que uses para Pages. No subas el ZIP como único archivo.

Los datos de compra y pago mostrados en la web y la app son un prototipo de tesis, no una plataforma de transacciones reales.

## Capas dinámicas (Bioferia 2027 · Ni muy muy, ni tan tan)

Los textos de la web no se tocaron: todo lo nuevo se suma encima con estos archivos.

- `capas.css`: color por subconcepto en cada sección, fondos con los afiches (`assets/poster-*.webp`, `assets/fondo-*.webp`), nav azul con logo y tagline, animaciones y estilos de los juegos.
- `js/puerta.js`: la entrada a la web. Se tira del hilo hasta la tensión justa y los seis afiches se abren.
- `js/hilo.js`: el hilo de recorrido a la izquierda (abajo en el celular).
- `js/capas.js`: arrancar el afiche del inicio, mapa que se cose, espacios 3D y los tres juegos:
  1. **La tensión · Agenda** → la clavija arma tu plan y lo marca en la agenda.
  2. **El giro · Emprendimientos** → la rueda elige el área y abre su ficha.
  3. **La revelación · Entradas** → coser el afiche libera el talón de la entrada (preventa).
- `espacios/`: los seis espacios en 3D (portal, ingreso, stands, calesita, charlas, anfiteatro). Se abren desde Experiencias y desde el Mapa.
- `assets/merch/`: el merch y la indumentaria que se ven detrás de la chapa perforada en La pista (Mapa).
- `assets/marca/`: logo, tagline y la entrada real.
- `app/`: la app con sus capas de juegos (`juegos.js`, `poster.js`).

Tipografías: Big Shoulders (incluida en `fonts/`) y Clash Display (se carga desde Fontshare). Si querés que Clash Display funcione sin internet, bajala de fontshare.com y poné `ClashDisplay-Variable.woff2` en `fonts/`.

Para probarla en tu compu abrila con un servidor local (por ejemplo `python3 -m http.server`) y no con doble clic, así la app y los espacios 3D cargan bien.
