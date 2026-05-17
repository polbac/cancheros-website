/**
 * Footer player estilo SoundCloud — API global window.CancherosPlayer
 */

var VOLUME_KEY = "cancheros.player.volume.v1";
var PLACEHOLDER_ART =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 56'%3E%3Crect fill='%23222' width='56' height='56'/%3E%3Ctext x='28' y='32' text-anchor='middle' fill='%23666' font-size='10' font-family='sans-serif'%3E♪%3C/text%3E%3C/svg%3E";

/**
 * @param {unknown} t
 * @returns {t is { url: string, title: string, artist: string, artwork: string }}
 */
function isTrack(t) {
  if (!t || typeof t !== "object") return false;
  var o = /** @type {Record<string, unknown>} */ (t);
  return (
    typeof o.url === "string" &&
    o.url.length > 0 &&
    typeof o.title === "string" &&
    typeof o.artist === "string" &&
    typeof o.artwork === "string"
  );
}

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  var s = Math.floor(sec);
  var m = Math.floor(s / 60);
  var r = s % 60;
  return m + ":" + (r < 10 ? "0" : "") + r;
}

function normalizeTrack(t) {
  return {
    url: String(t.url),
    title: String(t.title || "Sin título"),
    artist: String(t.artist || "CANCHEROS"),
    artwork: String(t.artwork || PLACEHOLDER_ART),
  };
}

class FooterPlayer {
  constructor(root) {
    if (!root) throw new Error("footer-player root missing");
    this.root = root;
    this.audio = /** @type {HTMLAudioElement} */ (document.getElementById("footer-player-audio"));
    this.artEl = /** @type {HTMLImageElement} */ (document.getElementById("footer-player-art"));
    this.titleEl = document.getElementById("footer-player-title");
    this.artistEl = document.getElementById("footer-player-artist");
    this.currentEl = document.getElementById("footer-player-current");
    this.durationEl = document.getElementById("footer-player-duration");
    this.progressEl = /** @type {HTMLInputElement} */ (
      document.getElementById("footer-player-progress")
    );
    this.errorEl = document.getElementById("footer-player-error");
    this.transportEl = document.getElementById("footer-player-transport");
    this.prevBtn = /** @type {HTMLButtonElement} */ (document.getElementById("footer-player-prev"));
    this.playBtn = /** @type {HTMLButtonElement} */ (document.getElementById("footer-player-play"));
    this.nextBtn = /** @type {HTMLButtonElement} */ (document.getElementById("footer-player-next"));
    this.muteBtn = /** @type {HTMLButtonElement} */ (document.getElementById("footer-player-mute"));
    this.volumeEl = /** @type {HTMLInputElement} */ (document.getElementById("footer-player-volume"));

    /** @type {{ url: string, title: string, artist: string, artwork: string }[]} */
    this.queue = [];
    this.currentIndex = 0;
    this.seeking = false;
    this.muted = false;
    this.lastVolume = 0.8;
    /** @type {string | null} */
    this._id3ArtworkUrl = null;
    /** @type {number} */
    this._id3RequestId = 0;

    this._bind();
    this._loadVolume();
    this._setEmptyUi();
  }

  _bind() {
    var self = this;

    this.playBtn.addEventListener("click", function () {
      self.toggle();
    });
    this.prevBtn.addEventListener("click", function () {
      self.previous();
    });
    this.nextBtn.addEventListener("click", function () {
      self.next();
    });
    this.muteBtn.addEventListener("click", function () {
      self._toggleMute();
    });

    this.volumeEl.addEventListener("input", function () {
      var v = Number(self.volumeEl.value) / 100;
      self._setVolume(v);
      self.muted = false;
      self._updateMuteUi();
    });

    this.progressEl.addEventListener("input", function () {
      self.seeking = true;
      var max = self.audio.duration;
      if (isFinite(max) && max > 0) {
        var pct = Number(self.progressEl.value) / 1000;
        self.currentEl.textContent = formatTime(pct * max);
      }
    });

    this.progressEl.addEventListener("change", function () {
      var max = self.audio.duration;
      if (isFinite(max) && max > 0) {
        var pct = Number(self.progressEl.value) / 1000;
        self.audio.currentTime = pct * max;
      }
      self.seeking = false;
    });

    this.audio.addEventListener("timeupdate", function () {
      if (self.seeking) return;
      var cur = self.audio.currentTime;
      var dur = self.audio.duration;
      self.currentEl.textContent = formatTime(cur);
      if (isFinite(dur) && dur > 0) {
        self.progressEl.value = String(Math.round((cur / dur) * 1000));
        self.progressEl.setAttribute("aria-valuenow", self.progressEl.value);
      }
    });

    this.audio.addEventListener("loadedmetadata", function () {
      var dur = self.audio.duration;
      self.durationEl.textContent = formatTime(dur);
      self.progressEl.value = "0";
      self.progressEl.setAttribute("aria-valuenow", "0");
    });

    this.audio.addEventListener("play", function () {
      self.root.classList.add("footer-player--playing");
      self.playBtn.textContent = "❚❚";
      self.playBtn.setAttribute("aria-label", "Pausar");
    });

    this.audio.addEventListener("pause", function () {
      self.root.classList.remove("footer-player--playing");
      self.playBtn.textContent = "▶";
      self.playBtn.setAttribute("aria-label", "Reproducir");
    });

    this.audio.addEventListener("ended", function () {
      if (self.queue.length > 1 && self.currentIndex < self.queue.length - 1) {
        self._loadIndex(self.currentIndex + 1, true);
      } else {
        self.pause();
      }
    });

    this.audio.addEventListener("error", function () {
      self._showError("No se pudo cargar el audio.");
    });
  }

