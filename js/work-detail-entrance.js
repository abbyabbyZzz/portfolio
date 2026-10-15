/** Work information entrance, sharing the repeating cover's finish time. */
(function () {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const workArrival = window.WorkTransitionArrival;
  const selector = [
    '.detail-panel > :first-child', '.detail-title', '.detail-subtitle',
    '.detail-meta-row', '.detail-toggle', '.detail-body > p',
    '.detail-body > ul', '.detail-body > ol',
  ].join(',');
  const targets = [];
  const running = new Map();
  let viewportObserver = null;
  let coverObserver = null;
  let watchdog = null;
  let started = false;
  let stopped = false;
  let fontsReady = false;

  function finishAll() {
    stopped = true;
    clearTimeout(watchdog);
    coverObserver?.disconnect();
    viewportObserver?.disconnect();
    running.forEach((animation) => animation.cancel());
    running.clear();
    targets.forEach((target) => target.removeAttribute('data-work-reveal'));
    root.classList.remove('work-detail-entrance-pending');
  }

  root.classList.add('has-work-detail-entrance');
  if (reducedMotion.matches || !window.WorkTypeShuffle || !window.requestAnimationFrame) return;

  root.classList.add('work-detail-entrance-pending');
  // Content remains readable if initialization or an existing loader fails.
  watchdog = setTimeout(finishAll, 5000);
  // Cancellation, navigation and the cover's normal finish use one cleanup path.
  workArrival?.finished.then(finishAll);

  function show(target, delay, endTime) {
    if (stopped || target.dataset.workReveal !== 'pending') return;
    viewportObserver?.unobserve(target);
    let animation;
    try {
      animation = window.WorkTypeShuffle.play(target, { delay, endTime, holdAtEnd: Boolean(endTime) });
    } catch (error) {
      target.removeAttribute('data-work-reveal');
      return;
    }
    target.dataset.workReveal = 'active';
    running.set(target, animation);
    animation.finished.then(() => {
      if (running.get(target) !== animation) return;
      target.dataset.workReveal = 'shown';
      running.delete(target);
      animation.cancel();
    }).catch(() => {});
  }

  function showGroup(group, endTime) {
    const maxDelay = endTime ? Math.max(0, Math.min(120, endTime - performance.now() - 60)) : 120;
    group.forEach((target, index) => show(target, Math.min(index * 30, maxDelay), endTime));
  }

  function tryStart() {
    if (started || stopped || !fontsReady || root.matches(
      '.is-page-arriving, .is-page-transition-revealing, .intro-active'
    )) return;
    if (root.matches('.is-work-arriving') && !workArrival?.endTime) return;
    started = true;
    clearTimeout(watchdog);
    coverObserver?.disconnect();
    root.classList.remove('work-detail-entrance-pending');

    const visible = targets.filter((target) => {
      if (target.closest('.detail-collapsable:not(.is-open)')) return false;
      const rect = target.getBoundingClientRect();
      return rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight - 24;
    });
    showGroup(visible, workArrival?.endTime);

    const pending = targets.filter((target) => target.dataset.workReveal === 'pending');
    if (!('IntersectionObserver' in window)) {
      pending.forEach((target) => target.removeAttribute('data-work-reveal'));
      return;
    }
    viewportObserver = new IntersectionObserver((entries) => {
      showGroup(entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target));
    }, { threshold: 0.05, rootMargin: '0px 0px -24px 0px' });
    pending.forEach((target) => viewportObserver.observe(target));
  }

  function init() {
    if (stopped) return;
    const page = document.querySelector('.project-detail-page');
    if (!page) { finishAll(); return; }
    const candidates = Array.from(page.querySelectorAll(selector))
      .filter((target) => target.closest('.detail-panel') &&
        target.textContent.trim() && !target.querySelector('img, video, iframe'));
    const candidateSet = new Set(candidates);
    const text = candidates.filter((target) => {
      // Lists and captions can contain paragraphs; animate each text block once.
      for (let parent = target.parentElement; parent !== page; parent = parent.parentElement) {
        if (candidateSet.has(parent)) return false;
      }
      return true;
    });
    targets.push(...text);
    targets.forEach((target) => { target.dataset.workReveal = 'pending'; });
    coverObserver = new MutationObserver(tryStart);
    coverObserver.observe(root, { attributes: true, attributeFilter: ['class'] });
    let fontTimer;
    Promise.race([
      document.fonts?.ready || Promise.resolve(),
      new Promise((resolve) => { fontTimer = setTimeout(resolve, 700); }),
    ]).then(() => {
      clearTimeout(fontTimer);
      fontsReady = true;
      tryStart();
    }).catch(finishAll);
  }

  function boot() {
    // Let the shared script finish inserting the mobile Work Info / footer first.
    setTimeout(() => {
      try { init(); } catch (error) { finishAll(); }
    }, 0);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else boot();

  function finishTarget(target) {
    const animation = running.get(target);
    running.delete(target);
    animation?.cancel();
    viewportObserver?.unobserve(target);
    target.dataset.workReveal = 'shown';
  }

  document.addEventListener('focusin', (event) => {
    const target = event.target.closest('[data-work-reveal]');
    if (target) finishTarget(target);
  });
  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('.detail-toggle');
    if (toggle?.getAttribute('aria-expanded') === 'false') {
      // The visual canvases sit outside the clipped mobile information panel.
      targets.filter((target) => target.closest('.detail-collapsable')).forEach(finishTarget);
    }
  });
  window.addEventListener('pagehide', finishAll);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) finishAll();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) finishAll();
  });
})();
