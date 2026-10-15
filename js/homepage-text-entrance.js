/** Homepage Effect 3: reveal readable text once as each region becomes visible. */
(function () {
  'use strict';

  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const selector = [
    '[data-intro-nav]', '.hero-text .label', '.hero-title', '.hero-body',
    '.info-cell .label', '.info-cell .cell-content a',
    '.works-indicator > .label', '.works-counter',
    '.slide-content > .label', '.slide-content h2', '.slide-desc',
    '.slide-meta p', '.slide-link', '#cursor-tooltip',
    '.folio-profile > .folio-label', '.folio-profile h1', '.folio-bio',
    '.folio-contact .folio-label', '.folio-contact a',
    '.folio-work-heading > .folio-label', '.folio-count',
    '.folio-project h2', '.folio-description', '.folio-project-link',
  ].join(',');
  const targets = [];
  const shown = new WeakSet();
  const running = new Map();
  const observers = [];
  let stopped = false;
  let started = false;
  let constructionReady = false;
  let fontsReady = false;
  let frame = 0;
  let watchdog;
  let initialSlide = null;
  let worksFinished = false;
  const activeProject = () => document.querySelector('.work-slide.active') ||
    document.querySelector('.folio-project:not([hidden])');
  const projectOf = target => target.closest('.work-slide') || target.closest('.folio-project');

  function finish(target) {
    shown.add(target);
    const animation = running.get(target);
    running.delete(target);
    animation?.cancel();
    target.removeAttribute('data-home-reveal');
  }

  function finishAll() {
    stopped = true;
    clearTimeout(watchdog);
    cancelAnimationFrame(frame);
    frame = 0;
    observers.forEach((observer) => observer.disconnect());
    targets.forEach(finish);
    root.classList.remove('homepage-text-pending');
  }

  if (motion.matches || !window.WorkTypeShuffle || !window.requestAnimationFrame) {
    finishAll();
    return;
  }

  window.HomepageTextEntrance = {
    enabled: true,
    ready() { constructionReady = true; schedule(); },
  };

  function visible(target) {
    if (innerWidth > 767 && document.querySelector('.site-footer.is-visible') &&
      !target.closest('.site-footer')) return false;
    if (document.querySelector('.nav-links.is-open') && !target.closest('.site-nav')) return false;
    if (target.closest('.work-slide:not(.active)')) return false;
    if (target.closest('.folio-project[hidden], .folio-projects[inert]')) return false;
    if (target.closest('.work-slide') && document.querySelector(
      '.works-transition-overlay.cover, .works-transition-overlay.reveal'
    )) return false;
    if (target.closest('[data-intro-media]') && root.classList.contains('homepage-entrance-active')) return false;
    if (target.closest('.site-footer') && innerWidth > 767 &&
      !target.closest('.site-footer.is-visible')) return false;
    const rect = target.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 &&
      rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth &&
      getComputedStyle(target).visibility !== 'hidden';
  }

  function scan() {
    frame = 0;
    if (stopped) return;
    // The first project can join the page entrance; switching projects is static.
    if (!worksFinished && initialSlide &&
      activeProject() !== initialSlide) {
      worksFinished = true;
      targets.filter((target) => projectOf(target) || target.matches('.folio-count')).forEach(finish);
    }
    if (!fontsReady || root.matches(
      '.intro-pending, .intro-active, .is-page-arriving, .is-page-transition-revealing'
    )) return;
    if (!constructionReady && root.matches('.homepage-entrance-pending, .homepage-entrance-active')) return;
    if (!started) {
      started = true;
      clearTimeout(watchdog);
      root.classList.remove('homepage-text-pending');
    }

    // Stop canvases before an old slide/menu/drawer can float over the new view.
    running.forEach((_animation, target) => { if (!visible(target)) finish(target); });
    const group = targets.filter((target) => !shown.has(target) && visible(target));
    const endTime = performance.now() + 800;
    group.forEach((target, index) => {
      // A late navigation enhancer clones its text; never let it clone a mask.
      if (target.matches('[data-intro-nav]') && window.AnimatedNavLink &&
        !target.hasAttribute('data-animated-nav')) {
        finish(target);
        return;
      }
      shown.add(target);
      target.dataset.homeReveal = 'active';
      try {
        const animation = window.WorkTypeShuffle.play(target, {
          delay: Math.min(index * 30, 120), endTime,
        });
        running.set(target, animation);
        animation.finished.then(() => {
          if (running.get(target) === animation) finish(target);
        }).catch(() => finish(target));
      } catch (error) { finish(target); }
    });
  }

  function schedule() {
    if (!stopped && !frame) frame = requestAnimationFrame(scan);
  }

  function watch(target, subtree = false) {
    if (!target) return;
    const observer = new MutationObserver(schedule);
    observer.observe(target, { attributes: true, attributeFilter: ['class', 'hidden', 'inert'], subtree });
    observers.push(observer);
  }
  function boot() {
    if (stopped) return;
    // Let the core script prepare the selected project and mobile menu first.
    initialSlide = activeProject();
    targets.push(...Array.from(document.querySelectorAll(selector)).filter((target) =>
      !projectOf(target) || projectOf(target) === initialSlide
    ));
    targets.forEach((target) => { target.dataset.homeReveal = 'pending'; });
    watchdog = setTimeout(finishAll, 10000);
    watch(root);
    watch(document.querySelector('.selected-works'), true);
    watch(document.querySelector('.folio-current'), true);
    watch(document.querySelector('.site-footer'));
    watch(document.querySelector('.nav-links'));

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('portfolio:intro-complete', schedule);
    window.addEventListener('portfolio:intro-skipped', schedule);
    document.addEventListener('transitionend', schedule);
    document.addEventListener('focusin', (event) => {
      const target = event.target.closest('[data-home-reveal]');
      if (target) {
        root.classList.remove('homepage-text-pending');
        finish(target);
      }
    });
    window.addEventListener('pagehide', finishAll);
    window.addEventListener('pageshow', (event) => { if (event.persisted) finishAll(); });
    motion.addEventListener('change', () => { if (motion.matches) finishAll(); });

    let fontTimer;
    Promise.race([
      document.fonts?.ready || Promise.resolve(),
      new Promise((resolve) => { fontTimer = setTimeout(resolve, 700); }),
    ]).then(() => {
      clearTimeout(fontTimer);
      fontsReady = true;
      schedule();
    }).catch(finishAll);
  }
  setTimeout(boot, 0);
})();
