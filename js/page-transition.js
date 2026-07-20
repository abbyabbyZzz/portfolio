/**
 * Abigail Han Portfolio — editorial page transition
 *
 * This site is a static multi-page build, so the component carries a small
 * arrival flag through sessionStorage. The outgoing document covers first;
 * the incoming document recreates the covered overlay and reveals underneath.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'abigail-page-transition';
  const ROW_COUNT = 6;
  const STAGGER_MS = 80;
  const ROW_DURATION_MS = 760;
  const SAFETY_BUFFER_MS = 80;
  const COVER_HOLD_MS = 280;
  const COVER_ANIMATION_MS =
    ROW_DURATION_MS + (ROW_COUNT - 1) * STAGGER_MS;
  const REVEAL_END_MS = COVER_ANIMATION_MS + SAFETY_BUFFER_MS;
  const NAVIGATION_START_MS = COVER_ANIMATION_MS + COVER_HOLD_MS;

  const SYSTEM_LINES = [
    'ABIGAIL HAN — CREATIVE TECHNOLOGIST',
    'INDEXING DIGITAL EXPERIENCES',
    'ASSEMBLING VISUAL SYSTEMS',
    'PROCESSING INTERACTION DESIGN',
    'GENERATING CREATIVE WORLDS',
  ];

  function storageGet() {
    try {
      const value = window.sessionStorage.getItem(STORAGE_KEY);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  function storageSet(value) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      // Navigation still works if storage is unavailable.
    }
  }

  function storageRemove() {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Nothing else is required.
    }
  }

  const storedArrivalState = storageGet();
  const currentPath = `${window.location.pathname}${window.location.search}`;
  const arrivingState =
    storedArrivalState &&
    storedArrivalState.destinationPath === currentPath &&
    Date.now() - storedArrivalState.createdAt < 30000
      ? storedArrivalState
      : null;

  if (storedArrivalState && !arrivingState) {
    storageRemove();
  }

  if (arrivingState) {
    document.documentElement.classList.add('is-page-arriving');
  }

  class PageTransition {
    constructor(options = {}) {
      this.rowCount = options.rowCount || ROW_COUNT;
      this.isTransitioning = false;
      this.overlay = null;
      this.originalOverflow = '';
      this.reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      );

      this.onDocumentClick = this.onDocumentClick.bind(this);
      this.onPageShow = this.onPageShow.bind(this);
    }

    init() {
      document.addEventListener('click', this.onDocumentClick, true);
      window.addEventListener('pageshow', this.onPageShow);

      if (arrivingState) {
        this.revealArrival(arrivingState);
      }
    }

    isEligibleLink(link, event) {
      if (!link || this.isTransitioning) return false;
      if (event.defaultPrevented || event.button !== 0) return false;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return false;
      }
      if (link.hasAttribute('download')) return false;
      if (link.target && link.target.toLowerCase() !== '_self') return false;
      if (link.dataset.noTransition !== undefined) return false;

      const rawHref = link.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#')) return false;
      if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) return false;

      let destination;
      try {
        destination = new URL(link.href, window.location.href);
      } catch (error) {
        return false;
      }

      if (destination.origin !== window.location.origin) return false;
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      ) {
        return false;
      }

      return true;
    }

    onDocumentClick(event) {
      const link =
        event.target instanceof Element
          ? event.target.closest('a[href]')
          : null;
      if (!this.isEligibleLink(link, event)) {
        if (this.isTransitioning && link) event.preventDefault();
        return;
      }

      event.preventDefault();
      this.navigate(link.href, this.getDestinationLabel(link));
    }

    navigate(url, destinationLabel) {
      if (this.isTransitioning) return;

      if (this.reducedMotion.matches) {
        storageRemove();
        window.location.assign(url);
        return;
      }

      this.isTransitioning = true;
      this.lockPage();
      document.documentElement.classList.add('is-page-transitioning');
      document.body.setAttribute('aria-busy', 'true');

      this.overlay = this.createOverlay(destinationLabel);
      document.body.appendChild(this.overlay);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.overlay.classList.add('is-covering');
        });
      });

      window.setTimeout(() => {
        const destination = new URL(url, window.location.href);
        storageSet({
          destinationLabel,
          destinationPath: `${destination.pathname}${destination.search}`,
          createdAt: Date.now(),
        });
        window.location.assign(url);
      }, NAVIGATION_START_MS);
    }

    revealArrival(state) {
      this.isTransitioning = true;
      this.lockPage();

      document.body.setAttribute('aria-busy', 'true');
      this.overlay = this.createOverlay(
        state.destinationLabel || this.labelFromPath(window.location.pathname),
        true
      );
      document.body.appendChild(this.overlay);
      document.documentElement.classList.add('is-page-transition-revealing');
      document.documentElement.classList.remove('is-page-arriving');
      storageRemove();

      const startReveal = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.overlay.classList.add('is-revealing');
          });
        });

        window.setTimeout(() => {
          this.finish();
        }, REVEAL_END_MS);
      };

      if (this.reducedMotion.matches) {
        document.documentElement.classList.remove('is-page-arriving');
        storageRemove();
        this.finish();
        return;
      }

      const waitForContent = new Promise((resolve) => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
        } else {
          resolve();
        }
      });

      waitForContent.then(() => {
        const fontsReady = document.fonts
          ? document.fonts.ready
          : Promise.resolve();

        return Promise.race([
          fontsReady,
          new Promise((resolve) => window.setTimeout(resolve, 220)),
        ]);
      }).then(startReveal);
    }

    createOverlay(destinationLabel, covered = false) {
      const overlay = document.createElement('div');
      overlay.className = `page-transition${covered ? ' is-covered' : ''}`;
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.setProperty('--transition-row-count', this.rowCount);

      const finalLine = `OPENING ${destinationLabel || 'DIGITAL ARCHIVE'}`;
      const lines = [...SYSTEM_LINES, finalLine].slice(0, this.rowCount);

      lines.forEach((line, index) => {
        const slot = document.createElement('div');
        slot.className = 'page-transition__slot';
        slot.style.setProperty('--row-index', index);
        slot.style.setProperty('--cover-delay', `${(this.rowCount - 1 - index) * STAGGER_MS}ms`);
        slot.style.setProperty('--reveal-delay', `${index * STAGGER_MS}ms`);

        const panel = document.createElement('div');
        panel.className = 'page-transition__panel';

        const text = document.createElement('span');
        text.className = 'page-transition__text';
        text.textContent = line;

        const meta = document.createElement('span');
        meta.className = 'page-transition__meta';

        const indexLabel = document.createElement('span');
        indexLabel.textContent = `[${String(index + 1).padStart(2, '0')}/${String(this.rowCount).padStart(2, '0')}]`;

        const percentage = document.createElement('span');
        percentage.textContent = `${String(Math.round(((index + 1) / this.rowCount) * 100)).padStart(3, '0')}%`;

        meta.append(indexLabel, percentage);
        panel.append(text, meta);
        slot.appendChild(panel);
        overlay.appendChild(slot);
      });

      return overlay;
    }

    getDestinationLabel(link) {
      const url = new URL(link.href, window.location.href);
      const pathnameLabel = this.labelFromPath(url.pathname);
      const linkLabel = link.textContent
        .replace(/[←→↗]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (/^(view detail|view more works|view all works)$/i.test(linkLabel)) {
        return pathnameLabel;
      }

      return (linkLabel || pathnameLabel).toUpperCase();
    }

    labelFromPath(pathname) {
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

    lockPage() {
      this.originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    finish() {
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }

      document.documentElement.classList.add('has-page-transitioned');
      document.documentElement.classList.remove(
        'is-page-transitioning',
        'is-page-transition-revealing',
        'is-page-arriving'
      );
      document.documentElement.style.removeProperty('background');
      document.body.removeAttribute('aria-busy');
      document.body.style.overflow = this.originalOverflow;
      this.isTransitioning = false;
    }

    onPageShow(event) {
      if (event.persisted) {
        storageRemove();
        this.finish();
      }
    }
  }

  function boot() {
    const transition = new PageTransition();
    transition.init();
    window.pageTransition = transition;

    if (!arrivingState) {
      requestAnimationFrame(() => {
        document.documentElement.style.removeProperty('background');
      });
    }
  }

  if (document.body) {
    boot();
  } else {
    const bodyObserver = new MutationObserver(() => {
      if (!document.body) return;
      bodyObserver.disconnect();
      boot();
    });

    bodyObserver.observe(document.documentElement, { childList: true });
  }

  window.PageTransition = PageTransition;
})();
