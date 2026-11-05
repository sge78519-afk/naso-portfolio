(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  const openProject = (hash) => {
    const target = document.getElementById(hash.slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
  };
  openProject(location.hash);
  document.querySelectorAll('.work-image').forEach(link => {
    link.addEventListener('click', () => openProject(link.hash));
  });
  window.addEventListener('hashchange', () => openProject(location.hash));
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.about-content, .work-card, .brand-copy, .practice-list > div').forEach(el => {
      el.classList.add('reveal', 'pending');
      observer.observe(el);
    });
  }
})();


/* ===== motion layer preview (2026-11-05) ===== */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.documentElement;
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  let ticking = false;
  const update = () => {
    ticking = false;
    const hero = document.querySelector('.hero');
    const y = window.scrollY;
    if (hero) {
      const limit = hero.offsetHeight;
      root.style.setProperty('--hero-shift', Math.min(y, limit) * 0.18 + 'px');
    }
    const max = document.documentElement.scrollHeight - innerHeight;
    root.style.setProperty('--progress', max > 0 ? Math.min(y / max, 1).toFixed(4) : 0);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', update);
  update();
})();
