# Bioferia BA 2027 — web y prototipo móvil

Este repositorio contiene el sitio estático completo. `index.html` es la web principal y `app/index.html` es el prototipo móvil. Las imágenes, tipografías, folletos y scripts necesarios están incluidos.

## Publicar en GitHub Pages

1. Creá un repositorio en GitHub.
2. Subí **el contenido de esta carpeta** a la raíz del repositorio. `index.html` debe quedar en la raíz, al lado de `styles.css` y de la carpeta `app`.
3. En el repositorio, abrí **Settings → Pages**.
4. En **Build and deployment**, seleccioná **Deploy from a branch**; elegí **main** y **/(root)** y guardá.
5. Cuando termine la publicación, la URL será `https://TU_USUARIO.github.io/TU_REPOSITORIO/`. La app estará en `/app/` dentro de esa URL.

Guía oficial: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Alternativa por consola

Abrí una terminal dentro de esta carpeta, reemplazá el usuario y el repositorio, y ejecutá:

```bash
git init
git add .
git commit -m "Bioferia web y app"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

## Probar en tu computadora

Desde esta carpeta ejecutá `python -m http.server 8000` y abrí `http://localhost:8000/`. La web y la app no requieren instalar dependencias ni ejecutar un compilador.
