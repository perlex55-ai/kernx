/* ===========================================================
   KERNX — main.js
   =========================================================== */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  gsap.registerPlugin(ScrollTrigger);

  /* -----------------------------------------------------------
     LENIS SMOOTH SCROLL  (synced with GSAP ticker / ScrollTrigger)
  ----------------------------------------------------------- */
  let lenis;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* -----------------------------------------------------------
     PRELOADER
  ----------------------------------------------------------- */
  const preloader = document.getElementById("preloader");
  const alreadyPlayed = sessionStorage.getItem("kernx_intro_played");

  function killPreloader() {
    preloader.classList.add("is-done");
    preloader.style.display = "none";
    document.body.style.overflow = "";
    ScrollTrigger.refresh();
  }

  function runPreloaderCanvas(progressGetter) {
    const canvas = document.getElementById("preloaderCanvas");
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    const PARTICLE_COUNT = 90;
    const particles = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }
    resize();

    const cx = () => w / 2;
    const cy = () => h / 2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = (0.3 + Math.random() * 0.7) * Math.min(w, h) * 0.6;
      particles.push({
        sx: cx() + Math.cos(angle) * dist,
        sy: cy() + Math.sin(angle) * dist,
        ex: cx() + (Math.random() - 0.5) * 40,
        ey: cy() + (Math.random() - 0.5) * 60,
        r: 0.6 + Math.random() * 1.6,
        delay: Math.random() * 0.5,
        speed: 0.5 + Math.random() * 0.5,
      });
    }

    let raf;
    function draw() {
      const p = progressGetter();
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      particles.forEach((pt) => {
        let local = (p - pt.delay) / pt.speed;
        local = Math.max(0, Math.min(1, local));
        const eased = 1 - Math.pow(1 - local, 3);
        const x = pt.sx + (pt.ex - pt.sx) * eased;
        const y = pt.sy + (pt.ey - pt.sy) * eased;
        const alpha = (1 - eased) * 0.85;
        if (alpha <= 0.01) return;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, pt.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }

  if (alreadyPlayed || reduceMotion) {
    killPreloader();
  } else {
    document.body.style.overflow = "hidden";
    let progress = 0;
    const stopCanvas = runPreloaderCanvas(() => progress);
    const canvasEl = document.getElementById("preloaderCanvas");

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        sessionStorage.setItem("kernx_intro_played", "1");
        stopCanvas();
        killPreloader();
      },
    });

    tl.to(canvasEl, { opacity: 1, duration: 0.2 })
      .to(
        { p: 0 },
        {
          p: 1,
          duration: 1.1,
          ease: "power2.inOut",
          onUpdate: function () {
            progress = this.targets()[0].p;
          },
        },
        0.05
      )
      .to(
        "#preloaderK",
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
        },
        0.55
      )
      .fromTo(
        ".preloader-mark",
        { rotate: -4 },
        { rotate: 0, duration: 0.9, ease: "power3.out" },
        0.55
      )
      .to(
        "#preloaderSweep",
        { opacity: 1, left: "130%", duration: 0.7, ease: "power2.inOut" },
        0.95
      )
      .to("#preloaderSweep", { opacity: 0, duration: 0.2 }, 1.55)
      .to(
        "#preloaderWord",
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        1.15
      )
      .to(canvasEl, { opacity: 0, duration: 0.3 }, 1.5)
      .to(
        preloader,
        { opacity: 0, duration: 0.5, ease: "power2.inOut" },
        1.85
      );
  }

  /* -----------------------------------------------------------
     HEADER: scrolled state + nav drawer
  ----------------------------------------------------------- */
  const header = document.getElementById("siteHeader");
  ScrollTrigger.create({
    start: 60,
    onUpdate: (self) => {
      header.classList.toggle("is-scrolled", self.scroll() > 40);
    },
  });

  const menuBtn = document.getElementById("menuBtn");
  const navDrawer = document.getElementById("navDrawer");
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

  /* -----------------------------------------------------------
     HERO: ambient particle canvas + mouse parallax
  ----------------------------------------------------------- */
  if (!reduceMotion) {
    const canvas = document.getElementById("heroParticles");
    const ctx = canvas.getContext("2d");
    let w, h, dpr;
    const dots = [];
    const DOT_COUNT = 70;

    function resizeHeroCanvas() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const hero = document.getElementById("hero");
      w = canvas.width = hero.clientWidth * dpr;
      h = canvas.height = hero.clientHeight * dpr;
      canvas.style.width = hero.clientWidth + "px";
      canvas.style.height = hero.clientHeight + "px";
    }
    resizeHeroCanvas();

    for (let i = 0; i < DOT_COUNT; i++) {
      dots.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.5 + Math.random() * 1.3,
        driftX: (Math.random() - 0.5) * 0.02,
        driftY: (Math.random() - 0.5) * 0.02,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let t = 0;
    function loop() {
      t += 0.004;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      dots.forEach((d) => {
        const x = ((d.x + Math.sin(t + d.phase) * 0.01) % 1) * w;
        const y = ((d.y + Math.cos(t + d.phase) * 0.008 + d.driftY) % 1) * h;
        const twinkle = 0.25 + Math.abs(Math.sin(t * 2 + d.phase)) * 0.4;
        ctx.globalAlpha = twinkle;
        ctx.beginPath();
        ctx.arc(x, y, d.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    window.addEventListener("resize", resizeHeroCanvas);

    /* mouse parallax on hero — bg art (incl. logo) drifts slightly,
       ambient dust canvas drifts a little more, for a subtle sense of depth */
    const heroBgWrap = document.getElementById("heroBgWrap");
    const heroBgImg = document.getElementById("heroBgImg");
    const heroSection = document.getElementById("hero");

    const xToWrap = gsap.quickTo(heroBgWrap, "x", { duration: 1.2, ease: "power3.out" });
    const yToWrap = gsap.quickTo(heroBgWrap, "y", { duration: 1.2, ease: "power3.out" });
    const xToImg = gsap.quickTo(heroBgImg, "x", { duration: 0.9, ease: "power3.out" });
    const yToImg = gsap.quickTo(heroBgImg, "y", { duration: 0.9, ease: "power3.out" });

    heroSection.addEventListener("mousemove", (e) => {
      const rect = heroSection.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      xToWrap(nx * 16);
      yToWrap(ny * 10);
      xToImg(nx * 8);
      yToImg(ny * 5);
    });
    heroSection.addEventListener("mouseleave", () => {
      xToWrap(0); yToWrap(0); xToImg(0); yToImg(0);
    });
  }

  /* -----------------------------------------------------------
     SCROLL TRANSITION — KERNX wordmark disperses into scattered
     letters as the user scrolls from hero into brand-statement.
     The word starts fully assembled (real text, real kerning);
     on scroll each letter flies out to a fixed scattered position.
  ----------------------------------------------------------- */
  const scatterSpecs = {
    K: { tx: -33, ty: -4, tr: -10 },
    E: { tx: -21, ty: -27, tr: 13 },
    R: { tx: 1, ty: -33, tr: -6 },
    N: { tx: 22, ty: -25, tr: -13 },
    X: { tx: 33, ty: 7, tr: 11 },
  };

  function vw(v) { return (v / 100) * window.innerWidth; }
  function vh(v) { return (v / 100) * window.innerHeight; }

  let wordmarkST = null;

  function buildScrollTransition() {
    const letters = gsap.utils.toArray(".wm-letter");
    if (!letters.length || !document.getElementById("hero")) return;

    // kill any previous instance (used on rebuild after resize)
    if (wordmarkST) {
      wordmarkST.scrollTrigger && wordmarkST.scrollTrigger.kill();
      wordmarkST.kill();
    }

    // 1) reset to normal flow so the browser lays the word out naturally
    letters.forEach((el) => {
      el.style.position = "";
      el.style.left = "";
      el.style.top = "";
      el.style.margin = "";
    });
    gsap.set(letters, { clearProps: "transform,opacity,filter" });

    // 2) measure the assembled, in-flow position of every letter (FLIP read)
    const rects = letters.map((el) => el.getBoundingClientRect());

    // 3) pin each letter to that exact spot with position:fixed so it can
    //    fly freely over the rest of the page while scrolling continues
    letters.forEach((el, i) => {
      const r = rects[i];
      gsap.set(el, {
        position: "fixed",
        left: r.left,
        top: r.top,
        margin: 0,
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        zIndex: 350,
      });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        endTrigger: "#brandStatement",
        end: "center center",
        scrub: 0.6,
      },
    });
    wordmarkST = tl;

    // hero exit — background particles + vignette recede as the word takes over
    tl.to("#heroScroll", { opacity: 0, duration: 0.12, ease: "none" }, 0);
    tl.to("#heroBgWrap", { opacity: 0, scale: 1.1, filter: "blur(6px)", duration: 0.7, ease: "none" }, 0.05);

    // letters peel off the word, one after another, and drift/fade outward
    letters.forEach((el, i) => {
      const spec = scatterSpecs[el.dataset.letter];
      const start = i * 0.025;
      tl.to(
        el,
        {
          x: vw(spec.tx),
          y: vh(spec.ty),
          rotation: spec.tr,
          scale: 1.12,
          duration: 1,
          ease: "none",
        },
        start
      );
      tl.to(el, { opacity: 0, filter: "blur(2px)", duration: 0.3, ease: "none" }, 0.72 + i * 0.02);
    });

    // brand statement text reveal
    tl.to(
      ".brand-statement-text",
      { opacity: 1, filter: "blur(0px)", duration: 0.42, ease: "none" },
      0.5
    );
  }

  buildScrollTransition();

  // rebuild on resize (debounced) so the assembled word stays centered
  // and scatter distances stay proportional to the new viewport
  let resizeT;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      buildScrollTransition();
      ScrollTrigger.refresh();
    }, 200);
  });

  // rebuild once webfonts finish swapping in, since that can shift letter
  // widths/kerning after the first (fallback-font) measurement
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      buildScrollTransition();
      ScrollTrigger.refresh();
    });
  }

  /* -----------------------------------------------------------
     BENEFITS — staggered reveal
  ----------------------------------------------------------- */
  document.querySelectorAll(".benefit-col").forEach((col, i) => {
    const icon = col.querySelector(".benefit-icon");
    const h4 = col.querySelector("h4");
    const p = col.querySelector("p");
    gsap.timeline({
      scrollTrigger: { trigger: col, start: "top 85%" },
      defaults: { duration: 0.6, ease: "power2.out" },
    })
      .to(icon, { opacity: 1, y: 0 })
      .to(h4, { opacity: 1, y: 0 }, "-=0.35")
      .to(p, { opacity: 1, y: 0 }, "-=0.35");
  });

  /* -----------------------------------------------------------
     PRODUCT CARDS — reveal + subtle hover parallax
  ----------------------------------------------------------- */
  gsap.utils.toArray(".product-card").forEach((card, i) => {
    gsap.from(card, {
      opacity: 0,
      y: 40,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: { trigger: card, start: "top 88%" },
      delay: i * 0.05,
    });

    if (!reduceMotion) {
      const media = card.querySelector(".product-card-media");
      const xTo = gsap.quickTo(media, "x", { duration: 0.6, ease: "power3.out" });
      const yTo = gsap.quickTo(media, "y", { duration: 0.6, ease: "power3.out" });
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        xTo(nx * 14);
        yTo(ny * 10);
      });
      card.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
    }
  });

  /* -----------------------------------------------------------
     CTA — floating earbud + mouse parallax
  ----------------------------------------------------------- */
  const ctaEarbud = document.getElementById("ctaEarbud");
  const ctaMedia = document.getElementById("ctaMedia");
  if (ctaEarbud) {
    gsap.fromTo(
      "#cta",
      { opacity: 0.001, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: "#cta", start: "top 82%" } }
    );

    if (!reduceMotion) {
      gsap.to(ctaEarbud, {
        y: -14,
        duration: 3.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      const xTo = gsap.quickTo(ctaMedia, "x", { duration: 0.8, ease: "power3.out" });
      document.getElementById("cta").addEventListener("mousemove", (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        xTo(nx * 16);
      });
    }
  }

  /* -----------------------------------------------------------
     Refresh ScrollTrigger once everything is laid out
  ----------------------------------------------------------- */
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
