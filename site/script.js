const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.documentElement.classList.add("is-ready");

/* ── Mountain trail cursor stickers ── */
const initMountainTrail = () => {
  const supportsPointer = "PointerEvent" in window;
  const supportsAnimation = "animate" in document.documentElement;
  if (reduceMotion || !supportsPointer || !supportsAnimation) return;

  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const trailAssets = [
    {
      src: "assets/extracted-mountain-trail/png/mountain-trail-classic.png",
      weight: 1.35,
      size: [96, 164],
      opacity: 0.9,
      duration: [1180, 1540]
    },
    {
      src: "assets/extracted-mountain-trail/png/mountain-trail-simple.png",
      weight: 1.15,
      size: [92, 152],
      opacity: 0.86,
      duration: [1040, 1420]
    },
    {
      src: "assets/extracted-mountain-trail/png/mountain-trail-ink-shadow.png",
      weight: 1,
      size: [90, 148],
      opacity: 0.78,
      duration: [1080, 1460]
    },
    {
      src: "assets/extracted-mountain-trail/png/mountain-trail-line.png",
      weight: 0.92,
      size: [94, 156],
      opacity: 0.76,
      duration: [1120, 1500]
    },
    {
      src: "assets/extracted-mountain-trail/png/mountain-trail-thumb-01.png",
      weight: 0.82,
      size: [58, 96],
      opacity: 0.88,
      duration: [900, 1240]
    },
    {
      src: "assets/extracted-mountain-trail/png/mountain-trail-thumb-02.png",
      weight: 0.72,
      size: [58, 96],
      opacity: 0.64,
      duration: [900, 1240]
    },
    {
      src: "assets/extracted-mountain-trail/png/mountain-glow.png",
      weight: 0.72,
      size: [34, 72],
      opacity: 0.82,
      duration: [760, 1080]
    },
    {
      src: "assets/extracted-mountain-trail/png/mountain-trail-wide.png",
      weight: 0.24,
      size: [176, 292],
      opacity: 0.58,
      duration: [1320, 1760]
    }
  ];

  const weightedAssets = trailAssets.flatMap((asset) => {
    const repeats = Math.max(1, Math.round(asset.weight * 10));
    return Array.from({ length: repeats }, () => asset);
  });

  const layer = document.createElement("div");
  layer.className = "mountain-trail-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.append(layer);

  trailAssets.forEach((asset) => {
    const image = new Image();
    image.decoding = "async";
    image.src = asset.src;
  });

  const activeStickers = new Set();
  const spawnDistance = finePointer ? 72 : 46;
  const maxStickers = finePointer ? 16 : 8;
  const minSpawnDelay = finePointer ? 46 : 72;
  let lastX = null;
  let lastY = null;
  let lastSpawnX = null;
  let lastSpawnY = null;
  let lastSpawnAt = 0;
  let touchActive = false;

  const randomBetween = ([min, max]) => min + Math.random() * (max - min);

  const pickAsset = () => weightedAssets[Math.floor(Math.random() * weightedAssets.length)];

  const trimActiveStickers = () => {
    while (activeStickers.size > maxStickers) {
      const firstSticker = activeStickers.values().next().value;
      if (!firstSticker) return;
      firstSticker.remove();
      activeStickers.delete(firstSticker);
    }
  };

  const spawnSticker = (x, y, velocityX, velocityY, pointerType) => {
    const asset = pickAsset();
    const sticker = document.createElement("img");
    const size = randomBetween(asset.size) * (pointerType === "touch" ? 0.72 : 1);
    const drift = pointerType === "touch" ? 34 : 58;
    const jitterX = randomBetween([-18, 18]);
    const jitterY = randomBetween([-16, 16]);
    const distance = Math.hypot(velocityX, velocityY) || 1;
    const unitX = velocityX / distance;
    const unitY = velocityY / distance;
    const crossX = -unitY * randomBetween([-20, 20]);
    const crossY = unitX * randomBetween([-14, 14]);
    const startRotate = randomBetween([-16, 16]);
    const endRotate = startRotate + randomBetween([-18, 18]);
    const startX = x - unitX * 10 + jitterX;
    const startY = y - unitY * 10 + jitterY;
    const midX = x + unitX * drift * 0.45 + crossX;
    const midY = y + unitY * drift * 0.45 + crossY;
    const endX = x + unitX * drift + crossX * 1.4;
    const endY = y + unitY * drift + crossY * 1.4 - randomBetween([8, 22]);

    sticker.className = "mountain-trail-sticker";
    sticker.src = asset.src;
    sticker.alt = "";
    sticker.decoding = "async";
    sticker.draggable = false;
    sticker.style.setProperty("--trail-size", `${size}px`);
    sticker.style.setProperty("--trail-x", `${startX}px`);
    sticker.style.setProperty("--trail-y", `${startY}px`);
    sticker.style.setProperty("--trail-rotate", `${startRotate}deg`);
    layer.append(sticker);
    activeStickers.add(sticker);
    trimActiveStickers();

    const duration = randomBetween(asset.duration);
    const easing = "cubic-bezier(0.18, 0.72, 0.22, 1)";
    const animation = sticker.animate([
      {
        opacity: 0,
        transform: `translate3d(${startX - size / 2}px, ${startY - size / 2}px, 0) rotate(${startRotate}deg) scale(0.58)`
      },
      {
        opacity: asset.opacity,
        transform: `translate3d(${midX - size / 2}px, ${midY - size / 2}px, 0) rotate(${startRotate * 0.45}deg) scale(1)`,
        offset: 0.18
      },
      {
        opacity: asset.opacity * 0.46,
        transform: `translate3d(${endX - size / 2}px, ${endY - size / 2}px, 0) rotate(${endRotate}deg) scale(0.84)`,
        offset: 0.74
      },
      {
        opacity: 0,
        transform: `translate3d(${endX - size / 2}px, ${endY - size / 2}px, 0) rotate(${endRotate}deg) scale(0.68)`
      }
    ], {
      duration,
      easing,
      fill: "forwards"
    });

    animation.onfinish = () => {
      sticker.remove();
      activeStickers.delete(sticker);
    };
  };

  const shouldHandlePointer = (event) => {
    if (event.pointerType === "mouse") return finePointer;
    return touchActive && event.isPrimary;
  };

  const handlePointerMove = (event) => {
    if (!shouldHandlePointer(event)) return;

    const x = event.clientX;
    const y = event.clientY;
    const now = performance.now();
    const velocityX = lastX === null ? 1 : x - lastX;
    const velocityY = lastY === null ? 0 : y - lastY;
    const spawnDistanceFromLast = lastSpawnX === null
      ? spawnDistance
      : Math.hypot(x - lastSpawnX, y - lastSpawnY);

    lastX = x;
    lastY = y;

    if (now - lastSpawnAt < minSpawnDelay || spawnDistanceFromLast < spawnDistance) return;

    lastSpawnX = x;
    lastSpawnY = y;
    lastSpawnAt = now;
    spawnSticker(x, y, velocityX, velocityY, event.pointerType);
  };

  document.addEventListener("pointermove", handlePointerMove, { passive: true });
  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" || !event.isPrimary) return;
    touchActive = true;
    lastX = event.clientX;
    lastY = event.clientY;
    lastSpawnX = null;
    lastSpawnY = null;
  }, { passive: true });
  document.addEventListener("pointerup", () => {
    touchActive = false;
  }, { passive: true });
  document.addEventListener("pointercancel", () => {
    touchActive = false;
  }, { passive: true });
  document.addEventListener("pointerleave", () => {
    lastX = null;
    lastY = null;
    lastSpawnX = null;
    lastSpawnY = null;
  }, { passive: true });
};

