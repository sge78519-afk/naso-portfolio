const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.documentElement.classList.add("is-ready");

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
