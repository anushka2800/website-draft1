document.addEventListener('DOMContentLoaded', () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasST = typeof window.ScrollTrigger !== 'undefined';

  // Register ScrollTrigger only if present
  if (hasGSAP && hasST) {
    gsap.registerPlugin(ScrollTrigger);
  } else if (hasGSAP && !hasST) {
    // console.warn('ScrollTrigger is not loaded. Include it before this script.');
  }

  // ---------------------------
  // 1) Hero word rotation (simple)
  // ---------------------------
  (function heroWords() {
    const wrap = document.querySelector('.dynamic-word-wrap');
    if (!wrap) return;
    const wordEl = wrap.querySelector('.dynamic-word');
    if (!wordEl) return;

    const words = ['Audiences', 'Publishers', 'Markets'];
    let index = words.indexOf(wordEl.textContent?.trim());
    if (index < 0) index = 0;

    // Reserve width to prevent layout jump
    try {
      const measure = document.createElement('span');
      measure.style.visibility = 'hidden';
      measure.style.position = 'absolute';
      measure.style.whiteSpace = 'nowrap';
      measure.style.font = window.getComputedStyle(wordEl).font;
      document.body.appendChild(measure);
      let maxW = 0;
      words.forEach(w => {
        measure.textContent = w;
        maxW = Math.max(maxW, measure.getBoundingClientRect().width);
      });
      document.body.removeChild(measure);
      wrap.style.minWidth = `${Math.ceil(maxW)}px`;
      wrap.style.position = 'relative';
    } catch (_) {}

    // Reduced-motion or missing GSAP: simple swap
    if (prefersReduced || !hasGSAP) {
      setInterval(() => {
        index = (index + 1) % words.length;
        wordEl.textContent = words[index];
      }, 1000);
      return;
    }

    // Smooth crossfade with a tiny timeline
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.8 });
    tl.to(wordEl, { duration: 0.3, opacity: 0, x: -10, ease: 'power2.in' })
      .add(() => {
        index = (index + 1) % words.length;
        wordEl.textContent = words[index];
      })
      .to(wordEl, { duration: 0.5, opacity: 1, x: 0, ease: 'power3.out' });

    // Pause on hover/focus
    wrap.addEventListener('mouseenter', () => tl.pause());
    wrap.addEventListener('mouseleave', () => tl.play());
    wrap.addEventListener('focusin',   () => tl.pause());
    wrap.addEventListener('focusout',  () => tl.play());
  })();

  // ---------------------------
  // 2) Simple marquee for logos
  // ---------------------------
  (function marquee() {
    const track = document.querySelector('.marquee-track');
    if (!track) return;

    if (prefersReduced || !hasGSAP) return;

    const items = Array.from(track.children);
    if (!items.length) return;

    const half = Math.floor(items.length / 2) || items.length;

    function computeHalfWidth() {
      let total = 0;
      for (let i = 0; i < half; i++) {
        const el = items[i];
        const r = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const mr = parseFloat(style.marginRight || 0);
        total += r.width + mr;
      }
      return total || track.scrollWidth / 2;
    }

    let width = computeHalfWidth();
    if (!width) return;

    const duration = Math.max(10, Math.round(width / 60));
    let tween = gsap.to(track, {
      x: `-=${Math.round(width)}px`,
      ease: 'none',
      duration,
      repeat: -1
    });

    const parent = track.parentElement || track;
    parent.addEventListener('mouseenter', () => tween.pause());
    parent.addEventListener('mouseleave', () => tween.play());
    parent.addEventListener('focusin',    () => tween.pause());
    parent.addEventListener('focusout',   () => tween.play());

    // Recompute on resize (debounced)
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newWidth = computeHalfWidth();
        if (Math.abs(newWidth - width) > 4) {
          width = newWidth;
          tween.kill();
          const newDuration = Math.max(8, Math.round(width / 60));
          tween = gsap.to(track, {
            x: `-=${Math.round(width)}px`,
            ease: 'none',
            duration: newDuration,
            repeat: -1
          });
        }
      }, 120);
    });
  })();

  // ========== 3) Video grow on scroll (GSAP + ScrollTrigger) ==========
  (function videoGrowOnScroll() {
    if (!hasGSAP || !hasST) return;

    const videoInner = document.querySelector('.video-inner');
    if (!videoInner) return;

    videoInner.style.transformOrigin = 'center center';

    gsap.to(videoInner, {
      width: '90%',
      ease: 'none',
      scrollTrigger: {
        trigger: videoInner,
        start: 'top center',
        end: '+=30%',
        scrub: 0.6,
        invalidateOnRefresh: true,
        // scroller: '.your-custom-scroller', // uncomment if you use a custom scroll container
        // markers: true,
      }
    });
  })();

  // ---------------------------
  // 4) small helper: set current year in footer (id="year")
  // ---------------------------
  (function setYear() {
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  })();

  // ====================== 5) SERVICES ANIMATIONS (Combo B — scrubbed) ======================
 // ====================== SERVICES — Curtain Drop (downward only) + Idle Float ======================
