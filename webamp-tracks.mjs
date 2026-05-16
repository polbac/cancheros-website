/**
 * Playlist Webamp — archivos en /audio/ (nombres reales del disco).
 */

var album = "CANCHEROS";

function a(name, title, durationSec) {
  return {
    url: "audio/" + encodeURIComponent(name),
    duration: durationSec,
    metaData: {
      title: title,
      artist: "CANCHEROS",
      album: album,
    },
  };
}

/** Duración aprox. en seg. (bitrate ~192 kbps) hasta que Webamp lea los metadatos del MP3. */
export var initialTracks = [
  a("01 soy un canchero.mp3", "SOY UN CANCHERO", 183),
  a("02 no me jodan.mp3", "NO ME JODAN", 283),
  a("03 todas las veces q mori.mp3", "TODAS LAS VECES QUE MORI", 158),
  a("04 croto.mp3", "CROTO", 272),
  a("05 balenciaga.mp3", "BALENCIAGA (HOMELESS ROCK)", 391),
  a("06 no tengo likes.mp3", "NO TENGO LIKES (PERO TENGO UNA BOMBA)", 316),
  a("07 porro.mp3", "PORRO", 450),
  a("08 fiera de asfalto.mp3", "FIERA DE ASFALTO", 315),
  a("08 soy del conurba.mp3", "SOY DEL CONURBANO", 284),
  a("10 quiero volarte la gorra.mp3", "QUIERO VOLARTE LA GORRA", 273),
];
