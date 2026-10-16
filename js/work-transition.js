/**
 * Gallery / homepage selected work → detail. Keeps real document navigation
 * and native link behavior.
 * Repeating-image path inspired by Codrops RepeatingImageTransition:
 * https://github.com/codrops/RepeatingImageTransition
 *
 * MIT License — Copyright (c) 2009 - 2026 Codrops (https://codrops.com)
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function () {
  'use strict';

  const KEY = 'abigail-work-transition';
  const FILE_HASH_PREFIX = '#work-transition=';
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const galleryUrl = new URL('../gallery/', document.currentScript.src);
  const galleryPath = galleryUrl.pathname;
  const homepageUrl = new URL('../', document.currentScript.src);
  const homepagePath = homepageUrl.pathname;
  const currentPath = location.pathname + location.search;
  const onGallery = location.pathname === galleryPath ||
    location.pathname === galleryPath + 'index.html';
  const onHomepage = location.pathname === homepagePath ||
    location.pathname === homepagePath + 'index.html';
  let stage = null;
  let busy = false;
  let watchdog = null;
  let arrival = null;
  const animations = new Set();
  const prefetched = new Set();

  function clearState() {
    try { sessionStorage.removeItem(KEY); } catch (error) { /* Optional storage. */ }
  }

  function normalizePath(path) {
    const [pathname, search = ''] = String(path).split('?');
    const clean = pathname.replace(/\/index\.html$/i, '/').replace(/\/+$/, '') || '/';
    return search ? `${clean}?${search}` : clean;
  }

  function readFileState() {
    if (location.protocol !== 'file:' ||
      !location.hash.startsWith(FILE_HASH_PREFIX)) return null;
    try {
      const state = JSON.parse(decodeURIComponent(
        location.hash.slice(FILE_HASH_PREFIX.length)
      ));
      // Remove the transport payload before the animation becomes visible, so
      // refreshing the detail page cannot replay an old transition.
      history.replaceState(null, '', location.href.slice(0, location.href.indexOf('#')));
      return state;
    } catch (error) { return null; }
  }

  function readState() {
    try {
      // sessionStorage handles normal HTTP navigation. Local file navigation
      // uses the URL fragment because storage is not shared reliably between
      // different file:// documents.
      const state = readFileState() || JSON.parse(sessionStorage.getItem(KEY));
      const navigation = performance.getEntriesByType('navigation')[0];
      if (!state || normalizePath(state.destination) !== normalizePath(currentPath) ||
        Date.now() - state.createdAt > 15000 ||
        navigation?.type === 'back_forward' || navigation?.type === 'reload' ||
        Math.abs(state.viewport - root.clientWidth) > 24 ||
        !state.rect || ![state.rect.left, state.rect.top, state.rect.width,
          state.rect.height].every(Number.isFinite) ||
        state.rect.width <= 0 || state.rect.height <= 0 ||
        new URL(state.src).origin !== location.origin) return null;
      return state;
    } catch (error) { return null; }
  }

  function cleanup() {
    clearTimeout(watchdog);
    animations.forEach((animation) => animation.cancel());
    animations.clear();
    stage?.remove();
    stage = null;
    root.classList.remove('is-work-leaving', 'is-work-arriving', 'is-work-animating');
    root.style.removeProperty('--work-layout-width');
    document.body?.removeAttribute('aria-busy');
    busy = false;
    if (arrival && !arrival.done) {
      arrival.done = true;
      arrival.resolve();
    }
    if (window.WorkTransitionArrival === arrival) delete window.WorkTransitionArrival;
  }

  function animate(element, keyframes, options) {
    const animation = element.animate(keyframes, { fill: 'both', ...options });
    animations.add(animation);
    return animation.finished.catch(() => {});
  }

  function rectOf(element) {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  }

  // Discrete frames: each copy appears and disappears whole, with no tween.
  function showWholeImage(image, delay, hold) {
    return animate(image, [
      { visibility: 'hidden', offset: 0, easing: 'steps(1, end)' },
      { visibility: 'visible', offset: 1 / hold, easing: 'steps(1, end)' },
      { visibility: 'hidden', offset: 1 },
    ], { duration: hold, delay, easing: 'linear' });
  }

  function createStage(opacity) {
    stage = document.createElement('div');
    stage.className = 'work-transition';
    stage.setAttribute('aria-hidden', 'true');
    const backdrop = document.createElement('div');
    backdrop.className = 'work-transition__backdrop';
    backdrop.style.opacity = opacity;
    stage.appendChild(backdrop);
    // Attach outside body so the existing body entrance cannot move the covers.
    root.appendChild(stage);
    return backdrop;
  }

  function createImage(src, rect) {
    const image = document.createElement('img');
    image.className = 'work-transition__image';
    image.alt = '';
    image.src = src;
    Object.assign(image.style, {
      left: rect.left + 'px', top: rect.top + 'px',
      width: rect.width + 'px', height: rect.height + 'px',
    });
    stage.appendChild(image);
    return image;
  }

  function uncoverInformation(backdrop) {
    if (!window.WorkTypeShuffle) return;
    const panel = document.querySelector('.project-detail-page .detail-panel');
    if (!panel) return;
    const rect = rectOf(panel);
    const left = Math.max(0, rect.left);
    const top = Math.max(0, rect.top);
    const right = Math.min(innerWidth, rect.left + rect.width);
    const bottom = Math.min(innerHeight, rect.top + rect.height);
    if (right <= left || bottom <= top) return;
    // Leave the real information panel visible beneath the repeating images.
    // Four simple shades preserve the cover everywhere outside that rectangle.
    backdrop.style.background = 'transparent';
    const regions = [
      [0, 0, innerWidth, top], [0, bottom, innerWidth, innerHeight - bottom],
      [0, top, left, bottom - top], [right, top, innerWidth - right, bottom - top],
    ];
    regions.forEach(([x, y, width, height]) => {
      const shade = document.createElement('div');
      shade.className = 'work-transition__shade';
      Object.assign(shade.style, {
        left: x + 'px', top: y + 'px', width: width + 'px', height: height + 'px',
      });
      backdrop.appendChild(shade);
    });
  }

  function workEntry(target) {
    const link = target instanceof Element ? target.closest('a[href]') : null;
    if (!link || (!onGallery && !onHomepage) || link.hasAttribute('download') ||
      link.dataset.noTransition !== undefined ||
      (link.target && link.target.toLowerCase() !== '_self')) return null;
    const url = new URL(link.href, location.href);
    const relativePath = url.pathname.slice(galleryPath.length);
    if (url.origin !== location.origin || !url.pathname.startsWith(galleryPath) ||
      !/^[^/]+\/(?:index\.html)?$/.test(relativePath) || url.hash) return null;

    if (onGallery) {
      const image = link.querySelector('.project-thumb img');
      const frame = image?.closest('.project-card');
      return image && link.closest('.masonry-item') ? { link, image, frame } : null;
    }

    const directPhoto = link.closest('.polaroid[data-photo]');
    let photo = directPhoto;
    if (!photo && link.matches('.folio-project-link')) {
      const index = link.closest('.folio-project')?.dataset.project;
      if (index !== undefined) photo = document.querySelector(`.polaroid[data-photo="${index}"]`);
    }
    if (!photo) {
      photo = [...document.querySelectorAll('.polaroid[data-photo][href]')]
        .find((candidate) => new URL(candidate.href, location.href).href === url.href);
    }
    const image = photo?.querySelector('.polaroid-image img');
    const frame = image?.closest('.polaroid-image');
    return image ? { link, image, frame } : null;
  }

  async function leave(entry) {
    const { link, image, frame } = entry;
    const destination = new URL(link.href, location.href);
    // Same rhythm as the published site: cover quickly, then navigate.
    if (reducedMotion.matches || !Element.prototype.animate ||
      !image.complete || !image.naturalWidth) {
      location.assign(destination.href);
      return;
    }
    const state = {
      destination: destination.pathname + destination.search,
      src: image.currentSrc || image.src,
      rect: rectOf(image), viewport: root.clientWidth, createdAt: Date.now(),
    };
    if (location.protocol === 'file:') {
      destination.hash = FILE_HASH_PREFIX.slice(1) +
        encodeURIComponent(JSON.stringify(state));
    } else {
      try {
        sessionStorage.setItem(KEY, JSON.stringify(state));
        // Some privacy modes silently discard writes.
        if (!sessionStorage.getItem(KEY)) throw new Error('Storage unavailable');
      } catch (error) {
        location.assign(destination.href);
        return;
      }
    }

    prefetchUrl(destination.href);
    busy = true;
    const backdrop = createStage(0);
    const cover = createImage(state.src, state.rect);
    cover.style.borderRadius = frame ? getComputedStyle(frame).borderRadius : '0px';
    root.style.setProperty('--work-layout-width', state.viewport + 'px');
    root.classList.add('is-work-leaving');
    document.body.setAttribute('aria-busy', 'true');
    watchdog = setTimeout(() => { clearState(); cleanup(); }, 5000);
    try {
      await animate(backdrop, [{ opacity: 0 }, { opacity: 1 }], {
        duration: 90, easing: 'ease-out',
      });
      location.assign(destination.href);
    } catch (error) {
      clearState();
      cleanup();
      location.assign(destination.href);
    }
  }

  // Bound waiting: a blocked font, image, or embed must never trap navigation.
  async function settle(promise, timeout) {
    let timer;
    await Promise.race([
      Promise.resolve(promise).catch(() => {}),
      new Promise((resolve) => { timer = setTimeout(resolve, timeout); }),
    ]);
    clearTimeout(timer);
  }

  async function arrive(state, cover, backdrop) {
    document.body?.setAttribute('aria-busy', 'true');
    try {
      const media = document.querySelector('.project-detail-page .hero img, ' +
        '.project-detail-page .hero iframe, .project-detail-page .hero video');
      if (!media || reducedMotion.matches) return;
      // Keep the published arrive path, but don't freeze on long decode waits.
      await Promise.all([
        settle(document.fonts?.ready, 40),
        media instanceof HTMLImageElement ? settle(media.decode(), 80) : null,
      ]);
      if (!stage) return;
      // Measure the destination with its natural scrollbar before freezing its
      // width. In <head>, the document can still be too short to have one.
      root.classList.remove('is-work-arriving');
      root.style.setProperty('--work-layout-width', root.clientWidth + 'px');
      root.classList.add('is-work-arriving');
      const target = media.closest('.figma-embed, .ratio, .video-embed-cover') || media;
      const end = rectOf(target);
      if (end.width <= 0 || end.height <= 0) return;
      // Mobile metadata can push the real media below the fold. Keep the
      // repetition visible, then uncover the normal top of the detail page.
      if (end.top > innerHeight * 0.7 || end.top + end.height < 0) {
        end.width = Math.min(end.width, root.clientWidth - 32);
        end.height = Math.min(end.width * state.rect.height / state.rect.width, innerHeight * 0.55);
        end.left = (root.clientWidth - end.width) / 2;
        end.top = (innerHeight - end.height) / 2;
      }
      // Fewer stops leave more space between copies, with the same travel time.
      const mobile = matchMedia('(max-width: 767px)').matches;
      const steps = mobile ? 4 : 5;
      const interval = mobile ? 72 : 80;
      const hold = 180;
      const jobs = [];
      uncoverInformation(backdrop);
      arrival.endTime = performance.now() + steps * interval + hold + 180;
      root.classList.add('is-work-animating');

      jobs.push(animate(cover, [
        { visibility: 'visible' }, { visibility: 'hidden' },
      ], { duration: 1, delay: interval * 2, easing: 'steps(1, end)' }));

      for (let index = 1; index <= steps; index++) {
        const progress = index / (steps + 1);
        const rect = {};
        for (const property of ['left', 'top', 'width', 'height']) {
          rect[property] = state.rect[property] + (end[property] - state.rect[property]) * progress;
        }
        // A gentle arc keeps repeats legible even when source and hero align.
        rect.top -= Math.sin(progress * Math.PI) * Math.min(70, innerHeight * 0.08);
        const copy = createImage(state.src, rect);
        jobs.push(showWholeImage(copy, index * interval, hold));
      }

      const landing = createImage(state.src, end);
      const landingDelay = (steps + 1) * interval;
      const revealDelay = steps * interval + hold;
      jobs.push(animate(landing, [
        { visibility: 'hidden' }, { visibility: 'visible' },
      ], { duration: 1, delay: landingDelay, easing: 'steps(1, end)' }));
      // Only the final handoff to the real page fades; copies stay solid.
      jobs.push(animate(landing, [
        { opacity: 1 }, { opacity: 0 },
      ], { duration: 180, delay: revealDelay, easing: 'ease-out' }));
      jobs.push(animate(backdrop, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 180, delay: revealDelay, easing: 'ease-out',
      }));
      await Promise.all(jobs);
    } finally {
      cleanup();
    }
  }

  const incoming = readState();
  clearState();
  if (incoming && !reducedMotion.matches && Element.prototype.animate) {
    busy = true;
    arrival = { endTime: null, done: false };
    arrival.finished = new Promise((resolve) => { arrival.resolve = resolve; });
    window.WorkTransitionArrival = arrival;
    root.style.setProperty('--work-layout-width', incoming.viewport + 'px');
    root.classList.add('is-work-arriving', 'has-page-transitioned');
    const backdrop = createStage(1);
    const cover = createImage(incoming.src, incoming.rect);
    watchdog = setTimeout(cleanup, 4000);
    const start = () => { arrive(incoming, cover, backdrop).catch(cleanup); };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else start();
  }

  // Loaded before page-transition.js: only Gallery and homepage work links are claimed.
  document.addEventListener('click', (event) => {
    const entry = workEntry(event.target);
    if (!entry || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!busy) leave(entry).catch(() => {
      clearState(); cleanup(); location.assign(entry.link.href);
    });
  }, true);

  function prefetchUrl(href) {
    if (!href || prefetched.has(href) || location.protocol === 'file:' ||
      navigator.connection?.saveData) return;
    prefetched.add(href);
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.as = 'document';
    hint.href = href;
    document.head.appendChild(hint);
  }

  function prefetch(event) {
    const entry = workEntry(event.target);
    if (entry?.link) prefetchUrl(entry.link.href);
  }
  if (onGallery || onHomepage) {
    document.addEventListener('pointerover', prefetch, { passive: true });
    document.addEventListener('pointerdown', prefetch, { passive: true });
    document.addEventListener('focusin', prefetch);
  }
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) { clearState(); cleanup(); }
  });
  window.addEventListener('pagehide', () => {
    // Keep the small arrival record; restore the old Gallery cleanly from bfcache.
    cleanup();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) cleanup();
  });
})();
