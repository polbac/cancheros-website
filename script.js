/**
 * CANCHEROS — UI: guestbook Atabook (ventana movible)
 */

(function () {
  "use strict";

  /** Ventanas por encima de marquesina (26000), widgets (25500) e iconos; click trae al frente. */
  var WindowStack = (function () {
    var BASE = 30000;
    var seq = 0;

    function bringToFront(el) {
      if (!el || !el.parentNode) return;
      seq += 1;
      el.style.zIndex = String(BASE + seq);
    }

    function register(el) {
      if (!el) return;
      function activate() {
        bringToFront(el);
      }
      el.addEventListener("mousedown", activate, true);
      el.addEventListener("touchstart", activate, { capture: true, passive: true });
    }

    return { register: register, bringToFront: bringToFront };
  })();

  function isMobileDesktopLayout() {
    return !!(window.matchMedia && window.matchMedia("(max-width: 520px)").matches);
  }

  function initDesktopIcons() {
    var icons = Array.prototype.slice.call(document.querySelectorAll(".badges .badge"));
    if (!icons.length) return;

    var mobileGrid = isMobileDesktopLayout();

    var reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var storageKey = "cancheros.desktop.icons.v1";
    var positions = {};
    try {
      positions = JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
    } catch (e) {
      positions = {};
    }

    function clamp(v, min, max) {
      return Math.min(Math.max(v, min), max);
    }

    function getId(el, idx) {
      return el.getAttribute("data-icon-id") || "icon_" + idx;
    }

    function placeRandom(el, id) {
      var rect = el.getBoundingClientRect();
      var w = rect.width || 124;
      var h = rect.height || 100;
      var m = 10;
      var maxX = Math.max(m, window.innerWidth - w - m);
      var maxY = Math.max(m, window.innerHeight - h - m);
      var x = m + Math.random() * (maxX - m);
      var y = m + Math.random() * (maxY - m);
      positions[id] = { left: x, top: y };
      applyPos(el, positions[id]);
    }

    function applyPos(el, pos) {
      var rect = el.getBoundingClientRect();
      var w = rect.width || 124;
      var h = rect.height || 100;
      var m = 10;
      var maxX = Math.max(m, window.innerWidth - w - m);
      var maxY = Math.max(m, window.innerHeight - h - m);
      var left = clamp(pos.left, m, maxX);
      var top = clamp(pos.top, m, maxY);
      el.style.left = left + "px";
      el.style.top = top + "px";
    }

    function save() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(positions));
      } catch (e) {
        // ignore
      }
    }

    var active = null;
    /** @type {{ el: HTMLElement, id: string, startX: number, startY: number } | null} */
    var pending = null;
    /** @type {{ el: HTMLElement, id: string, startX: number, startY: number } | null} */
    var touchPending = null;
    var dragMoved = false;

    function startDrag(el, id, clientX, clientY) {
      var rect = el.getBoundingClientRect();
      active = {
        el: el,
        id: id,
        startX: clientX,
        startY: clientY,
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
      };
      dragMoved = false;
      el.style.zIndex = "21000";
      document.body.style.cursor = "grabbing";
    }

    function moveDrag(clientX, clientY) {
      if (!active) return;
      var dx = clientX - active.startX;
      var dy = clientY - active.startY;
      if (Math.abs(dx) + Math.abs(dy) > 10) dragMoved = true;

      var rect = active.el.getBoundingClientRect();
      var w = rect.width || 124;
      var h = rect.height || 100;
      var m = 10;
      var maxX = Math.max(m, window.innerWidth - w - m);
      var maxY = Math.max(m, window.innerHeight - h - m);
      var left = clamp(clientX - active.offsetX, m, maxX);
      var top = clamp(clientY - active.offsetY, m, maxY);

      positions[active.id] = { left: left, top: top };
      active.el.style.left = left + "px";
      active.el.style.top = top + "px";
    }

    function endDrag() {
      if (!active) return;
      active.el.style.zIndex = "";
      document.body.style.cursor = "";
      save();
      active = null;
    }

    function onMouseMovePending(e) {
      if (!pending) return;
      var dx = e.clientX - pending.startX;
      var dy = e.clientY - pending.startY;
      if (Math.abs(dx) + Math.abs(dy) < 5) return;
      var el = pending.el;
      var id = pending.id;
      var sx = pending.startX;
      var sy = pending.startY;
      pending = null;
      window.removeEventListener("mousemove", onMouseMovePending);
      window.removeEventListener("mouseup", onMouseUpPending);
      startDrag(el, id, sx, sy);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }

    function onMouseUpPending() {
      window.removeEventListener("mousemove", onMouseMovePending);
      window.removeEventListener("mouseup", onMouseUpPending);
      if (pending) {
        pending = null;
        dragMoved = false;
      }
    }

    function onMouseDown(e) {
      if (e.button !== 0) return;
      dragMoved = false;
      var el = e.currentTarget;
      var id = el.__desktopId;
      pending = {
        el: el,
        id: id,
        startX: e.clientX,
        startY: e.clientY,
      };
      window.addEventListener("mousemove", onMouseMovePending);
      window.addEventListener("mouseup", onMouseUpPending);
    }

    function onMouseMove(e) {
      moveDrag(e.clientX, e.clientY);
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      endDrag();
    }

    function onTouchMovePending(e) {
      if (!touchPending || !e.touches || !e.touches[0]) return;
      var t = e.touches[0];
      var dx = t.clientX - touchPending.startX;
      var dy = t.clientY - touchPending.startY;
      if (Math.abs(dx) + Math.abs(dy) < 5) return;
      var el = touchPending.el;
      var id = touchPending.id;
      var sx = touchPending.startX;
      var sy = touchPending.startY;
      touchPending = null;
      window.removeEventListener("touchmove", onTouchMovePending);
      window.removeEventListener("touchend", onTouchEndPending);
      window.removeEventListener("touchcancel", onTouchEndPending);
      startDrag(el, id, sx, sy);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
      window.addEventListener("touchcancel", onTouchEnd);
    }

    function onTouchEndPending() {
      window.removeEventListener("touchmove", onTouchMovePending);
      window.removeEventListener("touchend", onTouchEndPending);
      window.removeEventListener("touchcancel", onTouchEndPending);
      if (touchPending) {
        touchPending = null;
        dragMoved = false;
      }
    }

    function onTouchStart(e) {
      dragMoved = false;
      var el = e.currentTarget;
      var id = el.__desktopId;
      if (!e.touches || !e.touches[0]) return;
      var t = e.touches[0];
      touchPending = {
        el: el,
        id: id,
        startX: t.clientX,
        startY: t.clientY,
      };
      window.addEventListener("touchmove", onTouchMovePending, { passive: false });
      window.addEventListener("touchend", onTouchEndPending);
      window.addEventListener("touchcancel", onTouchEndPending);
    }

    function onTouchMove(e) {
      if (!e.touches || !e.touches[0]) return;
      var t = e.touches[0];
      e.preventDefault();
      moveDrag(t.clientX, t.clientY);
    }

    function onTouchEnd() {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      endDrag();
    }

    function onClickGuard(e) {
      // si se arrastró, cancelamos el click (especialmente en <a>)
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
        dragMoved = false;
      }
    }

    for (var i = 0; i < icons.length; i++) {
      var el = icons[i];
      var id = getId(el, i);
      el.__desktopId = id;

      if (mobileGrid) {
        el.style.left = "";
        el.style.top = "";
        el.style.zIndex = "";
      } else {
        if (positions[id]) applyPos(el, positions[id]);
        else placeRandom(el, id);

        el.addEventListener("mousedown", onMouseDown);
        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("click", onClickGuard, true);
      }

      if (!reduceMotion) {
        // placeholder: no animamos nada acá, solo respetamos preferencia
      }
    }

    window.addEventListener("resize", function () {
      if (isMobileDesktopLayout()) return;
      for (var j = 0; j < icons.length; j++) {
        var el2 = icons[j];
        var id2 = el2.__desktopId;
        if (positions[id2]) applyPos(el2, positions[id2]);
      }
      save();
    });
  }

  function initBioWindow() {
    var panel = document.getElementById("bio-panel");
    var toggle = document.getElementById("bio-toggle");
    var closeBtn = document.getElementById("bio-close");
    var chrome = panel ? panel.querySelector(".bio-panel__chrome") : null;
    var titlebar = panel ? panel.querySelector(".bio-panel__titlebar") : null;
    var page = panel ? panel.querySelector(".bio-panel__page") : null;
    if (!panel || !toggle || !chrome || !titlebar) return;

    /** @type {{ left: number, top: number } | null} */
    var savedPos = null;
    var drag = null;

    function applySavedPosition() {
      if (savedPos) {
        chrome.classList.add("bio-panel__chrome--dragging");
        chrome.style.left = savedPos.left + "px";
        chrome.style.top = savedPos.top + "px";
        chrome.style.transform = "none";
      } else {
        chrome.classList.remove("bio-panel__chrome--dragging");
        chrome.style.left = "";
        chrome.style.top = "";
        chrome.style.transform = "";
      }
    }

    function clampPos(left, top) {
      var rect = chrome.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;
      var margin = 8;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var maxL = Math.max(margin, vw - w - margin);
      var maxT = Math.max(margin, vh - h - margin);
      return {
        left: Math.min(Math.max(left, margin), maxL),
        top: Math.min(Math.max(top, margin), maxT),
      };
    }

    function startDrag(clientX, clientY) {
      var rect = chrome.getBoundingClientRect();
      if (!savedPos) {
        savedPos = { left: rect.left, top: rect.top };
        applySavedPosition();
        rect = chrome.getBoundingClientRect();
      }
      drag = {
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
      };
      document.body.style.cursor = "grabbing";
      titlebar.style.cursor = "grabbing";
    }

    function moveDrag(clientX, clientY) {
      if (!drag) return;
      var next = clampPos(clientX - drag.offsetX, clientY - drag.offsetY);
      savedPos = next;
      chrome.style.left = next.left + "px";
      chrome.style.top = next.top + "px";
    }

    function endDrag() {
      if (!drag) return;
      drag = null;
      document.body.style.cursor = "";
      titlebar.style.cursor = "";
    }

    function onTitlebarDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest(".bio-panel__close")) return;
      var clientX;
      var clientY;
      if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      e.preventDefault();
      startDrag(clientX, clientY);
      if (e.type === "touchstart") {
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEnd);
        window.addEventListener("touchcancel", onTouchEnd);
      } else {
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      }
    }

    function onMouseMove(e) {
      moveDrag(e.clientX, e.clientY);
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      endDrag();
    }

    function onTouchMove(e) {
      if (!e.touches || !e.touches[0]) return;
      e.preventDefault();
      var t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    }

    function onTouchEnd() {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      endDrag();
    }

    function openPanel() {
      panel.hidden = false;
      WindowStack.bringToFront(panel);
      applySavedPosition();
      if (page && page.focus) page.focus();
    }

    function closePanel() {
      panel.hidden = true;
      endDrag();
      if (toggle) toggle.focus();
    }

    toggle.addEventListener("dblclick", openPanel);
    toggle.addEventListener("click", openPanel);
    if (closeBtn) closeBtn.addEventListener("click", closePanel);

    titlebar.addEventListener("mousedown", onTitlebarDown);
    titlebar.addEventListener("touchstart", onTitlebarDown, { passive: false });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) closePanel();
    });

    window.addEventListener("resize", function () {
      if (panel.hidden || !savedPos) return;
      var c = clampPos(savedPos.left, savedPos.top);
      savedPos = c;
      chrome.style.left = c.left + "px";
      chrome.style.top = c.top + "px";
    });

    WindowStack.register(panel);
  }

  function initLetrasWindow() {
    var panel = document.getElementById("lyrics-index-panel");
    var toggle = document.getElementById("letras-toggle");
    var closeBtn = document.getElementById("lyrics-index-close");
    var list = document.getElementById("lyrics-index-list");
    var chrome = panel ? panel.querySelector(".lyrics-index-panel__chrome") : null;
    var titlebar = panel ? panel.querySelector(".lyrics-index-panel__titlebar") : null;
    if (!panel || !toggle || !closeBtn || !list || !chrome || !titlebar) return;

    var tracksPromise = null;
    var listBuilt = false;

    /** @type {{ left: number, top: number } | null} */
    var savedPos = null;
    var drag = null;

    function trackHasLyrics(t) {
      if (!t || typeof t.lyrics !== "string") return false;
      var s = t.lyrics.trim();
      if (!s) return false;
      if (/no hay letras publicadas/i.test(s)) return false;
      return true;
    }

    function loadTracks() {
      if (!tracksPromise) {
        tracksPromise = fetch("lyrics-cancheros.json")
          .then(function (r) {
            if (!r.ok) throw new Error("bad response");
            return r.json();
          })
          .then(function (data) {
            if (!Array.isArray(data)) return [];
            return data.filter(trackHasLyrics);
          })
          .catch(function () {
            return [];
          });
      }
      return tracksPromise;
    }

    function applySavedPosition() {
      if (savedPos) {
        chrome.classList.add("lyrics-index-panel__chrome--dragging");
        chrome.style.left = savedPos.left + "px";
        chrome.style.top = savedPos.top + "px";
        chrome.style.transform = "none";
      } else {
        chrome.classList.remove("lyrics-index-panel__chrome--dragging");
        chrome.style.left = "";
        chrome.style.top = "";
        chrome.style.transform = "";
      }
    }

    function clampPos(left, top) {
      var rect = chrome.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;
      var margin = 8;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var maxL = Math.max(margin, vw - w - margin);
      var maxT = Math.max(margin, vh - h - margin);
      return {
        left: Math.min(Math.max(left, margin), maxL),
        top: Math.min(Math.max(top, margin), maxT),
      };
    }

    function startDrag(clientX, clientY) {
      var rect = chrome.getBoundingClientRect();
      if (!savedPos) {
        savedPos = { left: rect.left, top: rect.top };
        applySavedPosition();
        rect = chrome.getBoundingClientRect();
      }
      drag = {
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
      };
      document.body.style.cursor = "grabbing";
      titlebar.style.cursor = "grabbing";
    }

    function moveDrag(clientX, clientY) {
      if (!drag) return;
      var next = clampPos(clientX - drag.offsetX, clientY - drag.offsetY);
      savedPos = next;
      chrome.style.left = next.left + "px";
      chrome.style.top = next.top + "px";
    }

    function endDrag() {
      if (!drag) return;
      drag = null;
      document.body.style.cursor = "";
      titlebar.style.cursor = "";
    }

    function onIndexTitlebarDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest(".lyrics-index-panel__close")) return;
      var clientX;
      var clientY;
      if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      e.preventDefault();
      startDrag(clientX, clientY);
      if (e.type === "touchstart") {
        window.addEventListener("touchmove", onIndexTouchMove, { passive: false });
        window.addEventListener("touchend", onIndexTouchEnd);
        window.addEventListener("touchcancel", onIndexTouchEnd);
      } else {
        window.addEventListener("mousemove", onIndexMouseMove);
        window.addEventListener("mouseup", onIndexMouseUp);
      }
    }

    function onIndexMouseMove(e) {
      moveDrag(e.clientX, e.clientY);
    }

    function onIndexMouseUp() {
      window.removeEventListener("mousemove", onIndexMouseMove);
      window.removeEventListener("mouseup", onIndexMouseUp);
      endDrag();
    }

    function onIndexTouchMove(e) {
      if (!e.touches || !e.touches[0]) return;
      e.preventDefault();
      var t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    }

    function onIndexTouchEnd() {
      window.removeEventListener("touchmove", onIndexTouchMove);
      window.removeEventListener("touchend", onIndexTouchEnd);
      window.removeEventListener("touchcancel", onIndexTouchEnd);
      endDrag();
    }

    async function openIndex() {
      panel.hidden = false;
      WindowStack.bringToFront(panel);
      applySavedPosition();
      if (!listBuilt) {
        var tracks = await loadTracks();
        list.innerHTML = "";
        if (!tracks.length) {
          var li0 = document.createElement("li");
          li0.className = "lyrics-index-panel__msg";
          li0.textContent = "No se pudieron cargar las letras (lyrics-cancheros.json).";
          list.appendChild(li0);
        } else {
          for (var i = 0; i < tracks.length; i++) {
            var t = tracks[i];
            var li = document.createElement("li");
            li.className = "lyrics-index-panel__file-item";
            li.setAttribute("role", "listitem");
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "lyrics-index-panel__file";
            btn.setAttribute("data-lyrics-index", String(i));
            btn.setAttribute("title", t.title || "Tema");
            var lab = document.createElement("span");
            lab.className = "lyrics-index-panel__file-label";
            lab.textContent = t.title || "Tema";
            btn.appendChild(lab);
            li.appendChild(btn);
            list.appendChild(li);
          }
        }
        listBuilt = true;
      }
    }

    function closeIndex() {
      panel.hidden = true;
      endDrag();
      if (toggle) toggle.focus();
    }

    function attachSongDrag(chromeEl, titlebarEl, closeBtnEl, onRemove) {
      var sPos = null;
      var sDrag = null;

      function sClamp(left, top) {
        var rect = chromeEl.getBoundingClientRect();
        var w = rect.width;
        var h = rect.height;
        var margin = 8;
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var maxL = Math.max(margin, vw - w - margin);
        var maxT = Math.max(margin, vh - h - margin);
        return {
          left: Math.min(Math.max(left, margin), maxL),
          top: Math.min(Math.max(top, margin), maxT),
        };
      }

      function sApply() {
        if (sPos) {
          chromeEl.classList.add("lyrics-song-window__chrome--dragging");
          chromeEl.style.left = sPos.left + "px";
          chromeEl.style.top = sPos.top + "px";
          chromeEl.style.transform = "none";
        }
      }

      function sStart(clientX, clientY) {
        var rect = chromeEl.getBoundingClientRect();
        if (!sPos) {
          sPos = { left: rect.left, top: rect.top };
          sApply();
          rect = chromeEl.getBoundingClientRect();
        }
        sDrag = {
          offsetX: clientX - rect.left,
          offsetY: clientY - rect.top,
        };
        document.body.style.cursor = "grabbing";
        titlebarEl.style.cursor = "grabbing";
      }

      function sMove(clientX, clientY) {
        if (!sDrag) return;
        var next = sClamp(clientX - sDrag.offsetX, clientY - sDrag.offsetY);
        sPos = next;
        chromeEl.style.left = next.left + "px";
        chromeEl.style.top = next.top + "px";
      }

      function sEnd() {
        if (!sDrag) return;
        sDrag = null;
        document.body.style.cursor = "";
        titlebarEl.style.cursor = "";
      }

      function onDown(e) {
        if (e.button !== undefined && e.button !== 0) return;
        if (e.target && e.target.closest && e.target.closest(".lyrics-song-window__close")) return;
        var cx;
        var cy;
        if (e.touches && e.touches[0]) {
          cx = e.touches[0].clientX;
          cy = e.touches[0].clientY;
        } else {
          cx = e.clientX;
          cy = e.clientY;
        }
        e.preventDefault();
        sStart(cx, cy);
        if (e.type === "touchstart") {
          window.addEventListener("touchmove", onTM, { passive: false });
          window.addEventListener("touchend", onTE);
          window.addEventListener("touchcancel", onTE);
        } else {
          window.addEventListener("mousemove", onMM);
          window.addEventListener("mouseup", onMU);
        }
      }

      function onMM(e) {
        sMove(e.clientX, e.clientY);
      }

      function onMU() {
        window.removeEventListener("mousemove", onMM);
        window.removeEventListener("mouseup", onMU);
        sEnd();
      }

      function onTM(e) {
        if (!e.touches || !e.touches[0]) return;
        e.preventDefault();
        var t = e.touches[0];
        sMove(t.clientX, t.clientY);
      }

      function onTE() {
        window.removeEventListener("touchmove", onTM);
        window.removeEventListener("touchend", onTE);
        window.removeEventListener("touchcancel", onTE);
        sEnd();
      }

      titlebarEl.addEventListener("mousedown", onDown);
      titlebarEl.addEventListener("touchstart", onDown, { passive: false });

      closeBtnEl.addEventListener("click", function () {
        onRemove();
      });
    }

    function openSongWindow(track, idx) {
      var root = document.createElement("section");
      root.className = "lyrics-song-window";
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-label", track.title || "Letra");

      var chromeEl = document.createElement("div");
      chromeEl.className = "lyrics-song-window__chrome";

      var tb = document.createElement("div");
      tb.className = "lyrics-song-window__titlebar";
      var ttl = document.createElement("span");
      ttl.className = "lyrics-song-window__title";
      ttl.textContent = (track.title || "Tema") + " — Microsoft Word";
      var xb = document.createElement("button");
      xb.type = "button";
      xb.className = "lyrics-song-window__close";
      xb.setAttribute("aria-label", "Cerrar");
      xb.textContent = "×";
      tb.appendChild(ttl);
      tb.appendChild(xb);

      var menu = document.createElement("div");
      menu.className = "lyrics-song-window__menubar";
      menu.setAttribute("aria-hidden", "true");
      menu.innerHTML =
        "<span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Help</span>";

      var doc = document.createElement("div");
      doc.className = "lyrics-song-window__doc";
      var page = document.createElement("div");
      page.className = "lyrics-song-window__page";
      page.textContent = track.lyrics || "";

      doc.appendChild(page);
      chromeEl.appendChild(tb);
      chromeEl.appendChild(menu);
      chromeEl.appendChild(doc);
      root.appendChild(chromeEl);
      document.body.appendChild(root);
      WindowStack.register(root);
      WindowStack.bringToFront(root);

      function removeRoot() {
        if (root.parentNode) root.parentNode.removeChild(root);
      }

      attachSongDrag(chromeEl, tb, xb, removeRoot);

      window.requestAnimationFrame(function () {
        var r = chromeEl.getBoundingClientRect();
        var off = (idx % 5) * 20 + ((idx * 17) % 36);
        var left = (window.innerWidth - r.width) / 2 + off * 0.5;
        var top = (window.innerHeight - r.height) / 2 + off * 0.35;
        var c = {
          left: Math.min(Math.max(8, left), Math.max(8, window.innerWidth - r.width - 8)),
          top: Math.min(Math.max(8, top), Math.max(8, window.innerHeight - r.height - 8)),
        };
        chromeEl.classList.add("lyrics-song-window__chrome--dragging");
        chromeEl.style.left = c.left + "px";
        chromeEl.style.top = c.top + "px";
        chromeEl.style.transform = "none";
      });
    }

    list.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest(".lyrics-index-panel__file") : null;
      if (!btn) return;
      var ix = parseInt(btn.getAttribute("data-lyrics-index"), 10);
      if (isNaN(ix)) return;
      loadTracks().then(function (tracks) {
        if (!tracks[ix]) return;
        openSongWindow(tracks[ix], ix);
      });
    });

    toggle.addEventListener("dblclick", openIndex);
    toggle.addEventListener("click", openIndex);
    closeBtn.addEventListener("click", closeIndex);

    titlebar.addEventListener("mousedown", onIndexTitlebarDown);
    titlebar.addEventListener("touchstart", onIndexTitlebarDown, { passive: false });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) closeIndex();
    });

    window.addEventListener("resize", function () {
      if (panel.hidden || !savedPos) return;
      var c = clampPos(savedPos.left, savedPos.top);
      savedPos = c;
      chrome.style.left = c.left + "px";
      chrome.style.top = c.top + "px";
    });

    WindowStack.register(panel);
  }

  /** @type {Promise<object> | null} */
  var catalogPromise = null;

  function loadCatalog() {
    if (!catalogPromise) {
      catalogPromise = import("./audio/catalog.mjs");
    }
    return catalogPromise;
  }

  function whenPlayerReady(cb) {
    if (window.CancherosPlayer) {
      cb();
      return;
    }
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      if (window.CancherosPlayer) {
        window.clearInterval(timer);
        cb();
      } else if (attempts > 60) {
        window.clearInterval(timer);
      }
    }, 100);
  }

  function playDiscoCancherosAlbum() {
    whenPlayerReady(function () {
      loadCatalog()
        .then(function (mod) {
          if (!mod || !mod.albumCancheros || !window.CancherosPlayer) return;
          var album = mod.albumCancheros;
          var art = mod.DISCO_ARTWORK || album.artwork || "img/disco-cancheros.jpg";
          if (typeof window.CancherosPlayer.loadAlbum === "function") {
            window.CancherosPlayer.loadAlbum({
              title: album.title,
              artwork: art,
              tracks: album.tracks,
            });
          } else {
            window.CancherosPlayer.loadPlaylist({ tracks: album.tracks });
          }
        })
        .catch(function (e) {
          console.error("Disco Cancheros:", e);
        });
    });
  }

  function initFooterPlayer() {
    import("./footer-player.mjs")
      .then(function (mod) {
        if (mod && typeof mod.initFooterPlayerGlobal === "function") {
          mod.initFooterPlayerGlobal();
          playDiscoCancherosAlbum();
        }
      })
      .catch(function (e) {
        console.error("Footer player:", e);
      });
  }

  function initDiscoCancherosIcon() {
    var toggle = document.getElementById("disco-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", playDiscoCancherosAlbum);
  }

  function initDoomWindow() {
    var panel = document.getElementById("doom-panel");
    var toggle = document.getElementById("doom-toggle");
    var closeBtn = document.getElementById("doom-close");
    var iframe = panel ? panel.querySelector(".doom-panel__frame") : null;
    var chrome = panel ? panel.querySelector(".doom-panel__chrome") : null;
    var titlebar = panel ? panel.querySelector(".doom-panel__titlebar") : null;
    if (!panel || !toggle || !closeBtn || !chrome || !titlebar) return;

    /** @type {{ left: number, top: number } | null} */
    var savedPos = null;
    var drag = null;

    function applySavedPosition() {
      if (savedPos) {
        chrome.classList.add("doom-panel__chrome--dragging");
        chrome.style.left = savedPos.left + "px";
        chrome.style.top = savedPos.top + "px";
        chrome.style.transform = "none";
      } else {
        chrome.classList.remove("doom-panel__chrome--dragging");
        chrome.style.left = "";
        chrome.style.top = "";
        chrome.style.transform = "";
      }
    }

    function clampPos(left, top) {
      var rect = chrome.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;
      var margin = 8;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var maxL = Math.max(margin, vw - w - margin);
      var maxT = Math.max(margin, vh - h - margin);
      return {
        left: Math.min(Math.max(left, margin), maxL),
        top: Math.min(Math.max(top, margin), maxT),
      };
    }

    function startDrag(clientX, clientY) {
      var rect = chrome.getBoundingClientRect();
      if (!savedPos) {
        savedPos = { left: rect.left, top: rect.top };
        applySavedPosition();
        rect = chrome.getBoundingClientRect();
      }
      drag = {
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
      };
      document.body.style.cursor = "grabbing";
      titlebar.style.cursor = "grabbing";
    }

    function moveDrag(clientX, clientY) {
      if (!drag) return;
      var next = clampPos(clientX - drag.offsetX, clientY - drag.offsetY);
      savedPos = next;
      chrome.style.left = next.left + "px";
      chrome.style.top = next.top + "px";
    }

    function endDrag() {
      if (!drag) return;
      drag = null;
      document.body.style.cursor = "";
      titlebar.style.cursor = "";
    }

    function onTitlebarDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest(".doom-panel__close")) return;
      var clientX;
      var clientY;
      if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      e.preventDefault();
      startDrag(clientX, clientY);
      if (e.type === "touchstart") {
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEnd);
        window.addEventListener("touchcancel", onTouchEnd);
      } else {
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      }
    }

    function onMouseMove(e) {
      moveDrag(e.clientX, e.clientY);
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      endDrag();
    }

    function onTouchMove(e) {
      if (!e.touches || !e.touches[0]) return;
      e.preventDefault();
      var t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    }

    function onTouchEnd() {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      endDrag();
    }

    function ensureDoomLoaded() {
      if (!iframe || !iframe.dataset || !iframe.dataset.doomSrc) return;
      if (iframe.getAttribute("data-loaded") === "1") return;
      iframe.src = iframe.dataset.doomSrc;
      iframe.setAttribute("data-loaded", "1");
    }

    function unloadDoom() {
      if (!iframe) return;
      iframe.src = "about:blank";
      iframe.removeAttribute("data-loaded");
    }

    function openPanel() {
      panel.hidden = false;
      WindowStack.bringToFront(panel);
      applySavedPosition();
      ensureDoomLoaded();
    }

    function closePanel() {
      unloadDoom();
      panel.hidden = true;
      endDrag();
      if (toggle) toggle.focus();
    }

    toggle.addEventListener("dblclick", openPanel);
    toggle.addEventListener("click", openPanel);
    closeBtn.addEventListener("click", closePanel);

    titlebar.addEventListener("mousedown", onTitlebarDown);
    titlebar.addEventListener("touchstart", onTitlebarDown, { passive: false });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) closePanel();
    });

    window.addEventListener("resize", function () {
      if (panel.hidden || !savedPos) return;
      var c = clampPos(savedPos.left, savedPos.top);
      savedPos = c;
      chrome.style.left = c.left + "px";
      chrome.style.top = c.top + "px";
    });

    WindowStack.register(panel);
  }

  function initSnakeWindow() {
    var panel = document.getElementById("snake-panel");
    var toggle = document.getElementById("snake-toggle");
    var closeBtn = document.getElementById("snake-close");
    var canvas = document.getElementById("snake-canvas");
    var scoreEl = document.getElementById("snake-score");
    var chrome = panel ? panel.querySelector(".snake-panel__chrome") : null;
    var titlebar = panel ? panel.querySelector(".snake-panel__titlebar") : null;
    if (!panel || !toggle || !closeBtn || !canvas || !chrome || !titlebar || !scoreEl) return;

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var COLS = 20;
    var ROWS = 20;
    var CELL = 20;
    var W = COLS * CELL;
    var H = ROWS * CELL;

    /** @type {{ x: number, y: number }[]} */
    var snake = [];
    /** @type {{ x: number, y: number }} */
    var food = { x: 0, y: 0 };
    var dir = { dx: 1, dy: 0 };
    var nextDir = { dx: 1, dy: 0 };
    var score = 0;
    var alive = true;
    var tickId = null;

    /** @type {{ left: number, top: number } | null} */
    var savedPos = null;
    var drag = null;

    function applySavedPosition() {
      if (savedPos) {
        chrome.classList.add("snake-panel__chrome--dragging");
        chrome.style.left = savedPos.left + "px";
        chrome.style.top = savedPos.top + "px";
        chrome.style.transform = "none";
      } else {
        chrome.classList.remove("snake-panel__chrome--dragging");
        chrome.style.left = "";
        chrome.style.top = "";
        chrome.style.transform = "";
      }
    }

    function clampPos(left, top) {
      var rect = chrome.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;
      var margin = 8;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var maxL = Math.max(margin, vw - w - margin);
      var maxT = Math.max(margin, vh - h - margin);
      return {
        left: Math.min(Math.max(left, margin), maxL),
        top: Math.min(Math.max(top, margin), maxT),
      };
    }

    function startDrag(clientX, clientY) {
      var rect = chrome.getBoundingClientRect();
      if (!savedPos) {
        savedPos = { left: rect.left, top: rect.top };
        applySavedPosition();
        rect = chrome.getBoundingClientRect();
      }
      drag = {
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
      };
      document.body.style.cursor = "grabbing";
      titlebar.style.cursor = "grabbing";
    }

    function moveDrag(clientX, clientY) {
      if (!drag) return;
      var next = clampPos(clientX - drag.offsetX, clientY - drag.offsetY);
      savedPos = next;
      chrome.style.left = next.left + "px";
      chrome.style.top = next.top + "px";
    }

    function endDrag() {
      if (!drag) return;
      drag = null;
      document.body.style.cursor = "";
      titlebar.style.cursor = "";
    }

    function onTitlebarDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest(".snake-panel__close")) return;
      var clientX;
      var clientY;
      if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      e.preventDefault();
      startDrag(clientX, clientY);
      if (e.type === "touchstart") {
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEndDrag);
        window.addEventListener("touchcancel", onTouchEndDrag);
      } else {
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      }
    }

    function onMouseMove(e) {
      moveDrag(e.clientX, e.clientY);
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      endDrag();
    }

    function onTouchMove(e) {
      if (!e.touches || !e.touches[0]) return;
      e.preventDefault();
      var t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    }

    function onTouchEndDrag() {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEndDrag);
      window.removeEventListener("touchcancel", onTouchEndDrag);
      endDrag();
    }

    function randInt(n) {
      return Math.floor(Math.random() * n);
    }

    function placeFood() {
      var t;
      for (t = 0; t < 400; t++) {
        var fx = randInt(COLS);
        var fy = randInt(ROWS);
        var clash = false;
        var i;
        for (i = 0; i < snake.length; i++) {
          if (snake[i].x === fx && snake[i].y === fy) {
            clash = true;
            break;
          }
        }
        if (!clash) {
          food.x = fx;
          food.y = fy;
          return;
        }
      }
    }

    function setNextDir(ndx, ndy) {
      if (ndx === -dir.dx && ndy === -dir.dy) return;
      nextDir.dx = ndx;
      nextDir.dy = ndy;
    }

    function draw() {
      ctx.fillStyle = "#0f140f";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#1a221a";
      var gx;
      var gy;
      for (gx = 0; gx <= COLS; gx++) {
        ctx.beginPath();
        ctx.moveTo(gx * CELL, 0);
        ctx.lineTo(gx * CELL, H);
        ctx.stroke();
      }
      for (gy = 0; gy <= ROWS; gy++) {
        ctx.beginPath();
        ctx.moveTo(0, gy * CELL);
        ctx.lineTo(W, gy * CELL);
        ctx.stroke();
      }
      var s;
      ctx.fillStyle = "#3d7c3d";
      for (s = 0; s < snake.length; s++) {
        var seg = snake[s];
        ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
      }
      ctx.fillStyle = "#c62828";
      ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);
      if (!alive) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff";
        ctx.font = 'bold 22px Geist Mono, "MS Sans Serif", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("GAME OVER", W / 2, H / 2 - 14);
        ctx.font = '14px Geist Mono, "MS Sans Serif", sans-serif';
        ctx.fillText("Espacio: otra partida", W / 2, H / 2 + 14);
      }
    }

    function die() {
      alive = false;
      draw();
    }

    function tick() {
      if (!alive) return;
      dir.dx = nextDir.dx;
      dir.dy = nextDir.dy;
      var head = snake[0];
      var nx = head.x + dir.dx;
      var ny = head.y + dir.dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
        die();
        return;
      }
      var eating = nx === food.x && ny === food.y;
      var limit = eating ? snake.length : snake.length - 1;
      var j;
      for (j = 0; j < limit; j++) {
        if (snake[j].x === nx && snake[j].y === ny) {
          die();
          return;
        }
      }
      var newHead = { x: nx, y: ny };
      snake.unshift(newHead);
      if (eating) {
        score += 1;
        scoreEl.textContent = String(score);
        placeFood();
      } else {
        snake.pop();
      }
      draw();
    }

    function resetGame() {
      snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
      ];
      dir = { dx: 1, dy: 0 };
      nextDir = { dx: 1, dy: 0 };
      score = 0;
      alive = true;
      scoreEl.textContent = "0";
      placeFood();
      draw();
    }

    function startLoop() {
      stopLoop();
      tickId = window.setInterval(tick, 130);
    }

    function stopLoop() {
      if (tickId) {
        window.clearInterval(tickId);
        tickId = null;
      }
    }

    function onKeyDown(e) {
      if (panel.hidden) return;
      var k = e.key;
      if (k === "ArrowUp" || k === "w" || k === "W") {
        setNextDir(0, -1);
        e.preventDefault();
      } else if (k === "ArrowDown" || k === "s" || k === "S") {
        setNextDir(0, 1);
        e.preventDefault();
      } else if (k === "ArrowLeft" || k === "a" || k === "A") {
        setNextDir(-1, 0);
        e.preventDefault();
      } else if (k === "ArrowRight" || k === "d" || k === "D") {
        setNextDir(1, 0);
        e.preventDefault();
      } else if (k === " " || k === "Enter") {
        resetGame();
        startLoop();
        e.preventDefault();
      }
    }

    var touchStart = null;
    function onCanvasTouchStart(ev) {
      if (panel.hidden || !ev.touches || ev.touches.length !== 1) return;
      var t = ev.touches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    }

    function onCanvasTouchEnd(ev) {
      if (panel.hidden || !touchStart || !ev.changedTouches || !ev.changedTouches.length) return;
      var t = ev.changedTouches[0];
      var dx = t.clientX - touchStart.x;
      var dy = t.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) + Math.abs(dy) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        setNextDir(dx > 0 ? 1 : -1, 0);
      } else {
        setNextDir(0, dy > 0 ? 1 : -1);
      }
      ev.preventDefault();
    }

    function openPanel() {
      panel.hidden = false;
      WindowStack.bringToFront(panel);
      applySavedPosition();
      resetGame();
      startLoop();
      window.setTimeout(function () {
        canvas.focus();
      }, 0);
    }

    function closePanel() {
      stopLoop();
      panel.hidden = true;
      endDrag();
      if (toggle) toggle.focus();
    }

    toggle.addEventListener("dblclick", openPanel);
    toggle.addEventListener("click", openPanel);
    closeBtn.addEventListener("click", closePanel);

    titlebar.addEventListener("mousedown", onTitlebarDown);
    titlebar.addEventListener("touchstart", onTitlebarDown, { passive: false });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) closePanel();
    });

    document.addEventListener("keydown", onKeyDown, true);

    canvas.addEventListener("touchstart", onCanvasTouchStart, { passive: true });
    canvas.addEventListener("touchend", onCanvasTouchEnd, { passive: false });

    window.addEventListener("resize", function () {
      if (panel.hidden || !savedPos) return;
      var c = clampPos(savedPos.left, savedPos.top);
      savedPos = c;
      chrome.style.left = c.left + "px";
      chrome.style.top = c.top + "px";
    });

    WindowStack.register(panel);
  }

  function initPelisWindow() {
    var PELIS_ITEMS = [
      { title: "EL ARREGLO", youtubeId: "xBlRv96rqDo" },
      { title: "PIZZA BIRRA Y FASO", youtubeId: "eaUwe1sXz0E" },
      { title: "UN PESO UN DOLAR", youtubeId: "nSPoBG46eTU" },
      { title: "INDUSTRIA ARGENTINA", youtubeId: "EciYPQHzJwQ" },
      {
        title: "PERON SINFONIA DEL SENTIMIENTO CAP 1",
        youtubeId: "uxRRUUUIQ7k",
      },
    ];

    var panel = document.getElementById("pelis-index-panel");
    var toggle = document.getElementById("pelis-toggle");
    var closeBtn = document.getElementById("pelis-index-close");
    var list = document.getElementById("pelis-index-list");
    var chrome = panel ? panel.querySelector(".pelis-index-panel__chrome") : null;
    var titlebar = panel ? panel.querySelector(".pelis-index-panel__titlebar") : null;
    if (!panel || !toggle || !closeBtn || !list || !chrome || !titlebar) return;

    /** @type {{ left: number, top: number } | null} */
    var savedPos = null;
    var drag = null;
    var winSerial = 0;

    function applySavedPosition() {
      if (savedPos) {
        chrome.classList.add("pelis-index-panel__chrome--dragging");
        chrome.style.left = savedPos.left + "px";
        chrome.style.top = savedPos.top + "px";
        chrome.style.transform = "none";
      } else {
        chrome.classList.remove("pelis-index-panel__chrome--dragging");
        chrome.style.left = "";
        chrome.style.top = "";
        chrome.style.transform = "";
      }
    }

    function clampPos(left, top) {
      var rect = chrome.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;
      var margin = 8;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var maxL = Math.max(margin, vw - w - margin);
      var maxT = Math.max(margin, vh - h - margin);
      return {
        left: Math.min(Math.max(left, margin), maxL),
        top: Math.min(Math.max(top, margin), maxT),
      };
    }

    function startDrag(clientX, clientY) {
      var rect = chrome.getBoundingClientRect();
      if (!savedPos) {
        savedPos = { left: rect.left, top: rect.top };
        applySavedPosition();
        rect = chrome.getBoundingClientRect();
      }
      drag = {
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
      };
      document.body.style.cursor = "grabbing";
      titlebar.style.cursor = "grabbing";
    }

    function moveDrag(clientX, clientY) {
      if (!drag) return;
      var next = clampPos(clientX - drag.offsetX, clientY - drag.offsetY);
      savedPos = next;
      chrome.style.left = next.left + "px";
      chrome.style.top = next.top + "px";
    }

    function endDrag() {
      if (!drag) return;
      drag = null;
      document.body.style.cursor = "";
      titlebar.style.cursor = "";
    }

    function onIndexTitlebarDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest(".pelis-index-panel__close")) return;
      var clientX;
      var clientY;
      if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      e.preventDefault();
      startDrag(clientX, clientY);
      if (e.type === "touchstart") {
        window.addEventListener("touchmove", onIndexTouchMove, { passive: false });
        window.addEventListener("touchend", onIndexTouchEnd);
        window.addEventListener("touchcancel", onIndexTouchEnd);
      } else {
        window.addEventListener("mousemove", onIndexMouseMove);
        window.addEventListener("mouseup", onIndexMouseUp);
      }
    }

    function onIndexMouseMove(e) {
      moveDrag(e.clientX, e.clientY);
    }

    function onIndexMouseUp() {
      window.removeEventListener("mousemove", onIndexMouseMove);
      window.removeEventListener("mouseup", onIndexMouseUp);
      endDrag();
    }

    function onIndexTouchMove(e) {
      if (!e.touches || !e.touches[0]) return;
      e.preventDefault();
      var t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    }

    function onIndexTouchEnd() {
      window.removeEventListener("touchmove", onIndexTouchMove);
      window.removeEventListener("touchend", onIndexTouchEnd);
      window.removeEventListener("touchcancel", onIndexTouchEnd);
      endDrag();
    }

    function openIndex() {
      panel.hidden = false;
      WindowStack.bringToFront(panel);
      applySavedPosition();
    }

    function closeIndex() {
      panel.hidden = true;
      endDrag();
      toggle.focus();
    }

    function buildList() {
      list.innerHTML = "";
      for (var i = 0; i < PELIS_ITEMS.length; i++) {
        var it = PELIS_ITEMS[i];
        var li = document.createElement("li");
        li.className = "pelis-index-panel__file-item";
        li.setAttribute("role", "listitem");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pelis-index-panel__file";
        btn.setAttribute("data-youtube-id", it.youtubeId);
        if (it.embedSi) btn.setAttribute("data-youtube-si", it.embedSi);
        btn.setAttribute("data-pelis-title", it.title);
        btn.setAttribute("title", it.title);
        var lab = document.createElement("span");
        lab.className = "pelis-index-panel__file-label";
        lab.textContent = it.title;
        btn.appendChild(lab);
        li.appendChild(btn);
        list.appendChild(li);
      }
    }

    function openPeliPlayer(title, videoId, embedSi) {
      winSerial += 1;
      var root = document.createElement("section");
      root.className = "pelis-player-panel";
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-label", title);

      var pch = document.createElement("div");
      pch.className = "pelis-player-panel__chrome";
      var ptb = document.createElement("div");
      ptb.className = "pelis-player-panel__titlebar";
      var ptt = document.createElement("span");
      ptt.className = "pelis-player-panel__title";
      ptt.textContent = title;
      var pxb = document.createElement("button");
      pxb.type = "button";
      pxb.className = "pelis-player-panel__close";
      pxb.setAttribute("aria-label", "Cerrar reproductor");
      pxb.textContent = "×";
      var pfr = document.createElement("div");
      pfr.className = "pelis-player-panel__frame";
      var ifr = document.createElement("iframe");
      ifr.className = "pelis-player-panel__iframe";
      var embedSrc;
      if (embedSi) {
        embedSrc =
          "https://www.youtube.com/embed/" +
          encodeURIComponent(videoId) +
          "?si=" +
          encodeURIComponent(embedSi);
      } else {
        embedSrc =
          "https://www.youtube-nocookie.com/embed/" +
          encodeURIComponent(videoId) +
          "?rel=0&modestbranding=1&playsinline=1";
      }
      var pageOrigin = "";
      try {
        if (
          window.location &&
          (window.location.protocol === "https:" ||
            window.location.protocol === "http:")
        ) {
          pageOrigin = window.location.origin;
        }
      } catch (err) {}
      if (pageOrigin) {
        embedSrc += "&origin=" + encodeURIComponent(pageOrigin);
      }
      ifr.setAttribute("title", title);
      ifr.setAttribute("allowfullscreen", "");
      ifr.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      );
      ifr.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

      ptb.appendChild(ptt);
      if (embedSi) {
        var ytOpen = document.createElement("a");
        ytOpen.className = "pelis-player-panel__yt-open";
        ytOpen.href =
          "https://www.youtube.com/watch?v=" +
          encodeURIComponent(videoId) +
          "&si=" +
          encodeURIComponent(embedSi);
        ytOpen.target = "_blank";
        ytOpen.rel = "noopener noreferrer";
        ytOpen.textContent = "";
        ytOpen.setAttribute("aria-label", "");
        ptb.appendChild(ytOpen);
      }
      ptb.appendChild(pxb);
      pfr.appendChild(ifr);
      pch.appendChild(ptb);
      pch.appendChild(pfr);
      root.appendChild(pch);
      document.body.appendChild(root);

      var pPos = null;
      var pDrag = null;

      function pClamp(left, top) {
        var rect = pch.getBoundingClientRect();
        var w = rect.width;
        var h = rect.height;
        var margin = 8;
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var maxL = Math.max(margin, vw - w - margin);
        var maxT = Math.max(margin, vh - h - margin);
        return {
          left: Math.min(Math.max(left, margin), maxL),
          top: Math.min(Math.max(top, margin), maxT),
        };
      }

      function pApply() {
        if (pPos) {
          pch.classList.add("pelis-player-panel__chrome--dragging");
          pch.style.left = pPos.left + "px";
          pch.style.top = pPos.top + "px";
          pch.style.transform = "none";
        }
      }

      function pStart(clientX, clientY) {
        var rect = pch.getBoundingClientRect();
        if (!pPos) {
          pPos = { left: rect.left, top: rect.top };
          pApply();
          rect = pch.getBoundingClientRect();
        }
        pDrag = {
          offsetX: clientX - rect.left,
          offsetY: clientY - rect.top,
        };
        document.body.style.cursor = "grabbing";
        ptb.style.cursor = "grabbing";
      }

      function pMove(clientX, clientY) {
        if (!pDrag) return;
        var next = pClamp(clientX - pDrag.offsetX, clientY - pDrag.offsetY);
        pPos = next;
        pch.style.left = next.left + "px";
        pch.style.top = next.top + "px";
      }

      function pEnd() {
        if (!pDrag) return;
        pDrag = null;
        document.body.style.cursor = "";
        ptb.style.cursor = "";
      }

      function onPTitleDown(e) {
        if (e.button !== undefined && e.button !== 0) return;
        if (e.target && e.target.closest && e.target.closest(".pelis-player-panel__close")) return;
        var cx;
        var cy;
        if (e.touches && e.touches[0]) {
          cx = e.touches[0].clientX;
          cy = e.touches[0].clientY;
        } else {
          cx = e.clientX;
          cy = e.clientY;
        }
        e.preventDefault();
        pStart(cx, cy);
        if (e.type === "touchstart") {
          window.addEventListener("touchmove", onPTouchMove, { passive: false });
          window.addEventListener("touchend", onPTouchEnd);
          window.addEventListener("touchcancel", onPTouchEnd);
        } else {
          window.addEventListener("mousemove", onPMouseMove);
          window.addEventListener("mouseup", onPMouseUp);
        }
      }

      function onPMouseMove(e) {
        pMove(e.clientX, e.clientY);
      }

      function onPMouseUp() {
        window.removeEventListener("mousemove", onPMouseMove);
        window.removeEventListener("mouseup", onPMouseUp);
        pEnd();
      }

      function onPTouchMove(e) {
        if (!e.touches || !e.touches[0]) return;
        e.preventDefault();
        var t = e.touches[0];
        pMove(t.clientX, t.clientY);
      }

      function onPTouchEnd() {
        window.removeEventListener("touchmove", onPTouchMove);
        window.removeEventListener("touchend", onPTouchEnd);
        window.removeEventListener("touchcancel", onPTouchEnd);
        pEnd();
      }

      function removePlayer() {
        if (ifr) ifr.src = "about:blank";
        ptb.removeEventListener("mousedown", onPTitleDown);
        ptb.removeEventListener("touchstart", onPTitleDown);
        window.removeEventListener("mousemove", onPMouseMove);
        window.removeEventListener("mouseup", onPMouseUp);
        window.removeEventListener("touchmove", onPTouchMove);
        window.removeEventListener("touchend", onPTouchEnd);
        window.removeEventListener("touchcancel", onPTouchEnd);
        if (root.parentNode) root.parentNode.removeChild(root);
      }

      ptb.addEventListener("mousedown", onPTitleDown);
      ptb.addEventListener("touchstart", onPTitleDown, { passive: false });
      pxb.addEventListener("click", removePlayer);

      WindowStack.register(root);
      WindowStack.bringToFront(root);

      window.requestAnimationFrame(function () {
        var r = pch.getBoundingClientRect();
        var off = (winSerial % 6) * 22;
        var left = (window.innerWidth - r.width) / 2 + off;
        var top = (window.innerHeight - r.height) / 2 + off * 0.5;
        pch.classList.add("pelis-player-panel__chrome--dragging");
        pch.style.left =
          Math.min(Math.max(8, left), Math.max(8, window.innerWidth - r.width - 8)) + "px";
        pch.style.top =
          Math.min(Math.max(8, top), Math.max(8, window.innerHeight - r.height - 8)) + "px";
        pch.style.transform = "none";
        window.requestAnimationFrame(function () {
          if (ifr.parentNode) ifr.setAttribute("src", embedSrc);
        });
      });
    }

    list.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest(".pelis-index-panel__file") : null;
      if (!btn) return;
      var id = btn.getAttribute("data-youtube-id");
      var tit = btn.getAttribute("data-pelis-title") || "";
      var si = btn.getAttribute("data-youtube-si") || "";
      if (id) openPeliPlayer(tit, id, si);
    });

    toggle.addEventListener("dblclick", openIndex);
    toggle.addEventListener("click", openIndex);
    closeBtn.addEventListener("click", closeIndex);

    titlebar.addEventListener("mousedown", onIndexTitlebarDown);
    titlebar.addEventListener("touchstart", onIndexTitlebarDown, { passive: false });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) closeIndex();
    });

    window.addEventListener("resize", function () {
      if (panel.hidden || !savedPos) return;
      var c = clampPos(savedPos.left, savedPos.top);
      savedPos = c;
      chrome.style.left = c.left + "px";
      chrome.style.top = c.top + "px";
    });

    buildList();
    WindowStack.register(panel);
  }

  function initJueguitosWindow() {
    var panel = document.getElementById("jueguitos-index-panel");
    var toggle = document.getElementById("jueguitos-toggle");
    var closeBtn = document.getElementById("jueguitos-index-close");
    var chrome = panel ? panel.querySelector(".jueguitos-index-panel__chrome") : null;
    var titlebar = panel ? panel.querySelector(".jueguitos-index-panel__titlebar") : null;
    if (!panel || !toggle || !closeBtn || !chrome || !titlebar) return;

    /** @type {{ left: number, top: number } | null} */
    var savedPos = null;
    var drag = null;

    function applySavedPosition() {
      if (savedPos) {
        chrome.classList.add("jueguitos-index-panel__chrome--dragging");
        chrome.style.left = savedPos.left + "px";
        chrome.style.top = savedPos.top + "px";
        chrome.style.transform = "none";
      } else {
        chrome.classList.remove("jueguitos-index-panel__chrome--dragging");
        chrome.style.left = "";
        chrome.style.top = "";
        chrome.style.transform = "";
      }
    }

    function clampPos(left, top) {
      var rect = chrome.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;
      var margin = 8;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var maxL = Math.max(margin, vw - w - margin);
      var maxT = Math.max(margin, vh - h - margin);
      return {
        left: Math.min(Math.max(left, margin), maxL),
        top: Math.min(Math.max(top, margin), maxT),
      };
    }

    function startDrag(clientX, clientY) {
      var rect = chrome.getBoundingClientRect();
      if (!savedPos) {
        savedPos = { left: rect.left, top: rect.top };
        applySavedPosition();
        rect = chrome.getBoundingClientRect();
      }
      drag = {
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
      };
      document.body.style.cursor = "grabbing";
      titlebar.style.cursor = "grabbing";
    }

    function moveDrag(clientX, clientY) {
      if (!drag) return;
      var next = clampPos(clientX - drag.offsetX, clientY - drag.offsetY);
      savedPos = next;
      chrome.style.left = next.left + "px";
      chrome.style.top = next.top + "px";
    }

    function endDrag() {
      if (!drag) return;
      drag = null;
      document.body.style.cursor = "";
      titlebar.style.cursor = "";
    }

    function onIndexTitlebarDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest(".jueguitos-index-panel__close")) return;
      var clientX;
      var clientY;
      if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      e.preventDefault();
      startDrag(clientX, clientY);
      if (e.type === "touchstart") {
        window.addEventListener("touchmove", onIndexTouchMove, { passive: false });
        window.addEventListener("touchend", onIndexTouchEnd);
        window.addEventListener("touchcancel", onIndexTouchEnd);
      } else {
        window.addEventListener("mousemove", onIndexMouseMove);
        window.addEventListener("mouseup", onIndexMouseUp);
      }
    }

    function onIndexMouseMove(e) {
      moveDrag(e.clientX, e.clientY);
    }

    function onIndexMouseUp() {
      window.removeEventListener("mousemove", onIndexMouseMove);
      window.removeEventListener("mouseup", onIndexMouseUp);
      endDrag();
    }

    function onIndexTouchMove(e) {
      if (!e.touches || !e.touches[0]) return;
      e.preventDefault();
      var t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    }

    function onIndexTouchEnd() {
      window.removeEventListener("touchmove", onIndexTouchMove);
      window.removeEventListener("touchend", onIndexTouchEnd);
      window.removeEventListener("touchcancel", onIndexTouchEnd);
      endDrag();
    }

    function openIndex() {
      panel.hidden = false;
      WindowStack.bringToFront(panel);
      applySavedPosition();
    }

    function closeIndex() {
      panel.hidden = true;
      endDrag();
      toggle.focus();
    }

    toggle.addEventListener("dblclick", openIndex);
    toggle.addEventListener("click", openIndex);
    closeBtn.addEventListener("click", closeIndex);

    titlebar.addEventListener("mousedown", onIndexTitlebarDown);
    titlebar.addEventListener("touchstart", onIndexTitlebarDown, { passive: false });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) closeIndex();
    });

    window.addEventListener("resize", function () {
      if (panel.hidden || !savedPos) return;
      var c = clampPos(savedPos.left, savedPos.top);
      savedPos = c;
      chrome.style.left = c.left + "px";
      chrome.style.top = c.top + "px";
    });

    WindowStack.register(panel);
  }

  function initCollageBounce() {
    var reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    var pieces = Array.prototype.slice.call(document.querySelectorAll(".collage__piece"));
    if (!pieces.length) return;

    var margin = 6;
    var maxSpeed = 140; // px/s
    var minSpeed = 55; // px/s
    var maxRotSpeed = 22; // deg/s
    var minRotSpeed = 8; // deg/s
    var states = [];
    var rafId = 0;
    var lastT = 0;

    function randSign() {
      return Math.random() < 0.5 ? -1 : 1;
    }

    function randSpeed() {
      return (minSpeed + Math.random() * (maxSpeed - minSpeed)) * randSign();
    }

    function randRotSpeed() {
      return (minRotSpeed + Math.random() * (maxRotSpeed - minRotSpeed)) * randSign();
    }

    function setupPiece(el, idx) {
      var rect = el.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;

      // Convertimos el layout actual a coordenadas fijas del viewport
      el.style.position = "fixed";
      el.style.left = rect.left + "px";
      el.style.top = rect.top + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";

      // El collage no debe bloquear clicks; estas piezas tampoco.
      el.style.pointerEvents = "none";

      el.style.setProperty("--tx", "0px");
      el.style.setProperty("--ty", "0px");
      el.style.setProperty("--rot-dyn", "0deg");

      // Evita que queden exactamente iguales
      var vx = randSpeed();
      var vy = randSpeed();
      if (Math.abs(vx) < 1) vx = 80;
      if (Math.abs(vy) < 1) vy = -90;
      var vr = randRotSpeed();

      states[idx] = {
        el: el,
        x: rect.left,
        y: rect.top,
        baseLeft: rect.left,
        baseTop: rect.top,
        w: w,
        h: h,
        vx: vx,
        vy: vy,
        rot: 0,
        vr: vr,
      };
    }

    pieces.forEach(setupPiece);

    function refreshSizes() {
      for (var i = 0; i < states.length; i++) {
        var s = states[i];
        var r = s.el.getBoundingClientRect();
        s.w = r.width;
        s.h = r.height;
      }
    }

    function step(t) {
      if (!lastT) lastT = t;
      var dt = (t - lastT) / 1000;
      lastT = t;
      if (dt > 0.05) dt = 0.05; // cap para tabs inactivos

      var vw = window.innerWidth;
      var vh = window.innerHeight;

      for (var i = 0; i < states.length; i++) {
        var s = states[i];

        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.rot += s.vr * dt;

        var minX = margin;
        var minY = margin;
        var maxX = Math.max(margin, vw - s.w - margin);
        var maxY = Math.max(margin, vh - s.h - margin);

        if (s.x <= minX) {
          s.x = minX;
          s.vx = Math.abs(s.vx);
        } else if (s.x >= maxX) {
          s.x = maxX;
          s.vx = -Math.abs(s.vx);
        }

        if (s.y <= minY) {
          s.y = minY;
          s.vy = Math.abs(s.vy);
        } else if (s.y >= maxY) {
          s.y = maxY;
          s.vy = -Math.abs(s.vy);
        }

        // Como left/top ya están en px, usamos translate para evitar layout thrash
        s.el.style.setProperty("--tx", (s.x - s.baseLeft) + "px");
        s.el.style.setProperty("--ty", (s.y - s.baseTop) + "px");
        s.el.style.setProperty("--rot-dyn", s.rot.toFixed(2) + "deg");
      }

      rafId = window.requestAnimationFrame(step);
    }

    function onResize() {
      refreshSizes();
      // Clamp rápido dentro del viewport
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      for (var i = 0; i < states.length; i++) {
        var s = states[i];
        s.x = Math.min(Math.max(s.x, margin), Math.max(margin, vw - s.w - margin));
        s.y = Math.min(Math.max(s.y, margin), Math.max(margin, vh - s.h - margin));
      }
    }

    window.addEventListener("resize", onResize);
    rafId = window.requestAnimationFrame(step);
  }

  function initGuestbook() {
    var panel = document.getElementById("guestbook-panel");
    var toggle = document.getElementById("guestbook-toggle");
    var closeBtn = document.getElementById("guestbook-close");
    var frame = document.getElementById("guestbook-frame");
    var chrome = panel ? panel.querySelector(".guestbook-panel__chrome") : null;
    var titlebar = panel ? panel.querySelector(".guestbook-panel__titlebar") : null;
    if (!panel || !toggle || !chrome || !titlebar) return;

    var loaded = false;
    /** @type {{ left: number, top: number } | null} posición guardada tras arrastrar */
    var savedPos = null;
    var drag = null;

    function loadFrameOnce() {
      if (loaded || !frame) return;
      var src = frame.getAttribute("data-guestbook-src");
      if (src && src.indexOf("http") === 0) {
        frame.setAttribute("src", src);
        loaded = true;
      }
    }

    function applySavedPosition() {
      if (savedPos) {
        chrome.classList.add("guestbook-panel__chrome--dragging");
        chrome.style.left = savedPos.left + "px";
        chrome.style.top = savedPos.top + "px";
        chrome.style.transform = "none";
      } else {
        chrome.classList.remove("guestbook-panel__chrome--dragging");
        chrome.style.left = "";
        chrome.style.top = "";
        chrome.style.transform = "";
      }
    }

    function clampPos(left, top) {
      var rect = chrome.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;
      var margin = 8;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var maxL = Math.max(margin, vw - w - margin);
      var maxT = Math.max(margin, vh - h - margin);
      return {
        left: Math.min(Math.max(left, margin), maxL),
        top: Math.min(Math.max(top, margin), maxT),
      };
    }

    function startDrag(clientX, clientY) {
      var rect = chrome.getBoundingClientRect();
      if (!savedPos) {
        savedPos = { left: rect.left, top: rect.top };
        applySavedPosition();
        rect = chrome.getBoundingClientRect();
      }
      drag = {
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
      };
      document.body.style.cursor = "grabbing";
      titlebar.style.cursor = "grabbing";
    }

    function moveDrag(clientX, clientY) {
      if (!drag) return;
      var next = clampPos(clientX - drag.offsetX, clientY - drag.offsetY);
      savedPos = next;
      chrome.style.left = next.left + "px";
      chrome.style.top = next.top + "px";
    }

    function endDrag() {
      if (!drag) return;
      drag = null;
      document.body.style.cursor = "";
      titlebar.style.cursor = "";
    }

    function onTitlebarPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest(".guestbook-panel__close")) {
        return;
      }
      var clientX;
      var clientY;
      if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      e.preventDefault();
      startDrag(clientX, clientY);
      if (e.type === "touchstart") {
        window.addEventListener("touchmove", onWindowTouchMove, { passive: false });
        window.addEventListener("touchend", onWindowTouchEnd);
        window.addEventListener("touchcancel", onWindowTouchEnd);
      } else {
        window.addEventListener("mousemove", onWindowMouseMove);
        window.addEventListener("mouseup", onWindowMouseUp);
      }
    }

    function onWindowMouseMove(e) {
      moveDrag(e.clientX, e.clientY);
    }

    function onWindowMouseUp() {
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
      endDrag();
    }

    function onWindowTouchMove(e) {
      if (!e.touches || !e.touches[0]) return;
      e.preventDefault();
      var t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    }

    function onWindowTouchEnd() {
      window.removeEventListener("touchmove", onWindowTouchMove);
      window.removeEventListener("touchend", onWindowTouchEnd);
      window.removeEventListener("touchcancel", onWindowTouchEnd);
      endDrag();
    }

    function openPanel() {
      panel.hidden = false;
      WindowStack.bringToFront(panel);
      loadFrameOnce();
      applySavedPosition();
      document.body.style.overflow = "hidden";
      var close = document.getElementById("guestbook-close");
      if (close) close.focus();
    }

    function closePanel() {
      panel.hidden = true;
      document.body.style.overflow = "";
      endDrag();
      if (toggle) toggle.focus();
    }

    toggle.addEventListener("click", function () {
      if (panel.hidden) openPanel();
      else closePanel();
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", closePanel);
    }

    titlebar.addEventListener("mousedown", onTitlebarPointerDown);
    titlebar.addEventListener("touchstart", onTitlebarPointerDown, { passive: false });

    panel.addEventListener("click", function (e) {
      if (e.target === panel) closePanel();
    });

    window.addEventListener("resize", function () {
      if (panel.hidden || !savedPos) return;
      var c = clampPos(savedPos.left, savedPos.top);
      savedPos = c;
      chrome.style.left = c.left + "px";
      chrome.style.top = c.top + "px";
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) {
        closePanel();
      }
    });

    WindowStack.register(panel);
  }

  /**
   * @param {HTMLElement} el
   * @param {string} storageKey
   * @param {string | null} handleSelector — si es null, se arrastra desde cualquier punto del widget
   * @param {string | null} [dragIgnoreSelector] — no iniciar drag si el mousedown viene de dentro (p. ej. botones)
   */
  function initDraggableWidget(el, storageKey, handleSelector, dragIgnoreSelector) {
    if (!el) return;

    var margin = 8;
    var drag = null;

    function clamp(left, top) {
      var r = el.getBoundingClientRect();
      var w = r.width;
      var h = r.height;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var maxL = Math.max(margin, vw - w - margin);
      var maxT = Math.max(margin, vh - h - margin);
      return {
        left: Math.min(Math.max(left, margin), maxL),
        top: Math.min(Math.max(top, margin), maxT),
      };
    }

    function applyPixelPos(left, top) {
      el.style.left = left + "px";
      el.style.top = top + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
    }

    function loadSaved() {
      try {
        var raw = localStorage.getItem(storageKey);
        if (!raw) return;
        var pos = JSON.parse(raw);
        if (typeof pos.left !== "number" || typeof pos.top !== "number") return;
        var c = clamp(pos.left, pos.top);
        applyPixelPos(c.left, c.top);
      } catch (e) {
        // ignore
      }
    }

    function savePos(left, top) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ left: left, top: top }));
      } catch (e) {
        // ignore
      }
    }

    function ensurePixelPos() {
      if (el.style.left && el.style.top) return;
      var r = el.getBoundingClientRect();
      applyPixelPos(r.left, r.top);
    }

    function startDrag(clientX, clientY) {
      ensurePixelPos();
      var r = el.getBoundingClientRect();
      drag = {
        offsetX: clientX - r.left,
        offsetY: clientY - r.top,
      };
      el.style.zIndex = "25600";
      document.body.style.cursor = "grabbing";
    }

    function moveDrag(clientX, clientY) {
      if (!drag) return;
      var next = clamp(clientX - drag.offsetX, clientY - drag.offsetY);
      applyPixelPos(next.left, next.top);
    }

    function endDrag() {
      if (!drag) return;
      drag = null;
      el.style.zIndex = "";
      document.body.style.cursor = "";
      var r = el.getBoundingClientRect();
      savePos(r.left, r.top);
    }

    var handle = handleSelector ? el.querySelector(handleSelector) : el;
    if (!handle) handle = el;

    function onDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (
        dragIgnoreSelector &&
        e.target &&
        e.target.closest &&
        e.target.closest(dragIgnoreSelector)
      ) {
        return;
      }
      var cx;
      var cy;
      if (e.touches && e.touches[0]) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else {
        cx = e.clientX;
        cy = e.clientY;
      }
      e.preventDefault();
      startDrag(cx, cy);
      if (e.type === "touchstart") {
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEnd);
        window.addEventListener("touchcancel", onTouchEnd);
      } else {
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      }
    }

    function onMouseMove(e) {
      moveDrag(e.clientX, e.clientY);
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      endDrag();
    }

    function onTouchMove(e) {
      if (!e.touches || !e.touches[0]) return;
      e.preventDefault();
      var t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    }

    function onTouchEnd() {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      endDrag();
    }

    loadSaved();

    handle.addEventListener("mousedown", onDown);
    handle.addEventListener("touchstart", onDown, { passive: false });

    window.addEventListener("resize", function () {
      if (!el.style.left) return;
      var r = el.getBoundingClientRect();
      var c = clamp(r.left, r.top);
      applyPixelPos(c.left, c.top);
      savePos(c.left, c.top);
    });
  }

  function initTamagotchiWidget() {
    var widget = document.getElementById("widget-tamagotchi");
    var imgEl = document.getElementById("widget-tamagotchi-img");
    var barsEl = document.getElementById("widget-tamagotchi-bars");
    var btnMani = document.getElementById("widget-tamagotchi-mani");
    var btnCerveza = document.getElementById("widget-tamagotchi-cerveza");
    var btnRock = document.getElementById("widget-tamagotchi-rock");
    if (!widget || !imgEl || !barsEl || !btnMani || !btnCerveza || !btnRock) return;

    var STATE_KEY = "cancheros.widget.tamagotchi.v1";
    var TICK_MS = 1000;
    var OFFLINE_STEP_MS = 1000;
    var DECAY_PER_STEP = 5;
    var FEED_AMOUNT = 22;
    var MAX_STAT = 100;
    var MAX_OFFLINE_LOSS = 100;
    var TAMA_FALLBACK_KEY = "50-100-50";
    var TAMA_IMAGE_KEYS = [
      "0-0-0",
      "0-0-100",
      "0-50-0",
      "0-50-100",
      "0-100-0",
      "0-100-100",
      "50-50-50",
      "50-100-50",
      "100-100-0",
      "100-100-100",
    ];

    function clampStat(n) {
      return Math.max(0, Math.min(MAX_STAT, Math.round(n)));
    }

    function defaultState() {
      return { mani: 0, cerveza: 0, rock: 0, lastTickMs: Date.now() };
    }

    function loadState() {
      try {
        var raw = localStorage.getItem(STATE_KEY);
        if (!raw) return defaultState();
        var o = JSON.parse(raw);
        if (typeof o.mani !== "number" || isNaN(o.mani)) o.mani = 0;
        if (typeof o.cerveza !== "number" || isNaN(o.cerveza)) o.cerveza = 0;
        if (typeof o.rock !== "number" || isNaN(o.rock)) o.rock = 0;
        if (typeof o.lastTickMs !== "number" || isNaN(o.lastTickMs)) o.lastTickMs = Date.now();
        return o;
      } catch (e) {
        return defaultState();
      }
    }

    function saveState(s) {
      try {
        localStorage.setItem(STATE_KEY, JSON.stringify(s));
      } catch (e) {
        // ignore
      }
    }

    var state = loadState();

    function parseTamaKey(key) {
      var p = key.split("-");
      return [Number(p[0]), Number(p[1]), Number(p[2])];
    }

    /** Elige la imagen existente más cercana en maní / cerveza / rock (usa las 10 JPG). */
    function tamagotchiImageKey(mani, cerveza, rock) {
      mani = clampStat(mani);
      cerveza = clampStat(cerveza);
      rock = clampStat(rock);
      var bestKey = TAMA_FALLBACK_KEY;
      var bestDist = Infinity;
      for (var i = 0; i < TAMA_IMAGE_KEYS.length; i++) {
        var key = TAMA_IMAGE_KEYS[i];
        var t = parseTamaKey(key);
        var d =
          Math.abs(mani - t[0]) +
          Math.abs(cerveza - t[1]) +
          Math.abs(rock - t[2]);
        if (d < bestDist) {
          bestDist = d;
          bestKey = key;
        }
      }
      return bestKey;
    }

    function tamagotchiImageSrc(mani, cerveza, rock) {
      return "tamagotchi/" + tamagotchiImageKey(mani, cerveza, rock) + ".jpg";
    }

    function applyOfflineDecay() {
      var now = Date.now();
      var elapsed = now - state.lastTickMs;
      if (elapsed < 0) elapsed = 0;
      var steps = Math.floor(elapsed / OFFLINE_STEP_MS);
      if (steps > 0) {
        var loss = Math.min(steps * DECAY_PER_STEP, MAX_OFFLINE_LOSS);
        state.mani = clampStat(state.mani - loss);
        state.cerveza = clampStat(state.cerveza - loss);
        state.rock = clampStat(state.rock - loss);
      }
      state.lastTickMs = now;
      saveState(state);
    }

    function renderBarRow(label, val) {
      val = clampStat(val);
      var row = document.createElement("div");
      row.className = "widget-tamagotchi__bar-row";

      var labelEl = document.createElement("span");
      labelEl.className = "widget-tamagotchi__bar-label";
      labelEl.textContent = label;

      var track = document.createElement("span");
      track.className = "widget-tamagotchi__bar-track";
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-valuemin", "0");
      track.setAttribute("aria-valuemax", String(MAX_STAT));
      track.setAttribute("aria-valuenow", String(val));
      track.setAttribute("aria-label", label + " " + val);

      var fill = document.createElement("span");
      fill.className = "widget-tamagotchi__bar-fill";
      fill.style.width = val + "%";

      track.appendChild(fill);
      row.appendChild(labelEl);
      row.appendChild(track);
      return row;
    }

    function render() {
      imgEl.src = tamagotchiImageSrc(state.mani, state.cerveza, state.rock);
      barsEl.replaceChildren(
        renderBarRow("maní", state.mani),
        renderBarRow("cerveza", state.cerveza),
        renderBarRow("rock", state.rock)
      );
    }

    function tick() {
      state.lastTickMs = Date.now();
      state.mani = clampStat(state.mani - DECAY_PER_STEP);
      state.cerveza = clampStat(state.cerveza - DECAY_PER_STEP);
      state.rock = clampStat(state.rock - DECAY_PER_STEP);
      saveState(state);
      render();
    }

    function feed(which) {
      if (which === "mani") state.mani = clampStat(state.mani + FEED_AMOUNT);
      else if (which === "cerveza") state.cerveza = clampStat(state.cerveza + FEED_AMOUNT);
      else if (which === "rock") state.rock = clampStat(state.rock + FEED_AMOUNT);
      state.lastTickMs = Date.now();
      saveState(state);
      render();
    }

    applyOfflineDecay();
    render();

    btnMani.addEventListener("click", function () {
      feed("mani");
    });
    btnCerveza.addEventListener("click", function () {
      feed("cerveza");
    });
    btnRock.addEventListener("click", function () {
      feed("rock");
    });

    initDraggableWidget(
      widget,
      "cancheros.widget.tamagotchi.pos",
      null,
      ".widget-tamagotchi__actions"
    );

    window.setInterval(tick, TICK_MS);
  }

  function initCounterWidget() {
    var widget = document.getElementById("widget-counter");
    if (!widget) return;
    if (isMobileDesktopLayout()) {
      widget.style.left = "";
      widget.style.top = "";
      widget.style.right = "";
      widget.style.bottom = "";
      return;
    }
    initDraggableWidget(widget, "cancheros.widget.counter.pos", null);
  }

  function initClockWidget() {
    var widget = document.getElementById("widget-clock");
    var timeEl = document.getElementById("widget-clock-time");
    if (!timeEl || !widget) return;

    initDraggableWidget(widget, "cancheros.widget.clock.pos", null);

    var tz = "America/Argentina/Buenos_Aires";

    function tick() {
      var now = new Date();
      var fmt = new Intl.DateTimeFormat("es-AR", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      var parts = fmt.formatToParts(now);
      var h = "";
      var m = "";
      var s = "";
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.type === "hour") h = p.value;
        if (p.type === "minute") m = p.value;
        if (p.type === "second") s = p.value;
      }
      var str = h + ":" + m + ":" + s;
      timeEl.textContent = str;
    }

    tick();
    window.setInterval(tick, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDesktopIcons);
    document.addEventListener("DOMContentLoaded", initBioWindow);
    document.addEventListener("DOMContentLoaded", initFooterPlayer);
    document.addEventListener("DOMContentLoaded", initDiscoCancherosIcon);
    document.addEventListener("DOMContentLoaded", initDoomWindow);
    document.addEventListener("DOMContentLoaded", initSnakeWindow);
    document.addEventListener("DOMContentLoaded", initCollageBounce);
    document.addEventListener("DOMContentLoaded", initGuestbook);
    document.addEventListener("DOMContentLoaded", initClockWidget);
    document.addEventListener("DOMContentLoaded", initTamagotchiWidget);
    document.addEventListener("DOMContentLoaded", initCounterWidget);
    document.addEventListener("DOMContentLoaded", initLetrasWindow);
    document.addEventListener("DOMContentLoaded", initPelisWindow);
    document.addEventListener("DOMContentLoaded", initJueguitosWindow);
  } else {
    initDesktopIcons();
    initBioWindow();
    initFooterPlayer();
    initDiscoCancherosIcon();
    initDoomWindow();
    initSnakeWindow();
    initCollageBounce();
    initGuestbook();
    initClockWidget();
    initTamagotchiWidget();
    initCounterWidget();
    initLetrasWindow();
    initPelisWindow();
    initJueguitosWindow();
  }
})();
