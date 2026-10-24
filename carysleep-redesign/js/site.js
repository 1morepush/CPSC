(function () {
  window.__siteReady = true;

  // footer copyright year stays current
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  var doc = document.documentElement;
  var header = document.getElementById("site-header");
  var toggle = header.querySelector(".menu-toggle");
  var progress = document.querySelector(".progress");
  var toTop = document.querySelector(".to-top");
  var toTopBar = toTop && toTop.querySelector(".bar");
  var actionBar = document.querySelector(".action-bar");
  var mobile = window.matchMedia("(max-width: 991px)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var hasIO = "IntersectionObserver" in window;

  function onMediaChange(mq, fn) {
    if (mq.addEventListener) mq.addEventListener("change", fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  // ---- Light / dark theme ----
  // The inline script in <head> has already applied the saved choice (or the device setting) before first paint.
  var themeToggle = header.querySelector(".theme-toggle");
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  function savedTheme() {
    try { return localStorage.getItem("theme"); } catch (e) { return null; }
  }
  function setTheme(theme) {
    doc.setAttribute("data-theme", theme);
    if (themeToggle) themeToggle.setAttribute("aria-pressed", theme === "dark");
  }
  function followDevice() {
    var t = savedTheme();
    setTheme(t === "dark" || t === "light" ? t : systemDark.matches ? "dark" : "light");
  }
  followDevice();
  onMediaChange(systemDark, followDevice);
  // another open tab changed the theme
  window.addEventListener("storage", function (e) {
    if (e.key === "theme") followDevice();
  });
  // paper is white: print in the light theme
  var themeBeforePrint = null;
  window.addEventListener("beforeprint", function () {
    themeBeforePrint = doc.getAttribute("data-theme");
    doc.setAttribute("data-theme", "light");
  });
  window.addEventListener("afterprint", function () {
    if (themeBeforePrint) doc.setAttribute("data-theme", themeBeforePrint);
  });

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = doc.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try {
        // choosing what the device already uses means "follow the device" again
        if ((next === "dark") === systemDark.matches) localStorage.removeItem("theme");
        else localStorage.setItem("theme", next);
      } catch (e) { /* storage blocked: the choice lasts for this page only */ }

      if (!document.startViewTransition || reduceMotion.matches) {
        setTheme(next);
        return;
      }
      // the new theme spreads out in a circle from the switch
      var r = themeToggle.getBoundingClientRect();
      var x = r.left + r.width / 2;
      var y = r.top + r.height / 2;
      doc.style.setProperty("--vt-x", x + "px");
      doc.style.setProperty("--vt-y", y + "px");
      doc.style.setProperty("--vt-r", Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))) + "px");
      doc.classList.add("theme-switching");
      var transition = document.startViewTransition(function () { setTheme(next); });
      transition.finished.then(done, done);
      function done() { doc.classList.remove("theme-switching"); }
    });
  }

  // ---- Sidebar links that point at sections of this page (scrollspy) ----
  var spy = [];
  var spyCurrent = null;
  document.querySelectorAll(".side-card a[href*='#']").forEach(function (a) {
    var url = new URL(a.getAttribute("href"), location.href);
    if (url.pathname !== location.pathname || url.hash.length < 2) return;
    var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target) spy.push({ link: a, target: target });
  });

  function updateSpy() {
    if (!spy.length) return;
    var line = window.innerHeight * 0.3;
    var current = null;
    spy.forEach(function (s) {
      if (s.target.getBoundingClientRect().top - line <= 0) current = s;
    });
    spy.forEach(function (s) { s.link.classList.toggle("active", s === current); });
    if (current && current !== spyCurrent) {
      // on phones the list is a horizontal chip bar: bring the active chip into view
      var list = current.link.closest("ul");
      if (list && list.scrollWidth > list.clientWidth) {
        var offset = current.link.getBoundingClientRect().left - list.getBoundingClientRect().left;
        list.scrollTo({ left: list.scrollLeft + offset - 8, behavior: reduceMotion.matches ? "auto" : "smooth" });
      }
    }
    spyCurrent = current;
  }

  // ---- Scroll-linked UI: header, progress bar, back-to-top ring, action bar ----
  var ticking = false;
  var lastY = window.scrollY;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      if (header.classList.contains("menu-open")) {
        // the page moved under the open menu: keep the panel reaching the bottom of the screen
        header.style.setProperty("--menu-top", Math.round(header.getBoundingClientRect().bottom) + "px");
      } else if (y > 40) {
        // hysteresis keeps the shrinking header from flickering at the threshold
        header.classList.add("scrolled");
      } else if (y < 10) {
        header.classList.remove("scrolled");
      }
      if (progress) progress.style.transform = "scaleX(" + p.toFixed(4) + ")";
      if (toTop) {
        toTop.classList.toggle("show", y > 480);
        toTopBar.style.strokeDashoffset = (1 - p).toFixed(4);
      }
      if (actionBar) {
        // tuck the bar away while reading down; bring it back on the way up and at the end
        var dy = y - lastY;
        if (y < 120 || max - y < 60) actionBar.classList.remove("hide");
        else if (dy > 8) actionBar.classList.add("hide");
        else if (dy < -8) actionBar.classList.remove("hide");
        if (Math.abs(dy) > 8 || y < 120) lastY = y;
      }
      updateSpy();
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
  }

  // ---- Navigation ----
  function setMenu(open) {
    if (open) {
      // the panel fills the screen below wherever the header bar currently sits
      header.style.setProperty("--menu-top", Math.round(header.getBoundingClientRect().bottom) + "px");
    }
    header.classList.toggle("menu-open", open);
    doc.classList.toggle("menu-lock", open);
    toggle.setAttribute("aria-expanded", open);
    if (!open) onScroll(); // the header's scrolled state is held while the menu is open
  }
  toggle.addEventListener("click", function () {
    setMenu(!header.classList.contains("menu-open"));
  });
  onMediaChange(mobile, function (e) {
    if (!e.matches) setMenu(false);
  });

  // Top-level "Patient Education" dropdown: click/tap to open
  header.querySelectorAll(".nav > .has-sub > button").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = btn.parentElement.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
    });
  });
  document.addEventListener("click", function (e) {
    if (mobile.matches) return;
    header.querySelectorAll(".nav > .has-sub.open").forEach(function (li) {
      if (!li.contains(e.target)) {
        li.classList.remove("open");
        li.querySelector("button").setAttribute("aria-expanded", "false");
      }
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    header.querySelectorAll(".has-sub.open").forEach(function (li) {
      li.classList.remove("open");
      var btn = li.querySelector("button");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
    if (header.classList.contains("menu-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  // ---- Reveal on scroll, staggered within each batch ----
  document.querySelectorAll(".prose ul").forEach(function (ul) {
    Array.prototype.forEach.call(ul.children, function (li, i) { li.style.setProperty("--li", i); });
  });
  var revealEls = document.querySelectorAll(".reveal");
  if (hasIO) {
    var revealer = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.style.setProperty("--rd", Math.min(n, 6) * 90 + "ms");
        en.target.classList.add("in");
        revealer.unobserve(en.target);
        n++;
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) {
      if (!el.classList.contains("in")) revealer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  // ---- Pause decorative loops while they are off screen ----
  // (only regions without .reveal content, so nothing can freeze mid-fade)
  if (hasIO) {
    var pauser = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle("paused", !en.isIntersecting); });
    });
    document.querySelectorAll(".hero, .page-hero, .marquee, .site-footer").forEach(function (el) {
      pauser.observe(el);
    });
  }

  // ---- Pointer effects (mouse / trackpad only) ----
  if (!finePointer.matches || reduceMotion.matches) return;

  // Spotlight that follows the cursor across service cards
  document.querySelectorAll(".service").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - r.left + "px");
      el.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  // 3D tilt on image tiles
  document.querySelectorAll("[data-tilt]").forEach(function (el) {
    var frame = 0;
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () {
        el.style.transform = "perspective(900px) rotateX(" + (-y * 8).toFixed(2) + "deg) rotateY(" +
          (x * 10).toFixed(2) + "deg) translateY(-6px)";
      });
    });
    el.addEventListener("pointerleave", function () {
      cancelAnimationFrame(frame);
      el.style.transform = "";
    });
  });

  // Gentle parallax on the home hero
  var hero = document.querySelector("[data-parallax]");
  if (hero) {
    var pending = 0;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(function () {
        hero.style.setProperty("--px", px.toFixed(3));
        hero.style.setProperty("--py", py.toFixed(3));
      });
    });
    hero.addEventListener("pointerleave", function () {
      hero.style.setProperty("--px", 0);
      hero.style.setProperty("--py", 0);
    });
  }
})();
