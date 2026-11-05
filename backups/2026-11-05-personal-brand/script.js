const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

const ready = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
};

function initCursor() {
  const cursor = document.querySelector(".cursor-main");
  const label = document.querySelector(".cursor-label");
  if (!cursor || !label) return;

  document.documentElement.classList.add("cursor-ready");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;
  let labelX = mouseX;
  let labelY = mouseY;

  const move = () => {
    cursorX += (mouseX - cursorX) * 0.22;
    cursorY += (mouseY - cursorY) * 0.22;
    labelX += (mouseX - labelX) * 0.14;
    labelY += (mouseY - labelY) * 0.14;

    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
    label.style.transform = `translate3d(${labelX}px, ${labelY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(move);
  };

  requestAnimationFrame(move);

  window.addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  }, { passive: true });

  const hoverTargets = document.querySelectorAll("a, button, .case-card, .method-card, [data-cursor-label]");

  hoverTargets.forEach((target) => {
    target.addEventListener("pointerenter", () => {
      const text = target.getAttribute("data-cursor-label") || "VIEW";
      label.textContent = text;
      cursor.classList.add("is-hovering");
      label.classList.add("is-visible");
    });

    target.addEventListener("pointerleave", () => {
      cursor.classList.remove("is-hovering");
      label.classList.remove("is-visible");
    });
  });
}

function initInkTrail() {
  const supportsCanvas = typeof HTMLCanvasElement !== "undefined";
  if (!supportsCanvas) return;

  const canvas = document.createElement("canvas");
  canvas.className = "ink-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const colors = [
    [231, 236, 232],
    [174, 185, 186],
    [91, 148, 154],
    [196, 166, 106]
  ];
  const particles = [];
  const maxParticles = 160;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let lastX = null;
  let lastY = null;
  let lastSpawnAt = 0;
  let animationFrame = null;

  const random = (min, max) => min + Math.random() * (max - min);

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const spawnInk = (x, y, velocityX, velocityY) => {
    const speed = Math.min(Math.hypot(velocityX, velocityY), 44);
    const count = speed > 18 ? 8 : 5;

    for (let index = 0; index < count; index += 1) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const drift = random(0.12, 0.46);
      particles.push({
        x: x + random(-12, 12),
        y: y + random(-12, 12),
        vx: velocityX * drift + random(-0.75, 0.75),
        vy: velocityY * drift + random(-0.75, 0.75),
        radius: random(14, speed > 20 ? 40 : 28),
        stretch: random(0.58, 1.28),
        alpha: random(0.1, 0.24),
        life: random(78, 132),
        age: 0,
        rotation: random(0, Math.PI * 2),
        spin: random(-0.018, 0.018),
        color
      });
    }

    if (particles.length > maxParticles) {
      particles.splice(0, particles.length - maxParticles);
    }
  };

  const drawParticle = (particle) => {
    const progress = particle.age / particle.life;
    const fade = Math.pow(1 - progress, 1.7);
    const radius = particle.radius * (1 + progress * 2.8);
    const [red, green, blue] = particle.color;
    const alpha = particle.alpha * fade;

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.scale(1 + particle.stretch * progress, 0.68 + particle.stretch * 0.36);

    const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    bloom.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${alpha})`);
    bloom.addColorStop(0.38, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.42})`);
    bloom.addColorStop(0.72, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.12})`);
    bloom.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);

    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * random(0.72, 1.05), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const render = () => {
    ctx.clearRect(0, 0, width, height);

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.age += 1;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.955;
      particle.vy *= 0.955;
      particle.rotation += particle.spin;

      if (particle.age >= particle.life) {
        particles.splice(index, 1);
        continue;
      }

      drawParticle(particle);
    }

    animationFrame = requestAnimationFrame(render);
  };

  const handlePointerMove = (event) => {
    if (event.pointerType && event.pointerType !== "mouse") return;

    const x = event.clientX;
    const y = event.clientY;
    const now = performance.now();
    const velocityX = lastX === null ? 0 : x - lastX;
    const velocityY = lastY === null ? 0 : y - lastY;
    const distance = Math.hypot(velocityX, velocityY);

    lastX = x;
    lastY = y;

    if (distance < 4 || now - lastSpawnAt < 12) return;

    lastSpawnAt = now;
    spawnInk(x, y, velocityX, velocityY);
  };

  const handlePointerLeave = () => {
    lastX = null;
    lastY = null;
  };

  resize();
  render();

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerleave", handlePointerLeave, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
      return;
    }

    if (!document.hidden && !animationFrame) {
      render();
    }
  });
}

ready(() => {
  const root = document.documentElement;
  const introGate = document.querySelector(".intro-gate");
  const siteHeader = document.querySelector(".site-header");
  const heroBg = document.querySelector(".hero-bg");
  const navLinks = Array.from(document.querySelectorAll(".site-nav a"));

  requestAnimationFrame(() => {
    root.classList.add("is-ready");
  });

  if (introGate) {
    window.setTimeout(() => {
      introGate.classList.add("is-hidden");
    }, reduceMotion ? 0 : 1850);
  }

  const updateScrollProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(Math.max(window.scrollY / scrollable, 0), 1) : 0;
    root.style.setProperty("--scroll-progress", progress.toString());
  };

  const updateHeaderState = () => {
    if (!siteHeader) return;
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  const updateHeroParallax = () => {
    if (reduceMotion || !heroBg || window.innerWidth < 900) {
      if (heroBg) heroBg.style.backgroundPositionY = "";
      return;
    }

    const hero = heroBg.closest(".hero");
    if (!hero) return;

    const heroBottom = hero.offsetTop + hero.offsetHeight;
    if (window.scrollY > heroBottom) return;

    const offset = window.scrollY * 0.08;
    heroBg.style.backgroundPositionY = `calc(44% + ${offset}px)`;
  };

  updateScrollProgress();
  updateHeaderState();
  updateHeroParallax();

  window.addEventListener("scroll", () => {
    updateScrollProgress();
    updateHeaderState();
    updateHeroParallax();
  }, { passive: true });

  window.addEventListener("resize", () => {
    updateScrollProgress();
    updateHeroParallax();
  });

  if (!reduceMotion) {
    const revealTargets = Array.from(document.querySelectorAll([
      ".signal-strip > div",
      ".revealable",
      ".case-card",
      ".method-card"
    ].join(",")));

    revealTargets.forEach((target, index) => {
      target.classList.add("revealable");
      target.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
    });

    if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      }, {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.12
      });

      revealTargets.forEach((target) => revealObserver.observe(target));
    } else {
      revealTargets.forEach((target) => target.classList.add("is-visible"));
    }
  } else {
    document.querySelectorAll(".revealable").forEach((target) => {
      target.classList.add("is-visible");
    });
  }

  if ("IntersectionObserver" in window && navLinks.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
        });
      });
    }, {
      rootMargin: "-35% 0px -55% 0px",
      threshold: 0.01
    });

    document.querySelectorAll("main section[id]").forEach((section) => navObserver.observe(section));
  }

  if (!reduceMotion && finePointer) {
    initInkTrail();
    initCursor();
  }
});
