/* Gallery masonry and elastic column scroll.
 * Motion reference: https://github.com/codrops/ElasticGridScroll (Demo 1).
 * Native-scroll implementation: keep the original DOM / keyboard reading order
 * and fixed navigation / image overlays outside the animated elements.
 */
(function () {
  'use strict';

  const container = document.querySelector('.masonry-container');
  if (!container) return;

  const items = Array.from(container.querySelectorAll('.masonry-item'));
  const buttons = document.querySelectorAll('.tag-btn');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopMotion = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)');
  let columns = [];
  let motionFrame = 0;
  let layoutFrame = 0;
  let previousTime = 0;
  let maxScroll = 0;
  let motionEnabled = false;

  // Animate only the cards; the outer masonry items are reserved for scroll lag.
  const rowObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        rowObserver.unobserve(entry.target);
      });
    }, { threshold: 0.05, rootMargin: '80px 0px' })
    : null;

  items.forEach(item => {
    if (rowObserver) rowObserver.observe(item);
    else item.classList.add('in-view');
  });
  container.classList.add('gallery-ready');

  function scrollPosition() {
    // Safari's overscroll must not stretch the columns beyond the page bounds.
    return Math.max(0, Math.min(window.scrollY, maxScroll));
  }

  function resetMotion() {
    cancelAnimationFrame(motionFrame);
    motionFrame = 0;
    previousTime = 0;
    const position = scrollPosition();
    columns.forEach(column => { column.position = position; });
    items.forEach(item => item.style.removeProperty('--elastic-y'));
  }

  function updateMotionPreference() {
    motionEnabled = !reducedMotion.matches && desktopMotion.matches && columns.length > 1;
    container.classList.toggle('is-elastic', motionEnabled);
    resetMotion();
  }

  function animateColumns(time) {
    const position = scrollPosition();
    // Frame-rate independent easing also avoids a jump after a background tab.
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.064) : 1 / 60;
    const maxOffset = Math.min(60, window.innerHeight * 0.07);
    previousTime = time;
    let moving = false;

    columns.forEach(column => {
      column.position += (position - column.position) * (1 - Math.exp(-delta / column.lag));
      // Bound fast wheel/scrollbar jumps while preserving the soft catch-up.
      column.position = Math.max(position - maxOffset, Math.min(position + maxOffset, column.position));
      let offset = position - column.position;
      if (Math.abs(offset) < 0.1) {
        column.position = position;
        offset = 0;
      } else {
        moving = true;
      }
      column.items.forEach(item => {
        item.style.setProperty('--elastic-y', `${offset.toFixed(2)}px`);
      });
    });

    motionFrame = moving ? requestAnimationFrame(animateColumns) : 0;
    if (!moving) previousTime = 0;
  }

  function startMotion() {
    if (!motionEnabled || motionFrame || document.hidden) return;
    motionFrame = requestAnimationFrame(animateColumns);
  }

  function layoutMasonry() {
    layoutFrame = 0;
    resetMotion();
    const visibleItems = items.filter(item => !item.hidden);
    const styles = getComputedStyle(container);
    const columnCount = parseInt(styles.getPropertyValue('--gallery-columns'), 10) || 1;
    const gap = parseFloat(styles.columnGap) || 24;
    const width = (container.clientWidth - gap * (columnCount - 1)) / columnCount;
    const heights = Array(columnCount).fill(0);
    const middle = (columnCount - 1) / 2;

    columns = Array.from({ length: columnCount }, (_, index) => ({
      items: [],
      position: 0,
      // Symmetric outer lag on desktop; alternate lag for the two-column layout.
      lag: columnCount === 2 ? 0.1 + index * 0.08 : 0.1 + Math.abs(index - middle) * 0.1,
    }));

    // Set widths together before measuring heights, including wrapped captions.
    visibleItems.forEach(item => {
      item.style.position = 'absolute';
      item.style.width = `${width}px`;
    });
    const itemHeights = visibleItems.map(item => item.offsetHeight);
    visibleItems.forEach((item, index) => {
      const columnIndex = heights.indexOf(Math.min(...heights));
      item.style.left = `${columnIndex * (width + gap)}px`;
      item.style.top = `${heights[columnIndex]}px`;
      heights[columnIndex] += itemHeights[index] + gap;
      columns[columnIndex].items.push(item);
    });

    container.style.height = `${Math.max(0, ...heights) - (visibleItems.length ? gap : 0)}px`;
    container.classList.add('is-positioned');
    maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    updateMotionPreference();
  }

  function scheduleLayout() {
    if (!layoutFrame) layoutFrame = requestAnimationFrame(layoutMasonry);
  }

  buttons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    button.addEventListener('click', () => {
      buttons.forEach(other => {
        const active = other === button;
        other.classList.toggle('active', active);
        other.setAttribute('aria-pressed', String(active));
      });
      const filter = button.dataset.filter;
      items.forEach(item => {
        const category = item.querySelector('.project-card')?.dataset.category;
        item.hidden = filter !== 'all' && category !== filter;
        item.classList.toggle('d-none', item.hidden);
      });
      // Reset immediately so a category switch cannot inherit the old column lag.
      resetMotion();
      scheduleLayout();
    });
  });

  // Image errors must also trigger layout, without blocking all the other cards.
  container.querySelectorAll('img').forEach(img => {
    if (img.complete) return;
    img.addEventListener('load', scheduleLayout, { once: true });
    img.addEventListener('error', scheduleLayout, { once: true });
  });
  if (document.fonts) document.fonts.ready.then(scheduleLayout);

  // Observe actual size changes rather than our own inserted layout elements.
  if ('ResizeObserver' in window) {
    let previousWidth = 0;
    const sizeObserver = new ResizeObserver(entries => {
      if (entries.some(entry => entry.target !== container)) scheduleLayout();
      const containerEntry = entries.find(entry => entry.target === container);
      if (containerEntry && containerEntry.contentRect.width !== previousWidth) {
        previousWidth = containerEntry.contentRect.width;
        scheduleLayout();
      }
    });
    sizeObserver.observe(container);
    items.forEach(item => sizeObserver.observe(item.querySelector('.project-card')));
  }

  window.addEventListener('scroll', startMotion, { passive: true });
  window.addEventListener('resize', scheduleLayout);
  window.addEventListener('pageshow', scheduleLayout);
  reducedMotion.addEventListener('change', updateMotionPreference);
  desktopMotion.addEventListener('change', updateMotionPreference);
  document.addEventListener('visibilitychange', resetMotion);
  container.addEventListener('focusin', () => {
    resetMotion();
    requestAnimationFrame(resetMotion);
  });
  layoutMasonry();
})();

/* Hamburger Menu */
function initHamburgerMenu() {
  const nav = document.querySelector('.site-nav');
  const links = nav ? nav.querySelector('.nav-links') : null;
  if (!nav || !links) return;

  const toggle = document.createElement('button');
  toggle.className = 'nav-toggle';
  toggle.setAttribute('aria-label', 'Toggle menu');
  toggle.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(toggle);

  toggle.addEventListener('click', () => {
    links.classList.toggle('is-open');
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('is-open'));
  });
}

initHamburgerMenu();
