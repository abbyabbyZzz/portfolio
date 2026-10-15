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
  let activeTimeline = null;
  let animatedTargets = [];
  let safetyTimer;

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
    ['.site-nav', '.bento-container', '.selected-works', '.site-footer', '.folio-layout'].forEach((selector) => {
      const element = document.querySelector(selector);
      if (!element) return;
      if (isLocked) {
        element.setAttribute('inert', '');
        // Inert already locks accessibility; the renderer must measure real text.
        if (!window.HomepageTextEntrance?.enabled) element.setAttribute('aria-hidden', 'true');
      } else {
        element.removeAttribute('inert');
        element.removeAttribute('aria-hidden');
      }
    });
    document.body.toggleAttribute('aria-busy', isLocked);
  }

  function revealWithoutAnimation() {
    clearTimeout(safetyTimer);
    activeTimeline?.kill();
    activeTimeline = null;
    if (animatedTargets.length) {
      window.gsap?.set(animatedTargets, { clearProps: 'clipPath,opacity,transform,visibility' });
      animatedTargets = [];
    }
    root.classList.remove('homepage-entrance-pending', 'homepage-entrance-active');
    setInteractionLocked(false);
    window.HomepageTextEntrance?.ready();
  }

  function playEntrance() {
    if (hasStarted) return;
    if (storageHasPlayed()) {
      revealWithoutAnimation();
      return;
    }
    if (document.querySelector('.portfolio-intro') || root.classList.contains('is-page-arriving')) return;
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
    const shuffleText = window.HomepageTextEntrance?.enabled === true;
    const moduleMedia = shuffleText ? gsap.utils.toArray('.selected-works .slide-visual, .folio-stage') : [];
    const controls = gsap.utils.toArray('.folio-browse, .folio-stage-bottom, .site-nav .nav-toggle');
    animatedTargets = [...new Set([...navItems, ...headings, ...copy, ...media, ...modules, ...moduleMedia, ...controls])];

    root.classList.remove('homepage-entrance-pending');
    root.classList.add('homepage-entrance-active');
    setInteractionLocked(true);

    gsap.set(animatedTargets, { visibility: 'visible' });

    function complete() {
      window.removeEventListener('resize', complete);
      window.removeEventListener('pagehide', complete);
      rememberPlayed();
      revealWithoutAnimation();
    }

    if (reducedMotion) {
      complete();
      return;
    }

    const timeline = activeTimeline = gsap.timeline({ defaults: { overwrite: 'auto' }, onComplete: complete });
    safetyTimer = setTimeout(complete, 4000);
    window.addEventListener('resize', complete, { once: true });
    window.addEventListener('pagehide', complete, { once: true });

    if (!shuffleText) {
      gsap.set(navItems, { opacity: 0, y: -8, force3D: true });
      gsap.set([...headings, ...copy], { opacity: 0, y: 12, force3D: true });
      gsap.set(modules, {
        opacity: 0,
        x: 24,
        clipPath: 'inset(0 0 0 100%)',
        force3D: true,
      });
    } else {
      gsap.set(moduleMedia, { opacity: 0, x: 24, clipPath: 'inset(0 0 0 100%)', force3D: true });
    }
    gsap.set(media, { opacity: 0, y: 12, force3D: true });
    gsap.set(controls, { opacity: 0 });

    if (shuffleText) {
      timeline.call(() => window.HomepageTextEntrance.ready(), [], 0.12)
        .to({}, { duration: 0.8 }, 0.12);
    } else {
      timeline.to(navItems, {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.035,
        ease: 'power3.out',
      }, 0.12)
      .to(copy, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.04,
        ease: 'power3.out',
      }, 0.16)
      .to(headings, {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: 'power3.out',
      }, 0.16);
    }
    timeline.to(media, {
        opacity: 1,
        y: 0,
        duration: 0.76,
        ease: 'power3.out',
      }, 0.16)
      .to(shuffleText ? moduleMedia : modules, {
        opacity: 1,
        x: 0,
        clipPath: 'inset(0 0 0 0%)',
        duration: 0.8,
        ease: 'power3.inOut',
      }, 0.12)
      .to(controls, { opacity: 1, duration: 0.28, ease: 'power2.out' }, 0.64);
  }

  if (storageHasPlayed()) {
    revealWithoutAnimation();
    return;
  }

  window.addEventListener('portfolio:intro-complete', playEntrance, { once: true });
  window.addEventListener('portfolio:intro-skipped', playEntrance, { once: true });
  // Decorative image downloads must not hold the entire page blank.
  function queueEntrance() {
    let fontTimer;
    Promise.race([
      document.fonts?.ready || Promise.resolve(),
      new Promise((resolve) => { fontTimer = setTimeout(resolve, 700); }),
    ]).then(() => {
      clearTimeout(fontTimer);
      requestAnimationFrame(playEntrance);
    }).catch(() => requestAnimationFrame(playEntrance));
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', queueEntrance, { once: true });
  } else queueEntrance();
})();
