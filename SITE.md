# CANCHEROS — Conocimiento del sitio (para agentes)

Sitio estático estilo escritorio Windows 3.1 / web de los 2000. Sin framework: HTML + CSS + JS vanilla. Módulo ES solo para Webamp.

## Stack y archivos

| Archivo | Rol |
|---------|-----|
| `index.html` | Estructura: iconos, widgets, paneles, marquesina |
| `styles.css` | Estética retro, iconos SVG embebidos, ventanas Win31 |
| `script.js` | Toda la lógica UI (IIFE, `"use strict"`) |
| `webamp-init.mjs` | Carga dinámica de Webamp desde unpkg |
| `webamp-tracks.mjs` | Playlist MP3 en `audio/` |
| `lyrics-cancheros.json` | Letras por tema (fetch desde Letras) |
| `img/` | Assets (p. ej. `banda.jpg` de fondo) |
| `audio/` | MP3 del disco (nombres reales en `webamp-tracks.mjs`) |

**Deploy:** sitio estático (Neocities, Vercel, etc.). Los MP3 deben existir en `/audio/` para Winamp.

## Capas visuales (z-index)

De abajo hacia arriba:

1. **Fondo** — `body` con `img/banda.jpg`
2. **Stage / collage** — `z-index: 1` (`.collage__piece` si existen en el HTML)
3. **Marquesina inferior** — `26000`
4. **Widgets** (reloj, contador, tamagotchi) — `25500`
5. **Iconos de escritorio** (`.badges`) — `25800`
6. **Webamp** (`#webamp`) — `26550` tras cargar
7. **Ventanas / paneles** — `WindowStack` base `30000` + secuencia al hacer click
8. **Ruido / scanlines** — `8999`–`9000` (decoración, `pointer-events: none`)

## Iconos de escritorio (`.badges`)

Contenedor: `<aside class="badges">`. Cada acceso es `.badge` con:

- `data-icon-id` — clave única para posición en `localStorage` (`cancheros.desktop.icons.v1`)
- Clase modificadora `badge--{slug}` — define el pictograma en CSS (`::before`, 56×56, SVG data-URL)
- `.badge__inner` — etiqueta multilínea bajo el icono

**Tipos de elemento:**

| Tipo | Elemento | Comportamiento |
|------|----------|----------------|
| Ventana | `<button type="button" id="*-toggle">` | Click abre panel; doble click en algunos |
| Enlace externo | `<a href="..." target="_blank" rel="noopener noreferrer">` | Navega fuera; arrastrable igual que botones |

**Arrastre:** `initDesktopIcons()` — umbral ~5px para distinguir click de drag; si hubo drag, se cancela el click (importante en `<a>`). Posiciones persistidas por `data-icon-id`.

**Iconos actuales:**

| `data-icon-id` | Clase CSS | Acción |
|----------------|-----------|--------|
| `guestbook` | `badge--gb` | Libro de visitas (Atabook iframe) |
| `bandcamp` | `badge--bc` | Link a Bandcamp |
| `letras` | `badge--letras` | Índice de letras |
| `pelis` | `badge--pelis` | Índice de videos YouTube |
| `bio` | `badge--bio` | Bio estilo Word |
| `winamp` | `badge--winamp` | Reproductor Webamp |
| `jueguitos` | `badge--jueguitos` | Carpeta DOOM + Snake |

## Ventanas y paneles

Patrón común:

- `<section id="*-panel" hidden>` con `__chrome`, `__titlebar`, botón `__close` (×)
- Abrir: quitar `hidden`, `WindowStack.bringToFront(panel)`
- Cerrar: `hidden = true`, foco al toggle, `Escape` en muchos casos
- Arrastre: barra de título → `savedPos` en memoria (algunas guardan en `localStorage`)

### Guestbook (`#guestbook-panel`)

- Iframe lazy: `data-guestbook-src="https://cancheros.atabook.org/"`, `src` inicial `about:blank`
- Toggle **alterna** abrir/cerrar (único con ese comportamiento)
- Al abrir: `document.body.style.overflow = "hidden"`

### Bio (`#bio-panel`)

- Documento `contenteditable` con texto fijo en HTML
- Click y doble click en icono abren

### Letras (`#lyrics-index-panel`)

- Lista construida desde `lyrics-cancheros.json` (solo temas con letras no vacías y sin “no hay letras publicadas”)
- Cada tema abre **ventana hija** dinámica `.lyrics-song-window` (estilo Word, arrastrable, múltiples instancias)
- Sub-iconos: `.lyrics-index-panel__file` (mismo pictograma documento para todos)

### Pelis (`#pelis-index-panel`)

