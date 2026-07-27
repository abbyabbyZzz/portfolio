/**
 * Abigail Han Portfolio — shared loading-screen page transition.
 *
 * Outgoing pages load to 100%, then the destination recreates the same
 * covered screen and dissolves it into the new document.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'abigail-page-transition';
  const TRANSITION_DURATION = 1050;
  const COVER_HOLD = 140;
  const ARRIVAL_DISSOLVE_DURATION = 900;
  const scriptUrl = document.currentScript
    ? document.currentScript.src
    : new URL('js/page-transition.js', window.location.href).href;
  const loaderUrl = new URL('portfolio-intro-loader.js?v=18', scriptUrl).href;
  const resumeDropUrl = new URL('resume-drop.js?v=7', scriptUrl).href;
  const root = document.documentElement;
  let loaderPromise = null;

  function storageGet() {
    try {
      const value = sessionStorage.getItem(STORAGE_KEY);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  function storageSet(value) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value)); }
    catch (error) { /* Navigation still works without storage. */ }
  }

  function storageRemove() {
    try { sessionStorage.removeItem(STORAGE_KEY); }
    catch (error) { /* Nothing else is required. */ }
  }

  const storedArrivalState = storageGet();
  const currentPath = `${window.location.pathname}${window.location.search}`;
  const arrivingState =
    storedArrivalState &&
    storedArrivalState.destinationPath === currentPath &&
    Date.now() - storedArrivalState.createdAt < 30000
      ? storedArrivalState
      : null;

  if (storedArrivalState && !arrivingState) storageRemove();
  if (arrivingState) root.classList.add('is-page-arriving');

  function loadLoader() {
    if (window.PortfolioIntroLoader) {
      return Promise.resolve(window.PortfolioIntroLoader);
    }
    if (loaderPromise) return loaderPromise;

    loaderPromise = new Promise((resolve, reject) => {
      let script = document.querySelector('script[src*="portfolio-intro-loader.js"]');
      if (!script) {
        script = document.createElement('script');
        script.src = loaderUrl;
        script.dataset.portfolioLoader = '';
        document.head.appendChild(script);
      }

      function ready() {
        if (window.PortfolioIntroLoader) resolve(window.PortfolioIntroLoader);
        else reject(new Error('Portfolio loader did not initialize.'));
      }

      if (window.PortfolioIntroLoader) ready();
      else {
        script.addEventListener('load', ready, { once: true });
        script.addEventListener('error', reject, { once: true });
      }
    });

    return loaderPromise;
  }

  function labelFromPath(pathname) {
    const cleanParts = pathname
      .split('/')
      .filter(Boolean)
      .filter((part) => !/^index\.html?$/i.test(part));

    if (cleanParts.length === 0) return 'HOMEPAGE';

    return cleanParts[cleanParts.length - 1]
      .replace(/\.html?$/i, '')
      .replace(/[-_]+/g, ' ')
      .toUpperCase();
  }

  function destinationLabel(link) {
    const url = new URL(link.href, window.location.href);
    const pathnameLabel = labelFromPath(url.pathname);
    if (link.closest('.site-nav')) return pathnameLabel;

    const originalNavText = link.querySelector('.nav-text--original');
    let linkLabel = (
      link.dataset.transitionLabel ||
      (originalNavText ? originalNavText.textContent : '') ||
      link.textContent
    )
      .replace(/[←→↗]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (
      linkLabel.length % 2 === 0 &&
      linkLabel.slice(0, linkLabel.length / 2).toLowerCase() ===
        linkLabel.slice(linkLabel.length / 2).toLowerCase()
    ) {
      linkLabel = linkLabel.slice(0, linkLabel.length / 2);
    }

    if (/^(view detail|view more works|view all works)$/i.test(linkLabel)) {
      return pathnameLabel;
    }

    return (linkLabel || pathnameLabel).toUpperCase();
  }

  function cleanStaleLoader() {
    const loader = document.querySelector('.portfolio-intro');
    if (loader) loader.remove();

    Array.from(document.body.children).forEach((element) => {
      if (!element.classList.contains('intro-home-content')) return;
      element.classList.remove('intro-home-content');
      element.removeAttribute('inert');
      element.removeAttribute('aria-hidden');
    });

    document.body.style.removeProperty('overflow');
    document.body.removeAttribute('aria-busy');
    root.classList.remove(
      'intro-active',
      'intro-revealing',
      'is-page-transitioning',
      'is-page-transition-revealing',
      'is-page-arriving'
    );
  }

  class PageTransition {
    constructor() {
      this.isTransitioning = false;
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.onDocumentClick = this.onDocumentClick.bind(this);
      this.onPageShow = this.onPageShow.bind(this);
    }

    init() {
      document.addEventListener('click', this.onDocumentClick, true);
      window.addEventListener('pageshow', this.onPageShow);

      if (arrivingState) this.revealArrival(arrivingState);
      else if (window.PORTFOLIO_ALWAYS_SHOW_INTRO === undefined) {
        loadLoader().catch(() => {});
      }
    }

    isEligibleLink(link, event) {
      if (!link || this.isTransitioning) return false;
      if (event.defaultPrevented || event.button !== 0) return false;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
      if (link.hasAttribute('download')) return false;
      if (link.target && link.target.toLowerCase() !== '_self') return false;
      if (link.dataset.noTransition !== undefined) return false;

      const rawHref = link.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#')) return false;
      if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) return false;

      let destination;
      try { destination = new URL(link.href, window.location.href); }
      catch (error) { return false; }

      if (destination.origin !== window.location.origin) return false;
      const destinationIsResume = /\/resume(?:\/|$)/i.test(destination.pathname);
      if (destinationIsResume) return false;
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      ) return false;

      return true;
    }

    onDocumentClick(event) {
      const link = event.target instanceof Element
        ? event.target.closest('a[href]')
        : null;

      if (!this.isEligibleLink(link, event)) {
        if (this.isTransitioning && link) event.preventDefault();
        return;
      }

      event.preventDefault();
      if (link.dataset.historyBack !== undefined) {
        this.navigateBack(link.href);
        return;
      }

      this.navigate(link.href, destinationLabel(link));
    }

    navigateBack(fallbackUrl) {
      let destination = new URL(fallbackUrl, window.location.href);
      let useBrowserHistory = false;

      try {
        const referrer = new URL(document.referrer);
        const isPreviousInternalPage =
          referrer.origin === window.location.origin &&
          `${referrer.pathname}${referrer.search}` !== currentPath;
        if (isPreviousInternalPage) {
          destination = referrer;
          useBrowserHistory = window.history.length > 1;
        }
      } catch (error) {
        // Direct visits use the link's explicit fallback.
      }

      this.navigate(destination.href, labelFromPath(destination.pathname), {
        historyBack: useBrowserHistory,
      });
    }

    navigate(url, label, options = {}) {
      if (this.isTransitioning) return;

      if (this.reducedMotion.matches) {
        storageRemove();
        if (options.historyBack) window.history.back();
        else window.location.assign(url);
        return;
      }

      this.isTransitioning = true;
      root.classList.add('is-page-transitioning');

      loadLoader().then((loader) => {
        loader.play({
          label: 'PAGE',
          duration: TRANSITION_DURATION,
          hold: COVER_HOLD,
          coverOnly: true,
          rememberSession: false,
          onCovered: () => {
            const destination = new URL(url, window.location.href);
            storageSet({
              destinationLabel: 'PAGE',
              destinationPath: `${destination.pathname}${destination.search}`,
              historyBack: Boolean(options.historyBack),
              createdAt: Date.now(),
            });

            if (options.historyBack) window.history.back();
            else window.location.assign(url);
          },
        });
      }).catch(() => {
        this.isTransitioning = false;
        root.classList.remove('is-page-transitioning');
        if (options.historyBack) window.history.back();
        else window.location.assign(url);
      });
    }

    revealArrival(state) {
      this.isTransitioning = true;
      root.classList.add('is-page-transition-revealing');

      loadLoader().then((loader) => {
        loader.play({
          label: 'PAGE',
          revealOnly: true,
          hold: 80,
          exitDuration: ARRIVAL_DISSOLVE_DURATION,
          rememberSession: false,
          onComplete: () => this.finish(),
        });
        root.classList.remove('is-page-arriving');
        storageRemove();
      }).catch(() => {
        storageRemove();
        this.finish();
      });
    }

    finish() {
      cleanStaleLoader();
      root.classList.add('has-page-transitioned');
      this.isTransitioning = false;
    }

    onPageShow(event) {
      if (!event.persisted) return;
      storageRemove();
      cleanStaleLoader();
      this.isTransitioning = false;
    }
  }

  function boot() {
    if (!document.querySelector('script[data-resume-drop]')) {
      const resumeDropScript = document.createElement('script');
      resumeDropScript.src = resumeDropUrl;
      resumeDropScript.dataset.resumeDrop = '';
      document.head.appendChild(resumeDropScript);
    }

    const transition = new PageTransition();
    transition.init();
    window.pageTransition = transition;
  }

  if (document.body) boot();
  else {
    const bodyObserver = new MutationObserver(() => {
      if (!document.body) return;
      bodyObserver.disconnect();
      boot();
    });
    bodyObserver.observe(document.documentElement, { childList: true });
  }

  window.PageTransition = PageTransition;
})();
