/**
 * Abigail Han Portfolio — Core Interactions
 * - Live clock
 * - Selected Works scroll-driven slide switching
 * - Gallery filtering
 * - Legacy carousel & avatar
 */

/* ================================================================
   Live Clock
   ================================================================ */
function updateClock() {
  const clockEl = document.getElementById('clock');
  if (!clockEl) return;

  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${h}:${m}:${s}`;
}

setInterval(updateClock, 1000);
updateClock();

/* ================================================================
   Selected Works — Scroll-driven slide switching
   ================================================================ */
let footerVisible = false;

function showFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer || footerVisible) return;
  footer.classList.add('is-visible', 'is-dark');
  document.body.classList.add('footer-open');
  document.body.style.overflow = 'hidden';
  footerVisible = true;
}

function hideFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer || !footerVisible) return;
  footer.classList.remove('is-visible', 'is-dark');
  document.body.classList.remove('footer-open');
  document.body.style.overflow = '';
  footerVisible = false;
}

function initSelectedWorks() {
  const section = document.getElementById('selected-works');
  if (!section) return;

  const slides = section.querySelectorAll('.work-slide');
  const progressFill = section.querySelector('.progress-fill');
  const total = slides.length;

  if (total === 0) return;

  let currentIndex = 0;
  let isThrottled = false;
  const throttleMs = 900;
  const overlay = section.querySelector('.works-transition-overlay');
  let isTransitioning = false;
  let lastSlideScrollCount = 0;

  function showSlide(index) {
    index = Math.max(0, Math.min(total - 1, index));
    if (index === currentIndex || isTransitioning) return;
    isTransitioning = true;

    // Phase 1: black cover from top to bottom
    if (overlay) {
      overlay.classList.add('cover');
    }

    setTimeout(() => {
      // At full cover, swap slide content
      currentIndex = index;
      if (currentIndex !== total - 1) {
        lastSlideScrollCount = 0;
      }
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });

      if (progressFill) {
        progressFill.style.width = `${(index / (total - 1)) * 100}%`;
      }

      if (!overlay) {
        isTransitioning = false;
        return;
      }

      // Phase 2: reveal from bottom to up
      // Freeze at fully covered state with bottom origin, disable transition momentarily
      overlay.classList.add('no-transition');
      overlay.classList.remove('cover');
      overlay.style.transform = 'scaleY(1)';
      overlay.style.transformOrigin = 'bottom';
      overlay.offsetHeight; // force reflow

      // Re-enable transition and start reveal
      overlay.classList.remove('no-transition');
      overlay.classList.add('reveal');
      overlay.style.transform = '';
      overlay.style.transformOrigin = '';

      setTimeout(() => {
        overlay.classList.remove('reveal');
        isTransitioning = false;
      }, 400);
    }, 400);
  }

  function onWheel(e) {
    if (footerVisible) return;

    const rect = section.getBoundingClientRect();
    // Allow normal scroll until section top reaches viewport top
    if (rect.top > 0) return;
    // Section has fully left viewport below
    if (rect.bottom <= 0) return;

    const direction = e.deltaY > 0 ? 1 : -1;

    // At first slide scrolling up: let the page scroll normally
    if (direction === -1 && currentIndex === 0) {
      return;
    }

    // At last slide scrolling down: count scrolls, reveal footer after 2
    if (direction === 1 && currentIndex === total - 1) {
      e.preventDefault();
      lastSlideScrollCount++;
      if (lastSlideScrollCount >= 2) {
        showFooter();
        lastSlideScrollCount = 0;
      }
      return;
    }

    // Scrolling up from last slide: reset counter
    if (direction === -1 && currentIndex === total - 1) {
      lastSlideScrollCount = 0;
    }

    e.preventDefault();

    if (isThrottled) return;
    isThrottled = true;
    setTimeout(() => { isThrottled = false; }, throttleMs);

    showSlide(currentIndex + direction);
  }

  window.addEventListener('wheel', onWheel, { passive: false });

  // Exit overlay: cover sticky container in black as it scrolls away
  const stickyEl = section.querySelector('.works-sticky');
  const exitOverlay = section.querySelector('.works-exit-overlay');
  if (stickyEl && exitOverlay) {
    const exitObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const ratio = entry.intersectionRatio;
        const reveal = Math.max(0, Math.min(1, 1 - ratio));
        exitOverlay.style.setProperty('--exit-reveal', reveal.toFixed(3));
      });
    }, {
      threshold: Array.from({ length: 101 }, (_, i) => i / 100)
    });
    exitObserver.observe(stickyEl);
  }

  // Initialize
  showSlide(0);
}

/* ================================================================
   Footer Drawer — full-screen reveal from bottom
   ================================================================ */
function initFooterDrawer() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;

  window.addEventListener('wheel', (e) => {
    if (footerVisible && e.deltaY < 0) {
      e.preventDefault();
      hideFooter();
    }
  }, { passive: false });
}

/* ================================================================
   Gallery Filtering (gallery page only)
   ================================================================ */
function initGalleryFilter() {
  const filterButtons = document.querySelectorAll('.tag-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (filterButtons.length === 0 || projectCards.length === 0) return;

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      projectCards.forEach((card) => {
        const category = card.dataset.category;
        const col = card.closest('.col');
        if (!col) return;

        if (filter === 'all' || category === filter) {
          col.classList.remove('d-none');
        } else {
          col.classList.add('d-none');
        }
      });
    });
  });
}

/* ================================================================
   Custom Carousels (homepage selected-works hover auto-switch)
   ================================================================ */
function initCarousels() {
  const carousels = document.querySelectorAll('.slide-visual.carousel');
  carousels.forEach((carousel) => {
    const items = carousel.querySelectorAll('.carousel-item');
    if (items.length <= 1) return;

    let current = 0;
    let interval = null;
    const delay = parseInt(carousel.dataset.autoplay, 10) || 2000;

    function show(index) {
      items.forEach((item, i) => item.classList.toggle('active', i === index));
      current = index;
    }

    function next() {
      show((current + 1) % items.length);
    }

    carousel.addEventListener('mouseenter', () => {
      interval = setInterval(next, delay);
    });

    carousel.addEventListener('mouseleave', () => {
      clearInterval(interval);
      interval = null;
    });
  });
}

/* ================================================================
   Bootstrap Carousels (legacy project detail pages)
   ================================================================ */
function initLegacyCarousels() {
  if (typeof bootstrap === 'undefined') return;

  const carousels = document.querySelectorAll('.project-carousel');
  carousels.forEach((el) => {
    const carousel = new bootstrap.Carousel(el, {
      interval: 2000,
      ride: false,
      pause: false,
      wrap: true,
    });

    el.addEventListener('mouseenter', () => carousel.cycle());
    el.addEventListener('mouseleave', () => carousel.pause());
  });
}

/* ================================================================
   Avatar + Tooltip (legacy homepage only)
   ================================================================ */
function initAvatar() {
  const avatar = document.getElementById('avatarImage');
  const tooltip = document.getElementById('cursor-tooltip');
  if (!avatar || !tooltip) return;

  const placeTooltip = () => {
    const rect = avatar.getBoundingClientRect();
    tooltip.style.left = rect.width / 2 + 'px';
    tooltip.style.top = rect.height + 12 + 'px';
  };

  placeTooltip();
  tooltip.style.opacity = 1;

  const avatars = [
    'img/logo1.gif',
    'img/logo2.gif',
    'img/logo3.gif',
    'img/logo4.gif',
    'img/logo5.gif',
  ];
  let currentAvatar = 0;

  avatar.addEventListener('click', () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * avatars.length);
    } while (nextIndex === currentAvatar && avatars.length > 1);
    currentAvatar = nextIndex;
    avatar.src = avatars[currentAvatar];
  });

  avatar.addEventListener('mousemove', (e) => {
    const rect = avatar.getBoundingClientRect();
    tooltip.style.opacity = 1;
    tooltip.style.left = (e.clientX - rect.left) + 'px';
    tooltip.style.top = (e.clientY - rect.top + 24) + 'px';
  });

  avatar.addEventListener('mouseleave', () => {
    tooltip.style.opacity = 0;
  });

  window.addEventListener('resize', placeTooltip);
}

/* ================================================================
   Footer Reveal
   ================================================================ */
function initFooterReveal() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const ratio = entry.intersectionRatio;
      footer.style.setProperty('--reveal', ratio.toFixed(3));
      if (ratio > 0.35) {
        footer.classList.add('is-dark');
      } else if (ratio < 0.15) {
        footer.classList.remove('is-dark');
      }
    });
  }, {
    threshold: Array.from({length: 101}, (_, i) => i / 100)
  });

  observer.observe(footer);
}

/* ================================================================
   Init
   ================================================================ */
function init() {
  initSelectedWorks();
  initGalleryFilter();
  initCarousels();
  initLegacyCarousels();
  initAvatar();
  initFooterDrawer();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