- Lista en JS: `PELIS_ITEMS` con `title`, `youtubeId`, opcional `embedSi`
- Click abre `.pelis-player-panel` con iframe YouTube (nocookie o embed con `si`)
- Sub-iconos: `.pelis-index-panel__file` (icono “play” rojo por defecto)

### Jueguitos (`#jueguitos-index-panel`)

- Sub-iconos en HTML: DOOM (`#doom-toggle`), Snake (`#snake-toggle`)
- Clases `jueguitos-index-panel__file--doom` / `--snake` para pictogramas distintos

### DOOM (`#doom-panel`)

- Iframe lazy: `data-doom-src` → JS-DOS en GitHub Pages
- Al cerrar: `src = about:blank` (descarga embebido)

### Snake (`#snake-panel`)

- Canvas 20×20, controles flechas/WASD, espacio reinicia
- Loop 130ms mientras el panel está abierto

### Winamp (`#winamp-panel`)

- Carga **on-demand** vía `import("./webamp-init.mjs")`
- Click en icono **toggle**: si ya abierto, cierra
- Posición chrome: `localStorage` `cancheros.winamp.chrome.v1`
- Webamp monta en `#webamp` (hijo de `body`), no dentro del ancla
- Clase `webamp--hidden-for-chrome` cuando el panel está oculto

## Widgets de escritorio

| Widget | ID | Persistencia posición | Notas |
|--------|-----|----------------------|-------|
| Reloj | `#widget-clock` | `cancheros.widget.clock.pos` | TZ `America/Argentina/Buenos_Aires` |
| Contador visitas | `#widget-counter` | `cancheros.widget.counter.pos` | Imagen externa optistats |
| Tamagotchi | `#widget-tamagotchi` | `cancheros.widget.tamagotchi.pos` | Stats maní/cerveza/rock, `cancheros.widget.tamagotchi.v1` |

`initDraggableWidget(el, storageKey, handleSelector, dragIgnoreSelector)` — arrastre con handle opcional; tamagotchi ignora drag desde `.widget-tamagotchi__actions`.

## WindowStack

```js
WindowStack.register(el);      // mousedown/touchstart → al frente
WindowStack.bringToFront(el);  // z-index = 30000 + secuencia
```

Registrar todo panel/ventana que compita por foco.

## Datos externos

- **Atabook:** guestbook embebido
- **Bandcamp:** `https://elespantorekords.bandcamp.com/album/cancheros`
- **YouTube:** IDs en `initPelisWindow` → `PELIS_ITEMS`
- **Webamp:** `https://unpkg.com/webamp@2/...`
- **DOOM:** iframe a `thedoggybrad.github.io/doom_on_js-dos/`

## Letras — formato JSON

```json
[{ "title": "NOMBRE TEMA", "lyrics": "texto plano..." }]
```

Filtrado en cliente: string no vacío, sin frase “no hay letras publicadas”.

## Audio — playlist

`webamp-tracks.mjs` exporta `initialTracks`: `{ url, duration, metaData: { title, artist, album } }`. URLs relativas `audio/{nombre archivo}.mp3`.

## Accesibilidad y UX

- `prefers-reduced-motion`: desactiva animación collage y tamagotchi ASCII
- Skip link a `#main`
- Paneles con `aria-labelledby`, iframes con `title`
- Sin outline azul en iconos/botones retro (estilos explícitos `:focus-visible`)

## Inicialización (`DOMContentLoaded`)

Orden en `script.js`:

1. `initDesktopIcons`
2. `initBioWindow`
3. `initWinampWindow`
4. `initDoomWindow`
5. `initSnakeWindow`
6. `initCollageBounce` (no-op si no hay `.collage__piece`)
7. `initGuestbook`
8. `initClockWidget`
9. `initTamagotchiWidget`
10. `initCounterWidget`
11. `initLetrasWindow`
12. `initPelisWindow`
13. `initJueguitosWindow`

## Cómo agregar una feature nueva (checklist)

1. **Icono escritorio:** HTML en `.badges` + CSS `badge--{slug}::before` + `data-icon-id` + init si abre ventana
2. **Ventana:** sección en `index.html`, estilos `*-panel`, función `init*Window` en `script.js`, registro `WindowStack`, listeners toggle/close/Escape
3. **Sub-iconos en carpeta:** ítems en lista del panel + clase `__file--{variante}` si el pictograma difiere
4. **Enlace externo:** `<a class="badge badge--...">` sin JS extra (solo drag compartido)
5. **Datos:** JSON o array en JS según patrón Letras/Pelis

Para detalle de iconos SVG y convenciones CSS, ver skill del proyecto: `.cursor/skills/cancheros-icons/SKILL.md`.
