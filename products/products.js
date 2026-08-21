/* ===========================================================
   KERNX — product detail page JS (shared across /products/*)
   =========================================================== */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* Lenis smooth scroll, same as homepage */
  let lenis;
  if (!reduceMotion && window.Lenis && window.gsap) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* header scrolled state */
  const header = document.getElementById("siteHeader");
  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    });
  }

  /* nav drawer */
  const menuBtn = document.getElementById("menuBtn");
  const navDrawer = document.getElementById("navDrawer");
  if (menuBtn && navDrawer) {
    function closeDrawer() {
      navDrawer.classList.remove("is-open");
      navDrawer.setAttribute("aria-hidden", "true");
    }
    menuBtn.addEventListener("click", () => {
      const open = navDrawer.classList.toggle("is-open");
      navDrawer.setAttribute("aria-hidden", String(!open));
    });
    navDrawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeDrawer));
    document.addEventListener("click", (e) => {
      if (navDrawer.classList.contains("is-open") && !navDrawer.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
        closeDrawer();
      }
    });
  }

  /* gallery reveal */
  const galleryItems = document.querySelectorAll(".gallery-item");
  if (galleryItems.length) {
    if (window.gsap) {
      galleryItems.forEach((el, i) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          delay: i * 0.05,
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });
    } else {
      galleryItems.forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
    }
  }

  /* specs reveal */
  if (window.gsap) {
    gsap.utils.toArray(".specs-list div").forEach((el, i) => {
      gsap.from(el, {
        opacity: 0,
        y: 12,
        duration: 0.5,
        ease: "power2.out",
        delay: i * 0.04,
        scrollTrigger: { trigger: el, start: "top 92%" },
      });
    });
  }

  /* model-viewer: custom AR button + hide hint once user interacts */
  const mv = document.querySelector("model-viewer");
  const hint = document.querySelector(".viewer-hint");
  if (mv) {
    mv.addEventListener("camera-change", () => {
      if (hint) hint.style.opacity = "0";
    }, { once: true });

    const arBtn = document.querySelector(".ar-button");
    if (arBtn) {
      mv.addEventListener("ar-status", (e) => {
        arBtn.style.display = e.detail.status === "not-presenting" || e.detail.status === "session-started" ? "flex" : "flex";
      });
    }
  }

  /* newsletter (same behaviour as homepage) */
  const form = document.getElementById("newsletterForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input");
      const btn = form.querySelector("button");
      if (!input.value) return;
      if (window.gsap) {
        gsap.fromTo(btn, { scale: 1 }, { scale: 1.15, duration: 0.2, yoyo: true, repeat: 1, ease: "power1.inOut" });
      }
      input.placeholder = "Thanks — you're on the list.";
      input.value = "";
    });
  }
})();