// ====================== SERVICES — Curtain Drop (downward only) ======================
(function servicesWaveRevealIdleFloat() {
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasST   = typeof window.ScrollTrigger !== 'undefined';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!hasGSAP || !hasST) return;

  const section = document.querySelector('.services-section');
  if (!section) return;

  const cards = gsap.utils.toArray('.services-section .svc-card');
  if (!cards.length) return;

  // Clean services-only triggers/tweens
  ScrollTrigger.getAll().forEach(st => {
    if (st.trigger?.closest?.('.services-section')) st.kill();
  });
  gsap.killTweensOf(cards);
  gsap.killTweensOf('.services-section .svc-card-inner');

  // ---------- Tuned settings ----------
  const INTENSITY    = 1.4;   // master multiplier
  const BASE_DROP    = -150;  // start higher above
  const BASE_PEEK    = 10;    // impact dip
  const BASE_SPREAD  = 0.7;   // wave spacing (radians)
  const DURATION     = 1.5;   // slower curtain drop
  const STAGGER_EACH = 0.06;  // wave cadence

  const DROP_FROM   = BASE_DROP * INTENSITY;
  const LAND_PEEK   = BASE_PEEK * INTENSITY;
  const WAVE_SPREAD = BASE_SPREAD;

  // Perf hints
  gsap.set(cards, { willChange: 'transform', transformPerspective: 800 });

  // ------ 1) Entrance: Curtain drop (downward only) ------
  function setPreState() {
    gsap.set(cards, {
      opacity: 0,
      y: (i) => DROP_FROM + Math.sin(i * WAVE_SPREAD) * (14 * INTENSITY),
      scale: 0.98
    });
  }
  setPreState();

  function buildRevealTL() {
    const tl = gsap.timeline({ paused: true });

    // Curtain drop
    tl.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      ease: 'expo.out',
      duration: DURATION,
      stagger: { each: STAGGER_EACH, from: 'center' } // 'start' for L→R
    });

    // Impact dip & settle
    tl.to(cards, {
      y: (i) => LAND_PEEK + Math.sin(i * WAVE_SPREAD) * 2,
      ease: 'sine.out',
      duration: 0.22,
      stagger: { each: STAGGER_EACH, from: 'center' }
    }, '-=0.95'); // overlap for punch

    tl.to(cards, {
      y: 0,
      ease: 'back.out(1.4)',
      duration: 0.36,
      stagger: { each: STAGGER_EACH, from: 'center' }
    }, '>-0.02');

    return tl;
  }
  let revealTL = buildRevealTL();

  // ------ 2) ScrollTrigger (downward only trigger, video-like behavior) ------
  ScrollTrigger.create({
    trigger: section,
    start: 'top 62%',        // starts a bit later in the viewport
    // no 'end' → acts as a gate like your video
    toggleActions: 'play none none reset', // play on scroll down, reset when scrolling back above
    onEnter: () => {
      if (prefersReduced) {
        gsap.to(cards, {
          opacity: 1, y: 0, scale: 1,
          ease: 'power2.out', duration: 0.6,
          stagger: { each: 0.05, from: 'start' }
        });
      } else {
        setPreState();
        revealTL.invalidate().restart(true);
      }
    },
    onEnterBack: () => {
      // Scroll up into section — show instantly, no animation
      gsap.set(cards, { opacity: 1, y: 0, scale: 1 });
    },
    onLeaveBack: () => {
      // When scrolling back above the section, reset so it replays next downward scroll
      setPreState();
    },
    invalidateOnRefresh: true,
    // scroller: '.your-custom-scroller',
    // markers: true, // uncomment for debugging
  });

  // Keep ScrollTrigger fresh on load
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();

