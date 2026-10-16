/** Writings index Effect 3 entrance. Filter updates remain static. */
(function () {
  'use strict';

  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const selector = '.writing-entrance-text';
  const targets = [];
  const running = new Map();
  let rootObserver = null;
  let watchdog = null;
  let fontsReady = false;
  let started = false;
  let stopped = false;

  root.classList.add('has-writings-text-entrance', 'writings-text-entrance-pending');

  function finishTarget(target) {
    const animation = running.get(target);
    running.delete(target);
    animation?.cancel();
    target.removeAttribute('data-writings-reveal');
  }

  function finishAll(disable = false) {
    if (stopped) return;
    stopped = true;
    clearTimeout(watchdog);
    rootObserver?.disconnect();
    targets.forEach(finishTarget);
    root.classList.remove('writings-text-entrance-pending');
    if (disable) root.classList.remove('has-writings-text-entrance');
  }

  if (motion.matches || !window.WorkTypeShuffle || !window.requestAnimationFrame) {
    finishAll(true);
    return;
  }

  function show(target, delay, endTime) {
    if (stopped || target.dataset.writingsReveal !== 'pending') return;
    let animation;
    try {
      animation = window.WorkTypeShuffle.play(target, { delay, endTime });
    } catch (error) {
      finishTarget(target);
      return;
    }
    target.dataset.writingsReveal = 'active';
    running.set(target, animation);
    animation.finished.then(() => {
      if (running.get(target) === animation) finishTarget(target);
    }).catch(() => finishTarget(target));
  }

  function tryStart() {
    if (started || stopped || !fontsReady || root.matches(
      '.is-page-arriving, .is-page-transition-revealing, .intro-active'
    )) return;
    started = true;
    clearTimeout(watchdog);
    rootObserver?.disconnect();
    root.classList.remove('writings-text-entrance-pending');
    const endTime = performance.now() + 800;
    targets.forEach((target, index) => {
      show(target, Math.min(index * 30, 120), endTime);
    });
  }

  function boot() {
    if (stopped || !document.body.classList.contains('writings-page')) {
      finishAll(true);
      return;
    }
    targets.push(...document.querySelectorAll(selector));
    if (!targets.length) {
      finishAll(true);
      return;
    }
    targets.forEach((target) => { target.dataset.writingsReveal = 'pending'; });
    watchdog = setTimeout(() => finishAll(true), 5000);
    rootObserver = new MutationObserver(tryStart);
    rootObserver.observe(root, { attributes: true, attributeFilter: ['class'] });

    let fontTimer;
    Promise.race([
      document.fonts?.ready || Promise.resolve(),
      new Promise((resolve) => { fontTimer = setTimeout(resolve, 700); }),
    ]).then(() => {
      clearTimeout(fontTimer);
      fontsReady = true;
      tryStart();
    }).catch(() => finishAll(true));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else setTimeout(boot, 0);

  document.addEventListener('focusin', (event) => {
    if (!started) {
      finishAll();
      return;
    }
    const region = event.target.closest('.tag-btn, .article-row');
    region?.querySelectorAll(selector).forEach(finishTarget);
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('.tag-btn, .article-row')) finishAll();
  }, true);
  window.addEventListener('pagehide', () => finishAll());
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) finishAll();
  });
  motion.addEventListener('change', () => {
    if (motion.matches) finishAll(true);
  });
})();
