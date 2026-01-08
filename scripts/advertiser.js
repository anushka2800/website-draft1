/* =====================================================
   ADVERTISER PAGE ANIMATIONS
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector("#advertisers-page")) return;
  if (!window.anime) {
    console.warn("anime.js not loaded");
    return;
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  animateAdvertiserHero(prefersReducedMotion);
  animateAdCards(prefersReducedMotion);
  initAdCardHover(prefersReducedMotion);
  initAdFormatRotation(prefersReducedMotion);
});


/* =====================================================
   HERO ENTRANCE
   ===================================================== */

function animateAdvertiserHero(prefersReducedMotion) {
  if (prefersReducedMotion) {
    document.querySelectorAll(".advertiser-hero *").forEach(el => {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
    return;
  }

  anime.timeline({
    easing: "easeOutExpo",
    duration: 900
  })
    .add({
      targets: ".advertiser-hero-title",
      opacity: [0, 1],
      translateY: [40, 0]
    })
    .add({
      targets: ".advertiser-hero-sub",
      opacity: [0, 1],
      translateY: [30, 0]
    }, "-=600")
    .add({
      targets: ".advertiser-hero-cta a",
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(120)
    }, "-=500")
    .add({
      targets: ".advertiser-hero-trust",
      opacity: [0, 1],
      translateY: [16, 0]
    }, "-=400");
}


/* =====================================================
   FLOATING AD CARDS
   ===================================================== */

function animateAdCards(prefersReducedMotion) {
  if (prefersReducedMotion) return;

  const cards = document.querySelectorAll(".ad-card");

  cards.forEach((card, index) => {
    const floatTimeline = anime.timeline({
      targets: card,
      loop: true,
      easing: "easeInOutSine"
    }).add({
      translateY: [-24, 12, 0],
      translateX: [anime.random(-6, 6), 0],
      duration: 8000
    });

    floatTimeline.pause();
    floatTimeline.delay = index * 400;
    floatTimeline.play();

    card._floatTimeline = floatTimeline;
  });
}


/* =====================================================
   CARD HOVER INTERACTION
   ===================================================== */

function initAdCardHover(prefersReducedMotion) {
  if (prefersReducedMotion) return;

  const cards = document.querySelectorAll(".ad-card");

  cards.forEach(card => {
    let hoverAnim;

    card.addEventListener("mouseenter", () => {
      card._floatTimeline?.pause();
      hoverAnim?.pause();

      hoverAnim = anime({
        targets: card,
        scale: 1.1,
        translateY: -18,
        rotateY: anime.random(-8, 8),
        rotateX: anime.random(-6, 6),
        rotateZ: anime.random(-4, 4),
        boxShadow: "0 30px 60px rgba(0,0,0,0.3)",
        duration: 600,
        easing: "easeOutExpo"
      });
    });

    card.addEventListener("mouseleave", () => {
      hoverAnim?.pause();

      hoverAnim = anime({
        targets: card,
        scale: 1,
        translateY: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        boxShadow:
          "0 10px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
        duration: 800,
        easing: "easeOutQuint",
        complete: () => card._floatTimeline?.play()
      });
    });
  });
}


/* =====================================================
   AD FORMAT ROTATION (FADE ONLY)
   ===================================================== */

function initAdFormatRotation(prefersReducedMotion) {
  const formats = document.querySelectorAll(".demand-formats .format-item");
  const flow = document.querySelector(".flow-lines");

  if (!formats.length) return;

  let currentIndex = 0;

  // Initial state
  formats.forEach((el, i) => {
    el.style.opacity = i === 0 ? 1 : 0;
    el.classList.toggle("active", i === 0);
  });

  if (prefersReducedMotion) return;

  setInterval(() => {
  const current = formats[currentIndex];
  const nextIndex = (currentIndex + 1) % formats.length;
  const next = formats[nextIndex];

  // Fade OUT current
  anime({
    targets: current,
    opacity: [1, 0],
    duration: 1000,
    easing: "easeInOutQuad",
    complete: () => current.classList.remove("active")
  });

  // Fade IN next (slight delay = smoother)
  anime({
    targets: next,
    opacity: [0, 1],
    duration: 1200,
    delay: 300,
    easing: "easeInOutQuad",
    begin: () => next.classList.add("active")
  });

  // Update connecting line
  if (flow) {
    const isVideo = next.querySelector("img")?.alt === "Video Ads";
    flow.classList.toggle("video-active", isVideo);
  }

  currentIndex = nextIndex;

}, 5200);
}
