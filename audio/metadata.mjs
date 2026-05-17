/**
 * Lee metadatos embebidos (ID3) de un MP3 vía fetch.
 * @param {string} url
 * @returns {Promise<{ title?: string, artist?: string, artwork?: string } | null>}
 */
export async function readId3FromUrl(url) {
  try {
    var res = await fetch(url);
    if (!res.ok) return null;
    var blob = await res.blob();
    var mod = await import("https://cdn.jsdelivr.net/npm/music-metadata@10.6.1/+esm");
    var metadata = await mod.parseBlob(blob, {
      mimeType: blob.type || "audio/mpeg",
    });
    var common = metadata.common || {};
    var out = {};

    if (common.title) out.title = String(common.title).trim();
    var artist = common.artist || common.albumartist;
    if (artist) out.artist = String(artist).trim();
    if (common.picture && common.picture.length > 0) {
      var pic = common.picture[0];
      out.artwork = URL.createObjectURL(
        new Blob([pic.data], { type: pic.format || "image/jpeg" })
      );
    }

    if (!out.title && !out.artist && !out.artwork) return null;
    return out;
  } catch (e) {
    return null;
  }
}