initMountainTrail();

/* ── Scroll progress bar ── */
const updateScrollProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(Math.max(window.scrollY / scrollable, 0), 1) : 0;
  document.documentElement.style.setProperty("--scroll-progress", progress.toString());
};

updateScrollProgress();
window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);

/* ── Header scroll state ── */
const siteHeader = document.querySelector(".site-header");
const updateHeaderState = () => {
  if (!siteHeader) return;
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
};
updateHeaderState();
window.addEventListener("scroll", updateHeaderState, { passive: true });

/* ── Hero parallax (subtle, desktop only) ── */
const heroBg = document.querySelector(".hero-bg");
const parallaxMediaQuery = window.matchMedia("(min-width: 900px) and (pointer: fine)");

const updateHeroParallax = () => {
  if (reduceMotion || !heroBg || !parallaxMediaQuery.matches) {
    if (heroBg) heroBg.style.backgroundPositionY = "";
    return;
  }
  const scrollY = window.scrollY;
  const hero = heroBg.closest(".hero");
  if (!hero) return;
  const heroBottom = hero.offsetTop + hero.offsetHeight;
  if (scrollY > heroBottom) return;
  /* 使用 background-position 实现视差，不与 CSS transform 动画冲突 */
  const offset = scrollY * 0.08;
  heroBg.style.backgroundPositionY = `calc(42% + ${offset}px)`;
};

