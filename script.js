document.addEventListener("DOMContentLoaded", function () {
  /* ================== MOTION PREFERENCE ================== */
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================== HERO DYNAMIC WORDS ================== */
  const words = document.querySelectorAll(".dynamic-text .word");
  let currentIndex = 0;

  function showNextWord() {
    if (words.length === 0) return;

    const currentWord = words[currentIndex];
    const nextIndex = (currentIndex + 1) % words.length;
    const nextWord = words[nextIndex];

    if (window.anime && !prefersReducedMotion) {
      anime({
        targets: currentWord,
        translateY: [0, -80],
        opacity: [1, 0],
        easing: "easeOutExpo",
        duration: 600
      });

      anime({
        targets: nextWord,
        translateY: [80, 0],
        opacity: [0, 1],
        easing: "easeOutExpo",
        duration: 700,
        delay: 250,
        complete: () => {
          currentIndex = nextIndex;
        }
      });
    } else {
      currentWord.style.opacity = 0;
      nextWord.style.opacity = 1;
      currentIndex = nextIndex;
    }
  }

  if (words.length > 0) {
    words.forEach((w, i) => {
      w.style.opacity = i === 0 ? 1 : 0;
      w.style.transform = "translateY(0)";
    });

    if (!prefersReducedMotion) {
      setInterval(showNextWord, 2800);
    }
  }

  /* ================== SERVICES SCROLL-IN (CARDS) ================== */
  const serviceCards = document.querySelectorAll(".service-pill");

  if (serviceCards.length > 0) {
    if (prefersReducedMotion) {
      serviceCards.forEach((card) => card.classList.add("in-view"));
    } else if ("IntersectionObserver" in window) {
      const cardObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const card = entry.target;
              const index = Array.from(serviceCards).indexOf(card);
              setTimeout(() => {
                card.classList.add("in-view");
              }, index * 200);
              cardObserver.unobserve(card);
            }
          });
        },
        {
          threshold: 0.25
        }
      );

      serviceCards.forEach((card) => cardObserver.observe(card));
    } else {
      serviceCards.forEach((card) => card.classList.add("in-view"));
    }
  }

  /* ================== HELPER: SECTION PROGRESS ================== */

  function getSectionProgress(sectionEl) {
    const rect = sectionEl.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    const maxDistance = rect.height + vh;
    const distance = vh - rect.top;
    let progress = distance / maxDistance;

    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;
    return progress; // 0 → 1
  }

  /* ================== BLOB SCROLL + MORPH ================== */

  if (!prefersReducedMotion && window.anime) {
    // collect all hero-blob svgs that are linked to a section
    const blobSvgs = document.querySelectorAll(".hero-blob[data-section]");
    const blobs = [];

    blobSvgs.forEach((svg) => {
      const sectionSelector = svg.getAttribute("data-section");
      const section = document.querySelector(sectionSelector);
      if (!section) return;

      const direction = svg.getAttribute("data-direction") || "center";
      const pathEl = svg.querySelector(".blob-path");
      if (!pathEl) return;

      const d1 = pathEl.getAttribute("d");
      const d2 = pathEl.getAttribute("data-alt-shape") || d1;

      const morphAnim = anime({
        targets: pathEl,
        d: [d1, d2],
        easing: "easeInOutQuad",
        duration: 1700,
        direction: "alternate",
        loop: true,
        autoplay: false
      });

      blobs.push({
        svg,
        section,
        direction,
        morphAnim
      });
    });

    // Start/stop morph when section is visible
    if (blobs.length > 0 && "IntersectionObserver" in window) {
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            blobs
              .filter((b) => b.section === entry.target)
              .forEach((blob) => {
                if (entry.isIntersecting) {
                  blob.morphAnim.play();
                } else {
                  blob.morphAnim.pause();
                }
              });
          });
        },
        { threshold: 0.2 }
      );

      // observe each unique section
      const uniqueSections = [...new Set(blobs.map((b) => b.section))];
      uniqueSections.forEach((sec) => sectionObserver.observe(sec));
    }

    // Parallax / position change on scroll
    function updateBlobParallax() {
      blobs.forEach((blob) => {
        const p = getSectionProgress(blob.section); // 0 → 1

        // vertical travel
        const maxY = 180;
        const offsetY = (p - 0.5) * 2 * maxY; // -maxY → +maxY

        // horizontal drift based on direction
        const maxX =140;
        let offsetX = 0;
        if (blob.direction === "left") {
          offsetX = -(p * maxX);
        } else if (blob.direction === "right") {
          offsetX = p * maxX;
        }

        blob.svg.style.setProperty("--blob-offset-y", offsetY.toFixed(1) + "px");
        blob.svg.style.setProperty("--blob-offset-x", offsetX.toFixed(1) + "px");
      });
    }

    updateBlobParallax();
    window.addEventListener("scroll", () => {
      requestAnimationFrame(updateBlobParallax);
    });
    window.addEventListener("resize", () => {
      requestAnimationFrame(updateBlobParallax);
    });
  }
   const kpiSection = document.querySelector(".kpi-section");
  const kpiValues = kpiSection
    ? Array.from(kpiSection.querySelectorAll(".kpi-box h3"))
    : [];

  if (
    kpiSection &&
    kpiValues.length > 0 &&
    window.anime &&
    !prefersReducedMotion
  ) {
    let hasAnimatedKpis = false; // runs once per page load

    function animateKpis() {
      kpiValues.forEach((el) => {
        const original =
          el.getAttribute("data-original-text") || el.textContent.trim();

        if (!el.hasAttribute("data-original-text")) {
          el.setAttribute("data-original-text", original);
        }

        const isBn = /BN\+?/i.test(original);
        const numberMatch = original.match(/[\d.,]+/);

        if (!numberMatch) return;

        const targetNumber = parseFloat(numberMatch[0].replace(/,/g, ""));
        if (isNaN(targetNumber)) return;

        // suffix: everything except the digits / commas / dot
        const suffix = isBn
          ? " BN+"
          : original.replace(/[\d.,]+/g, "").trim();

        const counter = { value: 0 };

        anime({
          targets: counter,
          value: targetNumber,
          duration: isBn ? 2600 : 2200, // slower than before
          easing: "easeOutQuad",
          update() {
            if (isBn) {
              // show one decimal so it feels like it's moving: 0.0 → 1.0 BN+
              const displayVal = counter.value.toFixed(1);
              el.textContent = displayVal + suffix;
            } else {
              const current = Math.round(counter.value);
              el.textContent = current.toLocaleString() + (suffix ? " " + suffix : "");
            }
          }
        });
      });
    }

    if ("IntersectionObserver" in window) {
      const kpiObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimatedKpis) {
              hasAnimatedKpis = true;
              animateKpis();
            }
          });
        },
        { threshold: 0.35 }
      );

      kpiObserver.observe(kpiSection);
    } else {
      // fallback: animate immediately
      animateKpis();
    }
  }
  /* ================== ADVERTISER / PUBLISHER HEADING + POINTS ================== */

  const advertisersSection = document.querySelector("#advertisers");
  const advertiserCol = document.querySelector(".advertiser-column");
  const publisherCol = document.querySelector(".publishers-column");

  function showColumnInstant(colEl) {
    if (!colEl) return;
    const title = colEl.querySelector(".column-title");
    const items = colEl.querySelectorAll(".feature-list li");

    if (title) {
      title.style.opacity = "1";
      title.style.transform = "none";
    }
    items.forEach((li) => {
      li.classList.add("bullet-visible");
    });
  }

  // Show bullets one by one, like new lines appearing (no fade/slide)
  function revealBulletsLineByLine(colEl) {
    if (!colEl) return;
    const items = colEl.querySelectorAll(".feature-list li");

    items.forEach((li, index) => {
      setTimeout(() => {
        li.classList.add("bullet-visible"); // instantly visible
      }, index * 350); // gap between points (350ms, tweak if you want slower/faster)
    });
  }

  if (advertisersSection && advertiserCol && publisherCol) {
    if (
      prefersReducedMotion ||
      !window.anime ||
      !("IntersectionObserver" in window)
    ) {
      // No fancy animation → just show everything
      showColumnInstant(advertiserCol);
      showColumnInstant(publisherCol);
    } else {
      function animateColumn(colEl) {
        const title = colEl.querySelector(".column-title");

        if (!title) {
          revealBulletsLineByLine(colEl);
          return;
        }

        // Heading: smooth slide + fade using anime.js
        anime({
          targets: title,
          translateY: [24, 0],
          opacity: [0, 1],
          duration: 900,
          easing: "easeOutCubic",
          complete: () => {
            // After heading is in, reveal bullets line by line (no fade/slide)
            revealBulletsLineByLine(colEl);
          }
        });
      }

      let hasAnimatedAdvertiser = false;
      let hasAnimatedPublisher = false;

      const colObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            if (entry.target === advertiserCol && !hasAnimatedAdvertiser) {
              hasAnimatedAdvertiser = true;
              animateColumn(advertiserCol);
            }

            if (entry.target === publisherCol && !hasAnimatedPublisher) {
              hasAnimatedPublisher = true;
              animateColumn(publisherCol);
            }
          });
        },
        {
          threshold: 0.6 // start when ~60% of column is visible → not too early
        }
      );

      colObserver.observe(advertiserCol);
      colObserver.observe(publisherCol);
    }
  }

  /* ================== FOOTER YEAR ================== */

  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});