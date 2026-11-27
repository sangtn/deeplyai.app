/* ROAMO site — world switcher. Vanilla JS, no dependencies, no tracking. */
(function () {
  "use strict";
  var phone = document.getElementById("phone");
  var tag = document.getElementById("wtag");
  var live = document.getElementById("live");
  var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-w]"));
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function apply(w, announce) {
    phone.className = phone.className.replace(/\bw-[a-z0-9]+\b/g, "").trim() + " w-" + w.id;
    if (tag) tag.textContent = w.name;
    if (live) {
      phone.setAttribute("aria-label", live.getAttribute("data-aria").replace("{world}", w.name));
      if (announce) live.textContent = live.getAttribute("data-tpl").replace("{world}", w.name);
    }
    buttons.forEach(function (b) {
      b.setAttribute("aria-pressed", JSON.parse(b.getAttribute("data-w")).id === w.id ? "true" : "false");
    });
    if (!reduce) {
      phone.classList.remove("swap");
      void phone.offsetWidth; // restart the animation
      phone.classList.add("swap");
    }
  }

  if (phone) buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      apply(JSON.parse(b.getAttribute("data-w")), true);
      if (b.classList.contains("card")) {
        var r = phone.getBoundingClientRect();
        if (r.bottom < 60 || r.top > window.innerHeight) {
          phone.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        }
      }
    });
  });

  // Close the language menu when clicking outside or pressing Escape.
  var langs = document.querySelector(".langs");
  if (langs) {
    document.addEventListener("click", function (e) { if (!langs.contains(e.target)) langs.removeAttribute("open"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && langs.hasAttribute("open")) { langs.removeAttribute("open"); langs.querySelector("summary").focus(); }
    });
  }
})();

/* Support page videos: muted, play while on screen, paused with reduced motion; button toggles. */
(function () {
  "use strict";
  var vids = Array.prototype.slice.call(document.querySelectorAll("video[data-auto]"));
  if (!vids.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  vids.forEach(function (v) {
    var btn = v.parentNode.querySelector(".vbtn");
    var userPaused = reduce;
    function sync() {
      var on = !v.paused;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute("aria-label", btn.getAttribute(on ? "data-pause" : "data-play"));
    }
    v.addEventListener("play", sync);
    v.addEventListener("pause", sync);
    btn.addEventListener("click", function () {
      if (v.paused) { userPaused = false; v.play(); } else { userPaused = true; v.pause(); }
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !userPaused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else if (!e.isIntersecting && !v.paused) v.pause();
        });
      }, { threshold: 0.35 }).observe(v);
    }
    sync();
  });
})();
