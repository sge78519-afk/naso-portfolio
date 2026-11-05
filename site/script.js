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
