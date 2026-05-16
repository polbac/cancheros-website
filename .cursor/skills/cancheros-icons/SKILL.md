---
name: cancheros-icons
description: >-
  Crea y modifica iconos del sitio CANCHEROS: badges de escritorio (56px),
  sub-iconos en ventanas tipo Explorador (32px), enlaces externos y SVG custom
  embebidos en CSS. Usar al agregar accesos al escritorio, ítems en carpetas
  (Letras, Pelis, Jueguitos) o pictogramas pixel-art Win31.
---

# Iconos CANCHEROS

## Estilo obligatorio

- SVG **32×32** `viewBox="0 0 32 32"` (escala visual 56px en escritorio, 32px en sub-iconos)
- Estética **Windows 3.1 / pixel**: trazos `stroke="#000"`, rellenos planos (`#fff`, `#008`, `#c00`, `#0f0`, etc.)
- Sin marco gris alrededor del pictograma; fondo transparente
- `image-rendering: pixelated` en `::before`
- Embeber como **data URL** en `background-image` (no archivos sueltos salvo que el usuario pida explícitamente)

## Tres tipos de icono

### 1. Icono de escritorio (`.badge`)

**HTML** (`index.html`, dentro de `<aside class="badges">`):

```html
<!-- Ventana -->
<button type="button" class="badge badge--mi-slug" id="mi-feature-toggle" data-icon-id="mi-feature">
  <span class="badge__inner">Etiqueta visible</span>
</button>

<!-- Enlace externo -->
<a class="badge badge--mi-slug" data-icon-id="mi-link" href="https://..." target="_blank" rel="noopener noreferrer">
  <span class="badge__inner">Etiqueta</span>
</a>
```

**CSS** (`styles.css`, bloque ~`.badge--*`):

```css
.badge--mi-slug::before {
  background-image: url("data:image/svg+xml,...");
}
```

**JS** (solo si abre ventana): función `initMiFeatureWindow()` en `script.js` + registro en `DOMContentLoaded`. Reutilizar patrón de `initBioWindow` o `initJueguitosWindow`.

Reglas:

- `data-icon-id` único y estable (persistencia drag)
- `id` del toggle: `{slug}-toggle` (convención del proyecto)
- El pictograma vive en `::before` (56×56 en `.badge::before`), no en el HTML

### 2. Sub-icono en ventana carpeta (Explorador)

Para listas dentro de paneles índice (Letras, Pelis, Jueguitos).

**HTML estático** (como Jueguitos):

```html
<button type="button" id="foo-toggle" class="jueguitos-index-panel__file jueguitos-index-panel__file--foo" title="Foo">
  <span class="jueguitos-index-panel__file-label">Foo</span>
</button>
```

**HTML dinámico** (como Letras/Pelis): crear en JS con clases `*-index-panel__file` y `__file-label`.

**CSS:**

- Base: `.{panel}__file::before` — tamaño 32×32
- Variante: `.{panel}__file--{variante}::before { background-image: url(...); }`
- Si todos comparten icono (Letras, Pelis default), un solo `background-image` en `__file::before`

Prefijos de panel existentes:

| Panel | Prefijo clase |
|-------|----------------|
| Letras | `lyrics-index-panel__` |
| Pelis | `pelis-index-panel__` |
| Jueguitos | `jueguitos-index-panel__` |

### 3. Icono custom / variante

Mismo flujo: SVG → encode → `background-image` en el modificador `::before` correcto.

## Codificar SVG para data URL

1. SVG en una línea, comillas dobles en atributos
2. URL-encode: espacios → `%20`, `#` → `%23`, `"` → `%22`, `<` → `%3C`, `>` → `%3E`, `/` en rutas si aplica
3. Prefijo: `data:image/svg+xml,` + SVG codificado (sin base64 en este proyecto)

Ejemplo mínimo:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect x="8" y="6" width="16" height="20" fill="#fff" stroke="#000" stroke-width="1"/>
</svg>
```

En terminal (verificar antes de pegar en CSS):

```bash
python3 -c "import urllib.parse; print(urllib.parse.quote(open('icon.svg').read()))"
```

## Checklist al agregar icono de escritorio

- [ ] Entrada en `index.html` con `data-icon-id` y `badge--{slug}`
- [ ] Regla `.badge--{slug}::before` en `styles.css`
- [ ] Si abre ventana: panel en HTML, estilos `*-panel`, `init*Window`, `WindowStack.register`
- [ ] Toggle enlazado (`#slug-toggle` ↔ `init*`)
- [ ] Probar: click abre, drag guarda posición, enlace externo no navega si se arrastró

## Checklist sub-icono + ventana hija

- [ ] Ítem en lista del panel índice (HTML o JS)
- [ ] Clase `__file--{variante}` si pictograma distinto
- [ ] `init*Window` para panel hijo (DOOM/Snake) o ventana dinámica (Letras/Pelis)
- [ ] `dblclick` + `click` en toggle hijo si sigue patrón Jueguitos

## Enlace externo vs ventana

| Necesidad | Implementación |
|-----------|----------------|
| Salir del sitio | `<a class="badge">` + `href` + `rel="noopener noreferrer"` |
| Modal / iframe / juego | `<button>` + panel + lazy iframe si pesado |
| Carpeta con hijos | Icono escritorio → panel índice → sub-iconos |

## Referencias en el repo

- Escritorio: `styles.css` `.badge--gb` … `.badge--jueguitos`
- Sub-iconos: `.lyrics-index-panel__file`, `.pelis-index-panel__file`, `.jueguitos-index-panel__file--doom`
- Drag iconos: `initDesktopIcons()` en `script.js`
- Mapa del sitio: `SITE.md` en la raíz

## Anti-patrones

- No poner `<img>` dentro de `.badge` (rompe el layout Win31)
- No olvidar `data-icon-id` (colisiones en localStorage)
- No usar z-index arbitrario en iconos; ventanas usan `WindowStack`
- No duplicar SVG sin variante CSS si el significado es distinto (crear `badge--` o `__file--` nuevo)
