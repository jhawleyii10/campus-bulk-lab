/*
 * BUILTBASIX — site interactions
 * Vanilla JS, no dependencies. Handles:
 *   1. Cinematic homepage intro (plays once per session, respects
 *      prefers-reduced-motion, always skippable, never blocks the page).
 *   2. Full-screen nav overlay (MENU) — present on every page.
 *   3. Restrained cross-page transitions (fade, not a hard cut) between
 *      BuiltBasix pages, distinct from the homepage intro.
 *   4. Restrained scroll-reveal motion for section content.
 *
 * This file is loaded with `defer` on every page. A separate tiny inline
 * script in each page's <head> makes the reduced-motion / already-seen
 * decision for the INTRO synchronously (before paint), so there is never
 * a flash of it for returning visitors or reduced-motion users. That
 * script only matters on the homepage, where #bbIntro exists.
 */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Cinematic intro (homepage only — initIntro() no-ops elsewhere)
     --------------------------------------------------------------------- */
  function initIntro() {
    var root = document.getElementById("bbIntro");
    if (!root) return;

    if (document.documentElement.classList.contains("no-intro")) {
      document.documentElement.classList.remove("intro-lock");
      return;
    }

    // Cinematic build-up: reveal -> breathe -> transition -> breathe.
    // Each major idea gets its own hold before the next begins, targeting
    // ~10 seconds total before the destination screen appears. The
    // destination screen itself has NO timer at all once reached — it
    // stays until the visitor explicitly chooses ENTER or SHOP.
    var PHASE_TIMES = { 2: 1900, 3: 4200, 4: 6600 };
    var CHOICE_REACHED_AT = 10200;

    var timers = [];
    var choicePhaseStarted = false;
    var dismissed = false;

    function setPhase(n) {
      root.setAttribute("data-phase", String(n));
    }

    function clearPhaseTimers() {
      timers.forEach(function (t) { clearTimeout(t); });
      timers = [];
    }

    // Reaching the destination screen is a single, idempotent transition,
    // whether it arrives naturally or is forced early via SKIP. No timer
    // is started here — the screen simply waits.
    function enterChoicePhase() {
      if (choicePhaseStarted) return;
      choicePhaseStarted = true;
      clearPhaseTimers();
      setPhase(5);
    }

    function play() {
      setPhase(1);
      Object.keys(PHASE_TIMES).forEach(function (phase) {
        var t = setTimeout(function () { setPhase(Number(phase)); }, PHASE_TIMES[phase]);
        timers.push(t);
      });
      var choiceTimeout = setTimeout(enterChoicePhase, CHOICE_REACHED_AT);
      timers.push(choiceTimeout);
    }

    function markSeen() {
      try {
        sessionStorage.setItem("bbIntroSeen", "1");
      } catch (e) {
        /* sessionStorage unavailable — non-fatal, intro may replay */
      }
    }

    function dismiss(afterHiddenCallback) {
      // Guards against a click landing twice (e.g. a fast double-tap on
      // touch devices) — whichever call reaches this line first wins.
      if (dismissed) return;
      dismissed = true;

      clearPhaseTimers();
      markSeen();
      root.classList.add("is-leaving");
      document.documentElement.classList.remove("intro-lock");

      var done = false;
      function finish() {
        if (done) return;
        done = true;
        root.classList.add("is-hidden");
        if (typeof afterHiddenCallback === "function") afterHiddenCallback();
      }

      root.addEventListener("transitionend", finish, { once: true });
      // Safety net in case transitionend never fires (e.g. no matching
      // transition property, or the browser drops the event).
      setTimeout(finish, 900);
    }

    // SKIP jumps straight to the destination screen. It stays there
    // indefinitely afterward, same as reaching it naturally.
    var skipBtn = document.getElementById("introSkip");
    if (skipBtn) {
      skipBtn.addEventListener("click", function () {
        enterChoicePhase();
      });
    }

    // ENTER stays on the homepage — the intro simply dissolves to reveal
    // the page already rendered beneath it.
    var enterLink = document.getElementById("enterSite");
    if (enterLink) {
      enterLink.addEventListener("click", function (e) {
        e.preventDefault();
        dismiss();
      });
    }

    // SHOP now leads to the dedicated shop page. The intro dissolves
    // first (charcoal -> ivory), then we navigate — so the shop page's
    // own fade-in continues the same visual move rather than cutting.
    var shopLink = document.getElementById("shopSite");
    if (shopLink) {
      shopLink.addEventListener("click", function (e) {
        e.preventDefault();
        var destination = shopLink.getAttribute("href") || "shop.html";
        dismiss(function () {
          window.location.href = destination;
        });
      });
    }

    // Reduced motion: skip the cinematic build-up entirely and present
    // the static destination screen immediately (CSS disables the
    // phase-transition animations under reduced motion, so this appears
    // instantly rather than fading in). The visitor still explicitly
    // chooses ENTER or SHOP — reduced motion never auto-enters for them.
    var reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    try {
      if (reduced) {
        enterChoicePhase();
      } else {
        play();
      }
    } catch (e) {
      /* If anything goes wrong, don't trap the visitor behind the intro. */
      document.documentElement.classList.remove("intro-lock");
      root.classList.add("is-hidden");
    }
  }

  /* ---------------------------------------------------------------------
     Full-screen nav overlay — present on every page
     --------------------------------------------------------------------- */
  function initNavOverlay() {
    var nav = document.getElementById("siteNav");
    var openBtn = document.getElementById("menuOpen");
    var closeBtn = document.getElementById("menuClose");
    if (!nav || !openBtn || !closeBtn) return;

    function openNav() {
      nav.classList.add("is-open");
      openBtn.setAttribute("aria-expanded", "true");
    }

    function closeNav() {
      nav.classList.remove("is-open");
      openBtn.setAttribute("aria-expanded", "false");
    }

    openBtn.addEventListener("click", openNav);
    closeBtn.addEventListener("click", closeNav);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });

    // Actual navigation for the menu's links is handled by
    // initPageTransitions(); we just close the overlay's own chrome
    // if a click ever reaches it without navigating (rare, but safe).
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeNav();
    });
  }

  /* ---------------------------------------------------------------------
     Cross-page transitions: a restrained fade between BuiltBasix pages
     so navigation feels like one continuous site rather than separate
     HTML files. Distinct from, and independent of, the homepage intro.
     --------------------------------------------------------------------- */
  function initPageTransitions() {
    var page = document.getElementById("bbPage");

    function revealPage() {
      if (!page) return;
      // rAF so the browser registers the initial (hidden) state before
      // flipping the class, otherwise the transition can be skipped.
      window.requestAnimationFrame(function () {
        page.classList.add("is-ready");
      });
    }
    revealPage();

    var reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      var link = e.target.closest ? e.target.closest("a[href]") : null;
      if (!link) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;

      var url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (err) {
        return;
      }

      if (url.origin !== window.location.origin) return;

      // Same-page hash link (e.g. "EXPLORE" scrolling to #latest) —
      // let the browser handle it normally, no page transition needed.
      if (url.pathname === window.location.pathname && url.hash) return;

      e.preventDefault();
      if (page) page.classList.add("is-leaving");
      var delay = page ? 260 : 0;
      setTimeout(function () {
        window.location.href = link.href;
      }, delay);
    });
  }

  /* ---------------------------------------------------------------------
     Restrained scroll-reveal motion
     --------------------------------------------------------------------- */
  function initScrollReveal() {
    var targets = document.querySelectorAll(".reveal, .reveal-rule");
    if (!targets.length) return;

    var reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach(function (el) { observer.observe(el); });
  }

  function init() {
    initIntro();
    initNavOverlay();
    initPageTransitions();
    initScrollReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
