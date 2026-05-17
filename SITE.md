# CANCHEROS — Conocimiento del sitio (para agentes)

Sitio estático estilo escritorio Windows 3.1 / web de los 2000. Sin framework: HTML + CSS + JS vanilla. Módulo ES para el reproductor del footer.

## Stack y archivos

| Archivo | Rol |
|---------|-----|
| `index.html` | Estructura: iconos, widgets, paneles, footer player |
| `styles.css` | Estética retro, iconos SVG, ventanas Win31, `.footer-player` |
| `script.js` | Toda la lógica UI (IIFE, `"use strict"`) |
| `footer-player.mjs` | Reproductor fijo + API `window.CancherosPlayer` |
| `audio/catalog.mjs` | Catálogo de referencia (álbum CANCHEROS) |
| `lyrics-cancheros.json` | Letras por tema |
| `img/` | Assets (p. ej. `banda.jpg` de fondo y portada) |
| `audio/` | MP3 del disco |

**Deploy:** sitio estático. Los MP3 deben existir en `/audio/` para reproducir.

## Capas visuales (z-index)

1. **Fondo** — `body` con `img/banda.jpg`, `padding-bottom: var(--footer-player-h)`
2. **Stage / collage** — `z-index: 1`
3. **Footer player** — `26000` (fijo abajo, siempre visible)
4. **Widgets** — `25500`
5. **Iconos de escritorio** — `25800`
6. **Ventanas / paneles** — `WindowStack` base `30000` + secuencia
7. **Ruido / scanlines** — `8999`–`9000`

## Reproductor del footer (`#footer-player`)

Barra fija estilo SoundCloud: portada, título, artista, tiempos, barra de progreso, play/pausa, prev/next (solo con playlist), volumen y mute.

### API global (`window.CancherosPlayer`)

Disponible tras `DOMContentLoaded` (carga de `footer-player.mjs` desde `initFooterPlayer`).

```js
// Forma de cada track
{
  url: "audio/01 soy un canchero.mp3",
  title: "SOY UN CANCHERO",
  artist: "CANCHEROS",
  artwork: "img/banda.jpg"
}

CancherosPlayer.loadTrack(track);           // un tema; oculta prev/next
CancherosPlayer.loadPlaylist({ tracks, startIndex: 0 }); // cola; prev/next si length > 1
CancherosPlayer.play();
CancherosPlayer.pause();
CancherosPlayer.toggle();
CancherosPlayer.getState(); // { playing, currentIndex, queue, currentTime, duration, volume, muted }
```

- Autoplay al cargar (si el navegador lo bloquea, el usuario aprieta play).
- Al terminar el último tema de una playlist, se detiene (sin loop).
- Volumen persistido: `localStorage` `cancheros.player.volume.v1`.

### Catálogo de referencia

`audio/catalog.mjs` exporta `albumCancheros` con `artwork` y `tracks[]` listos para `loadPlaylist`. **No está cableado a ningún icono** por defecto; los iconos se conectan manualmente.

Ejemplo desde un icono:

```js
import("./audio/catalog.mjs").then(function (m) {
  window.CancherosPlayer.loadPlaylist({ tracks: m.albumCancheros.tracks });
});
```

## Iconos de escritorio (`.badges`)

| `data-icon-id` | Clase CSS | Acción |
|----------------|-----------|--------|
| `guestbook` | `badge--gb` | Libro de visitas |
| `bandcamp` | `badge--bc` | Link Bandcamp |
| `letras` | `badge--letras` | Índice de letras |
| `pelis` | `badge--pelis` | Videos YouTube |
| `bio` | `badge--bio` | Bio Word |
| `jueguitos` | `badge--jueguitos` | DOOM + Snake |

Arrastre: `localStorage` `cancheros.desktop.icons.v1`. Para **reproducir audio** desde un icono, llamar `CancherosPlayer` (no abrir ventana de reproductor).

## Ventanas y paneles

Patrón: `<section hidden>`, `WindowStack`, arrastre por titlebar, `Escape` para cerrar.

- Guestbook, Bio, Letras (+ ventanas hijas por tema), Pelis (+ reproductor YouTube), Jueguitos, DOOM, Snake.

## Widgets

Reloj, contador de visitas, tamagotchi — `z-index` 25500, posiciones en `localStorage`.

## Inicialización (`DOMContentLoaded`)

1. `initDesktopIcons`
2. `initBioWindow`
3. `initFooterPlayer`
4. `initDoomWindow`
5. `initSnakeWindow`
6. `initCollageBounce`
7. `initGuestbook`
8. `initClockWidget`
9. `initTamagotchiWidget`
10. `initCounterWidget`
11. `initLetrasWindow`
12. `initPelisWindow`
13. `initJueguitosWindow`

## Cómo agregar audio desde un icono

1. Crear o reutilizar icono en `.badges`.
2. En el handler del click (o al abrir una ventana), llamar:
   - `CancherosPlayer.loadTrack({ url, title, artist, artwork })`, o
   - `CancherosPlayer.loadPlaylist({ tracks: [...], startIndex })`.
3. Opcional: importar `audio/catalog.mjs` para el álbum completo.

Iconos SVG: `.cursor/skills/cancheros-icons/SKILL.md`.
