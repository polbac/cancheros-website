import Webamp from "https://unpkg.com/webamp@2/built/webamp.bundle.min.mjs";
import { initialTracks } from "./webamp-tracks.mjs";

/**
 * @param {HTMLElement | null} anchor
 * @param {{ onWebampClose?: () => void } | null} [hooks]
 */
export async function initWebamp(anchor, hooks) {
  if (!anchor) return null;

  if (!Webamp.browserIsSupported()) {
    anchor.classList.add("webamp-anchor--error");
    anchor.textContent =
      "Tu navegador no soporta Webamp. Probá con una versión reciente de Chrome, Firefox, Safari o Edge.";
    return null;
  }

  var webamp = new Webamp({
    initialTracks: initialTracks,
  });

  try {
    await webamp.renderWhenReady(anchor);
    /* renderWhenReady monta la UI en #webamp (hijo de body), no dentro del ancla */
    var root = document.getElementById("webamp");
    if (root) {
      root.style.zIndex = "26550";
    }
    if (
      hooks &&
      typeof hooks.onWebampClose === "function" &&
      typeof webamp.onClose === "function"
    ) {
      webamp.onClose(hooks.onWebampClose);
    }
    return webamp;
  } catch (err) {
    console.error(err);
    anchor.classList.add("webamp-anchor--error");
    anchor.textContent =
      "No se pudo cargar el reproductor. Revisá la consola o que los MP3 existan en /audio/.";
    return null;
  }
}
