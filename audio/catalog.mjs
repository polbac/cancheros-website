/**
 * Catálogo de audio CANCHEROS — referencia para iconos que llamen a CancherosPlayer.
 */

/** Portada del icono «Disco Cancheros» y del reproductor al reproducir el álbum. */
export var DISCO_ARTWORK = "img/disco-cancheros.jpg";

var DEFAULT_ARTWORK = DISCO_ARTWORK;
var ARTIST = "cancheros";

/**
 * @param {string} file
 * @param {string} title
 */
function track(file, title) {
  return {
    url: "audio/" + encodeURIComponent(file),
    title: title,
    artist: ARTIST,
    artwork: DEFAULT_ARTWORK,
  };
}

export var albumCancheros = {
  title: "disco cancheros",
  artwork: DEFAULT_ARTWORK,
  tracks: [
    track("01 soy un canchero.mp3", "Soy un canchero"),
    track("02 no me jodan.mp3", "No me jodan"),
    track("03 todas las veces q mori.mp3", "Todas las veces que mori"),
    track("04 croto.mp3", "Croto"),
    track("05 balenciaga.mp3", "Balenciaga (homeless rock)"),
    track("06 no tengo likes.mp3", "No tengo likes (pero tengo una bomba)"),
    track("07 porro.mp3", "Porro"),
    track("08 fiera de asfalto.mp3", "Fiera de asfalto"),
    track("08 soy del conurba.mp3", "Soy del conurbano"),
    track("10 quiero volarte la gorra.mp3", "Quiero volarte la gorra"),
  ],
};