  _loadVolume() {
    var v = 0.8;
    try {
      var raw = localStorage.getItem(VOLUME_KEY);
      if (raw !== null) {
        var n = parseFloat(raw);
        if (!isNaN(n)) v = Math.min(1, Math.max(0, n));
      }
    } catch (e) {
      // ignore
    }
    this.lastVolume = v > 0 ? v : 0.8;
    this._setVolume(this.lastVolume);
    this.volumeEl.value = String(Math.round(this.lastVolume * 100));
  }

  _saveVolume() {
    try {
      localStorage.setItem(VOLUME_KEY, String(this.audio.volume));
    } catch (e) {
      // ignore
    }
  }

  _setVolume(v) {
    this.audio.volume = Math.min(1, Math.max(0, v));
    if (v > 0) this.lastVolume = v;
    this._saveVolume();
    this._updateMuteUi();
  }

  _toggleMute() {
    if (this.muted) {
      this.muted = false;
      this._setVolume(this.lastVolume > 0 ? this.lastVolume : 0.8);
      this.volumeEl.value = String(Math.round(this.audio.volume * 100));
    } else {
      this.muted = true;
      if (this.audio.volume > 0) this.lastVolume = this.audio.volume;
      this.audio.volume = 0;
      this.volumeEl.value = "0";
    }
    this._updateMuteUi();
  }

  _updateMuteUi() {
    var silent = this.muted || this.audio.volume === 0;
    this.muteBtn.classList.toggle("footer-player__btn--muted", silent);
    this.muteBtn.setAttribute("aria-label", silent ? "Activar sonido" : "Silenciar");
  }

  _setEmptyUi() {
    this.artEl.src = PLACEHOLDER_ART;
    this.artEl.alt = "";
    if (this.titleEl) this.titleEl.textContent = "Sin reproducción";
    if (this.artistEl) this.artistEl.textContent = "CANCHEROS";
    this.currentEl.textContent = "0:00";
    this.durationEl.textContent = "0:00";
    this.progressEl.value = "0";
    this._hideError();
    this._updateTransport();
  }

  _showError(msg) {
    if (this.errorEl) {
      this.errorEl.textContent = msg;
      this.errorEl.hidden = false;
    }
  }

  _hideError() {
    if (this.errorEl) {
      this.errorEl.textContent = "";
      this.errorEl.hidden = true;
    }
  }

  _updateTransport() {
    var multi = this.queue.length > 1;
    if (this.transportEl) {
      this.transportEl.classList.toggle("footer-player__transport--hidden", !multi);
    }
    if (!multi) return;
    this.prevBtn.disabled = this.currentIndex <= 0;
    this.nextBtn.disabled = this.currentIndex >= this.queue.length - 1;
  }

  _revokeId3Artwork() {
    if (this._id3ArtworkUrl) {
      URL.revokeObjectURL(this._id3ArtworkUrl);
      this._id3ArtworkUrl = null;
    }
  }

