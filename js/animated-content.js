/**
 * Static-site adapter for React Bits AnimatedContent (JS + CSS variant).
 * Source reference: https://reactbits.dev/r/AnimatedContent-JS-CSS.json
 *
 * Work detail configuration:
 * distance=100, direction="vertical", duration=0.8,
 * ease="power3.out", blur=0, stagger=0.08, threshold=0.1.
 */
(function () {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const containers = [];
  const triggers = [];
  let context = null;
  let resizeObserver = null;
  let initialized = false;

  root.classList.add('has-animated-work-content');

  function revealAll() {
    containers.forEach((container) => {
      Array.from(container.children).forEach((child) => {
        child.style.removeProperty('visibility');
        child.style.removeProperty('opacity');
        child.style.removeProperty('transform');
      });
    });
    root.classList.remove('has-animated-work-content');
  }

  function cleanup() {
    resizeObserver?.disconnect();
    triggers.splice(0).forEach((trigger) => trigger.kill());
    context?.revert();
    context = null;
    revealAll();
  }

  function init() {
    if (initialized) return;
    initialized = true;

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    const page = document.querySelector('.project-detail-page');

    if (!page || !gsap || !ScrollTrigger || reducedMotion.matches) {
      revealAll();
      return;
    }

    containers.push(...page.querySelectorAll('.detail-left > .hero, .detail-left > .process-section'));
    if (!containers.length) {
      revealAll();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    context = gsap.context(() => {
      containers.forEach((container) => {
        const targets = Array.from(container.children);
        if (!targets.length) return;

        gsap.set(targets, { visibility: 'visible' });
        const timeline = gsap.timeline({
          paused: true,
          onComplete: () => {
            gsap.set(targets, { clearProps: 'transform' });
            container.dataset.animatedContent = 'shown';
          },
        });

        timeline.fromTo(targets, {
          y: 100,
          scale: 1,
          opacity: 0,
        }, {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: { each: 0.08, from: 'start' },
        });

        triggers.push(ScrollTrigger.create({
          trigger: container,
          start: 'top 90%',
          once: true,
          onEnter: () => timeline.play(),
        }));
      });
    }, page);

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => ScrollTrigger.refresh());
      resizeObserver.observe(page);
    }
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }

  function boot() {
    const arrival = window.WorkTransitionArrival;
    if (arrival?.finished) {
      arrival.finished.then(init, init);
    } else {
      init();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener('pagehide', cleanup, { once: true });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) cleanup();
  });
})();
