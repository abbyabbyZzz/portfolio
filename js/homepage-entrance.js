/**
 * First-visit homepage construction sequence.
 * Set window.ALWAYS_PLAY_HOMEPAGE_INTRO = true in index.html while testing.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'homepageEntrancePlayed';
  const ALWAYS_PLAY = window.ALWAYS_PLAY_HOMEPAGE_INTRO === true;
  const root = document.documentElement;
  let hasStarted = false;

  function storageHasPlayed() {
    if (ALWAYS_PLAY) return false;
    try { return sessionStorage.getItem(STORAGE_KEY) === 'true'; }
    catch (error) { return false; }
  }

  function rememberPlayed() {
    try { sessionStorage.setItem(STORAGE_KEY, 'true'); }
    catch (error) { /* The animation can finish without session storage. */ }
  }

  function setInteractionLocked(isLocked) {
    ['.site-nav', '.bento-container', '.selected-works', '.site-footer'].forEach((selector) => {
      const element = document.querySelector(selector);
      if (!element) return;
      if (isLocked) {
        element.setAttribute('inert', '');
        element.setAttribute('aria-hidden', 'true');
      } else {
        element.removeAttribute('inert');
        element.removeAttribute('aria-hidden');
      }
    });
    document.body.toggleAttribute('aria-busy', isLocked);
  }

  function createLineLayer() {
    const layer = document.createElement('div');
    layer.className = 'homepage-entrance-lines';
    layer.setAttribute('aria-hidden', 'true');

    document.querySelectorAll('[data-intro-line]').forEach((target) => {
      const rect = target.getBoundingClientRect();
      const edges = target.dataset.introLine.split(/\s+/);

      if (edges.includes('bottom')) {
        const line = document.createElement('span');
        line.className = 'homepage-entrance-line homepage-entrance-line--horizontal';
        Object.assign(line.style, {
          left: `${Math.max(0, rect.left)}px`,
          top: `${Math.round(rect.bottom - 1)}px`,
          width: `${Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left)}px`,
        });
        layer.appendChild(line);
      }

      if (edges.includes('right') && rect.right < window.innerWidth) {
        const line = document.createElement('span');
        line.className = 'homepage-entrance-line homepage-entrance-line--vertical';
        Object.assign(line.style, {
          left: `${Math.round(rect.right - 1)}px`,
          top: `${Math.max(0, rect.top)}px`,
          height: `${Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top)}px`,
        });
        layer.appendChild(line);
      }
    });

    document.body.appendChild(layer);
    return layer;
  }

  function revealWithoutAnimation() {
    root.classList.remove('homepage-entrance-pending', 'homepage-entrance-active');
    setInteractionLocked(false);
  }

  function playEntrance() {
    if (hasStarted || storageHasPlayed()) {
      revealWithoutAnimation();
      return;
    }
    if (document.querySelector('.portfolio-intro')) return;
    hasStarted = true;

    const gsap = window.gsap;
    if (!gsap) {
      rememberPlayed();
      revealWithoutAnimation();
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const navItems = gsap.utils.toArray('[data-intro-nav]');
    const headings = gsap.utils.toArray('[data-intro-heading]');
    const copy = gsap.utils.toArray('[data-intro-copy]');
    const media = gsap.utils.toArray('[data-intro-media]');
    const modules = gsap.utils.toArray('[data-intro-module]');

    root.classList.remove('homepage-entrance-pending');
    root.classList.add('homepage-entrance-active');
    setInteractionLocked(true);

    gsap.set([...navItems, ...headings, ...copy, ...media, ...modules], { visibility: 'visible' });

    function complete() {
      const lineLayer = document.querySelector('.homepage-entrance-lines');
      if (lineLayer) lineLayer.remove();
      gsap.set([...navItems, ...headings, ...copy, ...media, ...modules], { clearProps: 'all' });
      root.classList.remove('homepage-entrance-active');
      setInteractionLocked(false);
      rememberPlayed();
    }

    if (reducedMotion) {
      gsap.fromTo(
        [...navItems, ...headings, ...copy, ...media, ...modules],
        { opacity: 0 },
        { opacity: 1, duration: 0.28, ease: 'none', stagger: 0, onComplete: complete }
      );
      return;
    }

    const lineLayer = createLineLayer();
    const horizontalLines = lineLayer.querySelectorAll('.homepage-entrance-line--horizontal');
    const verticalLines = lineLayer.querySelectorAll('.homepage-entrance-line--vertical');
    const timeline = gsap.timeline({ defaults: { overwrite: 'auto' }, onComplete: complete });

    gsap.set(navItems, { opacity: 0, y: -12, force3D: true });
    gsap.set([...headings, ...copy], { opacity: 0, y: 24, force3D: true });
    gsap.set(media, { opacity: 0, y: 12, force3D: true });
    gsap.set(modules, { opacity: 0, y: 18, force3D: true });

    timeline
      .to({}, { duration: 0.15 })
      .to(horizontalLines, {
        scaleX: 1,
        duration: 0.62,
        stagger: 0.08,
        ease: 'power2.inOut',
      }, 0.15)
      .to(verticalLines, {
        scaleY: 1,
        duration: 0.58,
        stagger: 0.08,
        ease: 'power2.inOut',
      }, 0.4)
      .to(navItems, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.055,
        ease: 'power3.out',
      }, 0.78)
      .to(copy, {
        opacity: 1,
        y: 0,
        duration: 0.68,
        stagger: 0.09,
        ease: 'power3.out',
      }, 0.98)
      .to(headings, {
        opacity: 1,
        y: 0,
        duration: 0.78,
        ease: 'power3.out',
      }, 1.06)
      .to(media, {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: 'power3.out',
      }, 1.28)
      .to(modules, {
        opacity: 1,
        y: 0,
        duration: 0.72,
        stagger: 0.12,
        ease: 'power3.out',
      }, 1.45);
  }

  if (storageHasPlayed()) {
    revealWithoutAnimation();
    return;
  }

  window.addEventListener('portfolio:intro-complete', playEntrance, { once: true });
  window.addEventListener('portfolio:intro-skipped', playEntrance, { once: true });
  window.addEventListener('load', () => {
    if (!document.querySelector('.portfolio-intro')) playEntrance();
  }, { once: true });
})();
