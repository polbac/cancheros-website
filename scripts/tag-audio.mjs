/**
 * Escribe tags ID3 en los MP3 de audio/ según audio/catalog.mjs
 * Uso: npm run tag-audio
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import NodeID3 from "node-id3";
import { albumCancheros, DISCO_ARTWORK } from "../audio/catalog.mjs";

var root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
var audioDir = path.join(root, "audio");
var artworkPath = path.join(root, DISCO_ARTWORK);

function filenameFromTrackUrl(url) {
  var m = /^audio\/(.+)$/.exec(url);
  if (!m) return null;
  return decodeURIComponent(m[1]);
}

function mimeForImage(filePath) {
  var ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

if (!fs.existsSync(artworkPath)) {
  console.error("No se encontró la portada:", artworkPath);
  process.exit(1);
}

var imageBuffer = fs.readFileSync(artworkPath);
var imageMime = mimeForImage(artworkPath);

var ok = 0;
var skip = 0;
var fail = 0;

for (var track of albumCancheros.tracks) {
  var name = filenameFromTrackUrl(track.url);
  if (!name) {
    console.warn("URL inválida:", track.url);
    fail += 1;
    continue;
  }

  var filePath = path.join(audioDir, name);
  if (!fs.existsSync(filePath)) {
    console.warn("Falta archivo:", name);
    skip += 1;
    continue;
  }

  var tags = {
    title: track.title,
    artist: track.artist,
    album: albumCancheros.title,
    image: {
      mime: imageMime,
      type: { id: 3, name: "front cover" },
      description: "Cover",
      imageBuffer: imageBuffer,
    },
  };

  var written = NodeID3.update(tags, filePath);
  if (written) {
    console.log("OK:", name, "—", track.title);
    ok += 1;
  } else {
    console.error("Error en", name + ":", NodeID3.getLastError());
    fail += 1;
  }
}

console.log("\nListo:", ok, "etiquetados,", skip, "sin archivo,", fail, "errores");

if (ok === 0 && skip > 0) {
  console.log("Colocá los .mp3 en audio/ con los nombres del catálogo y volvé a correr npm run tag-audio");
  process.exit(1);
}

if (fail > 0) process.exit(1);
