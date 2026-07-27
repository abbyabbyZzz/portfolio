/**
 * Turns every internal Resume navigation link into a falling paper document.
 * The original resume URL remains a normal, shareable fallback.
 */
(function () {
  'use strict';

  if (window.resumeDrop) return;

  const currentIsResume = /\/resume(?:\/|$)/i.test(window.location.pathname);
  if (currentIsResume) return;

  const scriptUrl = document.currentScript && document.currentScript.src;
  if (scriptUrl && !document.querySelector('link[data-resume-drop-styles]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('../css/resume-drop.css?v=7', scriptUrl).href;
    stylesheet.dataset.resumeDropStyles = '';
    document.head.appendChild(stylesheet);
  }

  class ResumeDrop {
    constructor() {
      this.dialog = null;
      this.paper = null;
      this.frame = null;
      this.closeButton = null;
      this.trigger = null;
      this.closeTimer = null;

      this.onClick = this.onClick.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
    }

    init() {
      document.addEventListener('click', this.onClick, true);
    }

    isResumeLink(link) {
      if (!link) return false;

      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (error) {
        return false;
      }

      return (
        url.origin === window.location.origin &&
        /\/resume(?:\/|$)/i.test(url.pathname)
      );
    }

    onClick(event) {
      const link = event.target instanceof Element
        ? event.target.closest('a[href]')
        : null;

      if (
        !this.isResumeLink(link) ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      this.open(link.href, link);
    }

    build(url) {
      const resumeUrl = new URL(url, window.location.href);
      resumeUrl.searchParams.set('embed', '1');

      this.dialog = document.createElement('div');
      this.dialog.className = 'resume-drop';
      this.dialog.setAttribute('role', 'dialog');
      this.dialog.setAttribute('aria-modal', 'true');
      this.dialog.setAttribute('aria-label', 'Abigail Han resume');
      this.dialog.setAttribute('aria-hidden', 'true');
      this.dialog.setAttribute('tabindex', '-1');
      this.dialog.innerHTML = [
        '<button class="resume-drop__backdrop" type="button" aria-label="Close resume"></button>',
        '<div class="resume-drop__stage">',
          '<div class="resume-drop__paper">',
            '<div class="resume-drop__loading" aria-hidden="true">Resume / loading</div>',
            '<iframe class="resume-drop__frame" title="Abigail Han resume"></iframe>',
            '<button class="resume-drop__close" type="button" aria-label="Close resume">×</button>',
          '</div>',
        '</div>',
      ].join('');

      this.paper = this.dialog.querySelector('.resume-drop__paper');
      this.frame = this.dialog.querySelector('.resume-drop__frame');
      this.closeButton = this.dialog.querySelector('.resume-drop__close');

      this.dialog
        .querySelector('.resume-drop__backdrop')
        .addEventListener('click', () => this.close());
      this.closeButton.addEventListener('click', () => this.close());
      this.frame.addEventListener('load', () => {
        this.paper.classList.add('is-loaded');
      });
      this.frame.src = resumeUrl.href;

      document.body.appendChild(this.dialog);
    }

    open(url, trigger) {
      window.clearTimeout(this.closeTimer);
      this.trigger = trigger;

      if (!this.dialog) {
        this.build(url);
      }

      const mobileNav = document.querySelector('.nav-links.is-open');
      const mobileToggle = document.querySelector('.nav-toggle.is-open');
      if (mobileNav) mobileNav.classList.remove('is-open');
      if (mobileToggle) mobileToggle.classList.remove('is-open');

      this.dialog.classList.remove('is-closing');
      this.dialog.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('resume-drop-open');
      document.addEventListener('keydown', this.onKeyDown);

      requestAnimationFrame(() => {
        this.dialog.classList.add('is-open');
        this.dialog.focus({ preventScroll: true });
      });
    }

    close() {
      if (!this.dialog || !this.dialog.classList.contains('is-open')) return;

      this.dialog.classList.add('is-closing');
      this.dialog.classList.remove('is-open');
      document.removeEventListener('keydown', this.onKeyDown);

      this.closeTimer = window.setTimeout(() => {
        document.documentElement.classList.remove('resume-drop-open');
        this.dialog.remove();
        this.dialog = null;
        this.paper = null;
        this.frame = null;
        this.closeButton = null;
        if (this.trigger && document.contains(this.trigger)) {
          this.trigger.focus({ preventScroll: true });
        }
      }, 700);
    }

    onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
      }
    }
  }

  const resumeDrop = new ResumeDrop();
  resumeDrop.init();
  window.resumeDrop = resumeDrop;
})();