  _updateMediaSession(track) {
    if (!("mediaSession" in navigator)) return;
    try {
      var art = [];
      if (track.artwork && track.artwork.indexOf("data:") !== 0) {
        art.push({ src: track.artwork, sizes: "512x512", type: "image/jpeg" });
      }
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: "CANCHEROS",
        artwork: art,
      });
    } catch (e) {
      // ignore
    }
  }

  _applyTrackMeta(track) {
    this.artEl.src = track.artwork || PLACEHOLDER_ART;
    this.artEl.alt = track.title + " — " + track.artist;
    if (this.titleEl) this.titleEl.textContent = track.title;
    if (this.artistEl) this.artistEl.textContent = track.artist;
    this.root.classList.add("footer-player--active");
    this._hideError();
    this._updateMediaSession(track);
  }

  /**
   * Completa título / artista / portada desde tags ID3 del MP3 (si existen).
   * @param {{ url: string, title: string, artist: string, artwork: string }} track
   */
  _enrichFromId3(track) {
    var self = this;
    var requestId = ++this._id3RequestId;
    var baseUrl = track.url;

    import("./audio/metadata.mjs")
      .then(function (mod) {
        return mod.readId3FromUrl(baseUrl);
      })
      .then(function (id3) {
        if (!id3 || requestId !== self._id3RequestId) return;
        if (!self.queue[self.currentIndex] || self.queue[self.currentIndex].url !== baseUrl) {
          if (id3.artwork) URL.revokeObjectURL(id3.artwork);
          return;
        }

        self._revokeId3Artwork();
        var merged = {
          url: track.url,
          title: id3.title || track.title,
          artist: id3.artist || track.artist,
          artwork: track.artwork,
        };
        if (id3.artwork) {
          self._id3ArtworkUrl = id3.artwork;
          merged.artwork = id3.artwork;
        }

        self.queue[self.currentIndex] = merged;
        self._applyTrackMeta(merged);
      })
      .catch(function () {
        // sin ID3 o fetch fallido: se mantiene metadata del catálogo
      });
  }

  /**
   * @param {number} index
   * @param {boolean} autoplay
   */
  _loadIndex(index, autoplay) {
    if (!this.queue.length || index < 0 || index >= this.queue.length) return;
    this._id3RequestId += 1;
    this._revokeId3Artwork();
    this.currentIndex = index;
    var track = this.queue[index];
    this._applyTrackMeta(track);
    this.audio.src = track.url;
    this._enrichFromId3(track);
    this.progressEl.value = "0";
    this.currentEl.textContent = "0:00";
    this.durationEl.textContent = "0:00";
    this._updateTransport();
    var self = this;
    if (autoplay) {
      var p = this.audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(function () {
          /* autoplay blocked */
        });
      }
    }
  }

  /**
   * @param {{ url: string, title: string, artist: string, artwork: string }} track
   */
  loadTrack(track) {
    if (!isTrack(track)) {
      console.warn("CancherosPlayer.loadTrack: track inválido", track);
      return;
    }
    this.queue = [normalizeTrack(track)];
    this._loadIndex(0, true);
  }

  /**
   * @param {{ tracks: unknown[], startIndex?: number }} opts
   */
  loadPlaylist(opts) {
    if (!opts || !Array.isArray(opts.tracks) || !opts.tracks.length) {
      console.warn("CancherosPlayer.loadPlaylist: tracks vacío");
      return;
    }
    var list = [];
    for (var i = 0; i < opts.tracks.length; i++) {
      if (isTrack(opts.tracks[i])) list.push(normalizeTrack(opts.tracks[i]));
    }
    if (!list.length) {
      console.warn("CancherosPlayer.loadPlaylist: ningún track válido");
      return;
    }
    var start = typeof opts.startIndex === "number" ? opts.startIndex : 0;
    if (start < 0) start = 0;
    if (start >= list.length) start = list.length - 1;
    this.queue = list;
    this._loadIndex(start, true);
  }

  /**
   * @param {{ title?: string, artwork?: string, tracks: unknown[] }} album
   */
  loadAlbum(album) {
    if (!album || !Array.isArray(album.tracks) || !album.tracks.length) {
      console.warn("CancherosPlayer.loadAlbum: álbum vacío");
      return;
    }
    var art =
      typeof album.artwork === "string" && album.artwork.length > 0
        ? album.artwork
        : "";
    var mapped = [];
    for (var i = 0; i < album.tracks.length; i++) {
      var raw = album.tracks[i];
      if (!isTrack(raw)) continue;
      var t = normalizeTrack(raw);
      if (art) t.artwork = art;
      mapped.push(t);
    }
    if (!mapped.length) {
      console.warn("CancherosPlayer.loadAlbum: ningún track válido");
      return;
    }
    this.loadPlaylist({ tracks: mapped });
  }

  play() {
    if (!this.audio.src) return;
    var p = this.audio.play();
    if (p && typeof p.catch === "function") p.catch(function () {});
  }

  pause() {
    this.audio.pause();
  }

  toggle() {
    if (!this.audio.src) return;
    if (this.audio.paused) this.play();
    else this.pause();
  }

  previous() {
    if (this.queue.length <= 1) return;
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    if (this.currentIndex > 0) this._loadIndex(this.currentIndex - 1, true);
  }

  next() {
    if (this.currentIndex < this.queue.length - 1) {
      this._loadIndex(this.currentIndex + 1, true);
    }
  }

  getState() {
    return {
      playing: !this.audio.paused && !this.audio.ended,
      currentIndex: this.currentIndex,
      queue: this.queue.slice(),
      currentTime: this.audio.currentTime,
      duration: this.audio.duration,
      volume: this.audio.volume,
      muted: this.muted,
    };
  }
}

/**
 * @param {HTMLElement | null} root
 */
export function createFooterPlayer(root) {
  var player = new FooterPlayer(root);
  return {
    loadTrack: function (t) {
      player.loadTrack(t);
    },
    loadPlaylist: function (opts) {
      player.loadPlaylist(opts);
    },
    loadAlbum: function (album) {
      player.loadAlbum(album);
    },
    play: function () {
      player.play();
    },
    pause: function () {
      player.pause();
    },
    toggle: function () {
      player.toggle();
    },
    getState: function () {
      return player.getState();
    },
  };
}

export function initFooterPlayerGlobal() {
  var root = document.getElementById("footer-player");
  var api = createFooterPlayer(root);
  window.CancherosPlayer = api;
  return api;
}