if (!reduceMotion) {
  updateHeroParallax();
  window.addEventListener("scroll", updateHeroParallax, { passive: true });
  parallaxMediaQuery.addEventListener("change", () => {
    updateHeroParallax();
  });
}

/* ── Desktop snap-scroll (refined) ── */
const snapMediaQuery = window.matchMedia("(min-width: 900px) and (pointer: fine)");

const getSnapOffset = () => {
  const header = document.querySelector(".site-header");
  return header ? header.offsetHeight : 0;
};

const getSnapPoints = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const targets = document.querySelectorAll([
    ".hero",
    ".profile-section",
    ".works-section .section-heading",
    ".work-group",
    ".method-section",
    ".contact-section",
    ".site-footer"
  ].join(","));

  return Array.from(targets)
    .map((el) => {
      const rawTop = el.getBoundingClientRect().top + window.scrollY;
      const offset = el.classList.contains("hero") ? 0 : getSnapOffset();
      return Math.min(Math.max(rawTop - offset, 0), maxScroll);
    })
    .sort((a, b) => a - b)
    .filter((point, index, points) => index === 0 || Math.abs(point - points[index - 1]) > 28);
};

let snapLocked = false;
let wheelDelta = 0;
const WHEEL_THRESHOLD = 24;  /* 略高阈值，减少误触发 */
const SNAP_TIMEOUT = 700;    /* 更快的恢复间隔 */

const scrollToSnapPoint = (direction) => {
  const current = window.scrollY;
  const points = getSnapPoints();
  const target = direction > 0
    ? points.find((point) => point > current + 32)
    : [...points].reverse().find((point) => point < current - 32);

  if (target === undefined) {
    snapLocked = false;
    return;
  }

  window.scrollTo({ top: target, behavior: "smooth" });

  window.setTimeout(() => {
    snapLocked = false;
  }, SNAP_TIMEOUT);
};

window.addEventListener("wheel", (event) => {
  if (reduceMotion || !snapMediaQuery.matches || event.ctrlKey || event.metaKey) {
    return;
  }

  /* 忽略触控板横向滑动 */
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
    return;
  }

  event.preventDefault();

  if (snapLocked) {
    return;
  }

  wheelDelta += event.deltaY;

  if (Math.abs(wheelDelta) < WHEEL_THRESHOLD) {
    return;
  }

  const direction = Math.sign(wheelDelta);
  wheelDelta = 0;
  snapLocked = true;
  scrollToSnapPoint(direction);
}, { passive: false });

/* ── Scroll reveal ── */
if (!reduceMotion) {
  const revealTargets = document.querySelectorAll([
    ".identity-strip > div",
    ".profile-copy",
    ".profile-card",
    ".section-heading",
    ".work-group",
    ".work-card",
    ".method-layout > div:first-child",
    ".method-grid article",
    ".contact-panel"
  ].join(","));

  revealTargets.forEach((el, index) => {
    el.classList.add("reveal");
    el.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 90}ms`);
  });

  if (!("IntersectionObserver" in window)) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12
    });

    revealTargets.forEach((el) => observer.observe(el));
  }
} else {
  document.documentElement.classList.add("reduce-motion");
}
