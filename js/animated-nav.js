/**
 * Abigail Han Portfolio — GSAP animated navigation links
 *
 * Every link inside .site-nav is enhanced automatically. New links added
 * later are picked up by the MutationObserver without any extra setup.
 */
(function () {
  'use strict';

  const GSAP_URL =
    'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
  const LINK_SELECTOR = '.site-nav a:not([data-animated-nav])';
  const MOTION_QUERY =
    '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

  function loadGsap() {
    if (window.gsap) return Promise.resolve(window.gsap);

    return new Promise((resolve, reject) => {
      let script = document.querySelector('script[data-gsap-core]');

      const onLoad = () => {
        if (window.gsap) resolve(window.gsap);
        else reject(new Error('GSAP loaded without exposing window.gsap.'));
      };

      if (script) {
        script.addEventListener('load', onLoad, { once: true });
        script.addEventListener('error', reject, { once: true });
        return;
      }

      script = document.createElement('script');
      script.src = GSAP_URL;
      script.async = true;
      script.dataset.gsapCore = '';
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });
  }

  class AnimatedNavLink {
    constructor(link, gsapInstance, motionMedia) {
      this.link = link;
      this.gsap = gsapInstance;
      this.motionMedia = motionMedia;
      this.original = null;
      this.duplicate = null;
      this.isHovered = false;
      this.isFocused = false;

      this.onPointerEnter = this.onPointerEnter.bind(this);
      this.onPointerLeave = this.onPointerLeave.bind(this);
      this.onFocus = this.onFocus.bind(this);
      this.onBlur = this.onBlur.bind(this);
    }

    mount() {
      if (this.link.dataset.animatedNav !== undefined) return;
      if (!this.link.textContent.trim()) return;

      this.link.dataset.transitionLabel = this.link.textContent.trim();
      this.link.dataset.animatedNav = '';

      const wrapper = document.createElement('span');
      wrapper.className = 'nav-text-wrapper';

      this.original = document.createElement('span');
      this.original.className = 'nav-text nav-text--original';

      while (this.link.firstChild) {
        this.original.appendChild(this.link.firstChild);
      }

      this.duplicate = this.original.cloneNode(true);
      this.duplicate.className = 'nav-text nav-text--duplicate';
      this.duplicate.setAttribute('aria-hidden', 'true');

      wrapper.append(this.original, this.duplicate);
      this.link.appendChild(wrapper);

      this.gsap.set(this.original, {
        yPercent: 0,
        force3D: true,
      });
      this.gsap.set(this.duplicate, {
        yPercent: 100,
        force3D: true,
      });

      this.link.addEventListener('pointerenter', this.onPointerEnter);
      this.link.addEventListener('pointerleave', this.onPointerLeave);
      this.link.addEventListener('focus', this.onFocus);
      this.link.addEventListener('blur', this.onBlur);
    }

    canAnimate() {
      return this.motionMedia.matches;
    }

    update() {
      if (!this.canAnimate()) return;

      const isActive = this.isHovered || this.isFocused;
      const shared = {
        duration: 0.52,
        ease: 'power3.out',
        overwrite: 'auto',
        force3D: true,
      };

      this.gsap.to(this.original, {
        ...shared,
        yPercent: isActive ? -100 : 0,
      });
      this.gsap.to(this.duplicate, {
        ...shared,
        yPercent: isActive ? 0 : 100,
      });
    }

    reset() {
      this.isHovered = false;
      this.isFocused = false;
      this.gsap.killTweensOf([this.original, this.duplicate]);
      this.gsap.set(this.original, { yPercent: 0 });
      this.gsap.set(this.duplicate, { yPercent: 100 });
    }

    onPointerEnter() {
      this.isHovered = true;
      this.update();
    }

    onPointerLeave() {
      this.isHovered = false;
      this.update();
    }

    onFocus() {
      this.isFocused = true;
      this.update();
    }

    onBlur() {
      this.isFocused = false;
      this.update();
    }
  }

  class AnimatedNavigation {
    constructor(gsapInstance) {
      this.gsap = gsapInstance;
      this.motionMedia = window.matchMedia(MOTION_QUERY);
      this.links = new WeakMap();
      this.observer = null;

      this.onMotionChange = this.onMotionChange.bind(this);
    }

    init() {
      this.enhanceLinks(document);

      this.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.enhanceLinks(node);
            }
          });
        });
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      this.motionMedia.addEventListener('change', this.onMotionChange);
    }

    enhanceLinks(root) {
      const candidates = [];

      if (root.matches && root.matches(LINK_SELECTOR)) {
        candidates.push(root);
      }

      if (root.querySelectorAll) {
        candidates.push(...root.querySelectorAll(LINK_SELECTOR));
      }

      candidates.forEach((link) => {
        if (this.links.has(link)) return;
        const animatedLink = new AnimatedNavLink(
          link,
          this.gsap,
          this.motionMedia
        );
        animatedLink.mount();
        this.links.set(link, animatedLink);
      });
    }

    onMotionChange() {
      document.querySelectorAll('[data-animated-nav]').forEach((link) => {
        const animatedLink = this.links.get(link);
        if (animatedLink && !this.motionMedia.matches) {
          animatedLink.reset();
        }
      });
    }
  }

  function boot() {
    loadGsap()
      .then((gsapInstance) => {
        const navigation = new AnimatedNavigation(gsapInstance);
        navigation.init();
        window.animatedNavigation = navigation;
      })
      .catch(() => {
        // The navbar remains fully functional if the CDN is unavailable.
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.AnimatedNavLink = AnimatedNavLink;
})();