// SIMPLE KPI Count-up — beginner friendly
(function simpleKpiCountUp() {
  // Config - tweak these
  const DURATION = 600;        // ms for each number
  const STAGGER = 80;          // ms between items (0 => all at once)
  const USE_ABBREV = true;     // true => 1.2K / 3.4M etc.
  const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const section = document.querySelector('#kpis');
  if (!section) return;
  const items = Array.from(section.querySelectorAll('.kpi-number'));
  if (!items.length) return;

  // parse a text like "+500M+" => { prefix: '+', num: 500000000, suffix: '+', decimals: 0 }
  function parseLabel(text) {
    const match = text.match(/([+\-]?\d{1,3}(?:[,\d]*)(?:\.\d+)?|\d+(?:\.\d+)?)/);
    if (!match) return { prefix: '', num: 0, suffix: text.trim(), decimals: 0 };
    const token = match[0];
    const i = text.indexOf(token);
    const prefix = text.slice(0, i);
    const suffix = text.slice(i + token.length);
    const num = parseFloat(token.replace(/,/g, '')) || 0;
    const decimals = token.includes('.') ? token.split('.')[1].length : 0;
    return { prefix, num, suffix, decimals };
  }

  // abbreviate e.g. 1200 -> "1.2K", 1_500_000 -> "1.5M"
  function abbreviate(n, decimals) {
    const abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toFixed(Math.min(2, Math.max(0, decimals || 1))) + 'B';
    if (abs >= 1e6) return (n / 1e6).toFixed(Math.min(2, Math.max(0, decimals || 1))) + 'M';
    if (abs >= 1e3) return (n / 1e3).toFixed(Math.min(1, Math.max(0, decimals || 0))) + 'K';
    return decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString();
  }

  function formatValue(value, decimals) {
    return USE_ABBREV ? abbreviate(value, decimals) : (decimals > 0 ? Number(value).toFixed(decimals) : Math.round(value).toLocaleString());
  }

  // ease out quad
  function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }

  // animate single element from 0 -> target using requestAnimationFrame
  function animateElement(el, parsed, duration) {
    if (PREFERS_REDUCED) {
      // show final instantly for reduced-motion users
      el.textContent = parsed.prefix + formatValue(parsed.num, parsed.decimals) + parsed.suffix;
      return;
    }
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutQuad(t);
      const value = parsed.num * eased;
      el.textContent = parsed.prefix + formatValue(value, parsed.decimals) + parsed.suffix;
      if (t < 1) requestAnimationFrame(step);
      else {
        // ensure exact final value
        el.textContent = parsed.prefix + formatValue(parsed.num, parsed.decimals) + parsed.suffix;
      }
    }
    requestAnimationFrame(step);
  }

  // IntersectionObserver to trigger when #kpis is visible
  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      // animate items with a small stagger
      items.forEach((el, i) => {
        if (el.dataset.kpiDone === '1') return; // don't re-animate
        el.dataset.kpiDone = '1';
        const parsed = parseLabel(el.textContent.trim());
        setTimeout(() => animateElement(el, parsed, DURATION), i * STAGGER);
      });
      o.unobserve(entry.target); // run once
    });
  }, { threshold: 0.7 });

  obs.observe(section);
})();
// STAGGERED REVEAL for advertiser & publisher points
(function columnPointsStagger() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STAGGER_MS = 110; // change to 70 for snappier, 160 for slower

  // select the two columns already in your markup
  const blocks = document.querySelectorAll('.advertiser-column, .publishers-column');
  if (!blocks.length) return;

  function revealPoints(container) {
    const points = Array.from(container.querySelectorAll('.feature-list li'));
    if (!points.length) return;

    if (prefersReduced) {
      points.forEach(p => p.classList.add('visible'));
      return;
    }

    points.forEach((p, i) => {
      // avoid re-animating same item
      if (p.dataset.revealed === '1') return;
      setTimeout(() => {
        p.classList.add('visible');
        p.dataset.revealed = '1';
      }, i * STAGGER_MS);
    });
  }

  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      revealPoints(entry.target);
      // run once per block — comment this out to animate again on re-entry
      o.unobserve(entry.target);
    });
  }, {
    threshold: 0.28,
    rootMargin: '0px 0px -20% 0px' // fires a little later (when block is lower in viewport)
  });

  blocks.forEach(b => obs.observe(b));
})();
// === tiny glowy dot that toggles between rgb(0,119,237) and #ebc500 ===
 (function createGlowDot() {
  const COLORS = ['rgb(0,119,237)', '#ebc500', '#00E5FF', '#FF2EC4', '#7CFF00', '#FF7A00'];
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let dot = document.getElementById('glow-dot');
  if (!dot) {
    dot = document.createElement('div');
    dot.id = 'glow-dot';
    document.body.appendChild(dot);
  }

  function hexAlphaFallback(col, alpha) {
    if (col.startsWith('rgb')) {
      return col.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    try {
      let hex = col.replace('#','');
      if (hex.length === 3) hex = hex.split('').map(s=>s+s).join('');
      const r = parseInt(hex.slice(0,2),16);
      const g = parseInt(hex.slice(2,4),16);
      const b = parseInt(hex.slice(4,6),16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) {
      return col;
    }
  }

  function setDotColor(color) {
    dot.style.background = color;
    dot.style.boxShadow = `0 0 18px 8px ${color}, 0 0 40px 18px ${hexAlphaFallback(color, 0.18)}`;
  }

  // helper: pick a random color that is not the same as current
  function pickRandomColor(exclude) {
    if (!Array.isArray(COLORS) || COLORS.length === 0) return exclude || COLORS[0];
    if (COLORS.length === 1) return COLORS[0];
    let idx;
    do {
      idx = Math.floor(Math.random() * COLORS.length);
    } while (COLORS[idx] === exclude);
    return COLORS[idx];
  }

  let currentColor = COLORS[0];
  setDotColor(currentColor);

  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let pos  = { x: mouse.x, y: mouse.y };
  let idleTimeout = null;
  const IDLE_MS = 900;
  const CHANGE_CHANCE = 0.28;

  function onMove(e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
    dot.style.opacity = '1';

    if (Math.random() < CHANGE_CHANCE) {
      const newColor = pickRandomColor(currentColor);
      currentColor = newColor;
      setDotColor(newColor);
    }

    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => { dot.style.opacity = '0'; }, IDLE_MS);
  }

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerleave', () => { dot.style.opacity = '0'; }, { passive: true });

  const hasGSAP = typeof window.gsap !== 'undefined';
  if (hasGSAP) {
    gsap.ticker.add(() => {
      pos.x += (mouse.x - pos.x) * 0.18;
      pos.y += (mouse.y - pos.y) * 0.18;
      dot.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
    });
  } else {
    function rafLoop() {
      pos.x += (mouse.x - pos.x) * 0.18;
      pos.y += (mouse.y - pos.y) * 0.18;
      dot.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
      requestAnimationFrame(rafLoop);
    }
    requestAnimationFrame(rafLoop);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') dot.style.opacity = '0';
  });

  window.__glowDot = {
    setColor: (c) => { currentColor = c; setDotColor(c); },
    show: () => { dot.style.opacity = '1'; },
    hide: () => { dot.style.opacity = '0'; }
  };
})();

  // Final: after all assets (images/fonts) load, recompute trigger positions
  if (hasST) {
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
  }
});
