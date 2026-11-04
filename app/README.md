# Bioferia · app

Prototipo web móvil autónomo. `index.html` está en la raíz. Las fuentes, las imágenes, el mapa y los folletos están incluidos en este repositorio.

Para publicarla en su propio repositorio de GitHub Pages, subí **el contenido descomprimido** de este ZIP a la raíz de la rama que uses para Pages. No subas el ZIP como único archivo.

El ingreso, los BioPoints y los pagos son simulados; no procesan dinero ni almacenan cuentas reales.

## Capas sumadas (juegos, dinamismo y Hecho y cosido)

- `juegos.js` / `juegos.css`: pagar tirando del hilo, cargar apilando piedras, cupones para rascar, registrar visitas en morse, ticket de recorrido y kit de entrada.
- `poster.js` / `poster.css`: piel de afiche por sección (portadas con los afiches reales sin letras, en `pz/`), títulos animados, cinta y transiciones. El tagline va en blanco sobre fondos oscuros y en negro sobre claros.
- `hecho.js` / `hecho.css`: la solapa **Hecho y cosido** (idea innovadora). Cazar un personaje con la cámara simulada, vestirlo con los objetos que aparecen por el predio, enviarlo a imprimir y retirarlo en el stand. Personajes en `hc/` (sin vestir y vestido).
