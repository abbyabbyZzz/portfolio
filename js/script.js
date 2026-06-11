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
function initSelectedWorks() {
  const section = document.getElementById('selected-works');
  if (!section) return;

  const slides = section.querySelectorAll('.work-slide');
  const currentEl = section.querySelector('.counter-current');
  const progressFill = section.querySelector('.progress-fill');
  const total = slides.length;

  if (total === 0) return;

  let currentIndex = 0;
  let isThrottled = false;
  const throttleMs = 500;

  function showSlide(index) {
    index = Math.max(0, Math.min(total - 1, index));
    if (index === currentIndex) return;
    currentIndex = index;

    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });

    if (currentEl) {
      currentEl.textContent = String(index + 1).padStart(2, '0');
    }

    if (progressFill) {
      progressFill.style.width = `${(index / (total - 1)) * 100}%`;
    }
  }

  function onWheel(e) {
    const rect = section.getBoundingClientRect();
    // Allow normal scroll until section top reaches viewport top
    if (rect.top > 0) return;
    // Section has fully left viewport below
    if (rect.bottom <= 0) return;

    const direction = e.deltaY > 0 ? 1 : -1;

    // At first slide scrolling up, or last slide scrolling down:
    // let the page scroll normally
    if ((direction === -1 && currentIndex === 0) ||
        (direction === 1 && currentIndex === total - 1)) {
      return;
    }

    e.preventDefault();

    if (isThrottled) return;
    isThrottled = true;
    setTimeout(() => { isThrottled = false; }, throttleMs);

    showSlide(currentIndex + direction);
  }

  section.addEventListener('wheel', onWheel, { passive: false });

  // Initialize
  showSlide(0);
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
    'img/logo1.GIF',
    'img/logo2.GIF',
    'img/logo3.GIF',
    'img/logo4.GIF',
    'img/logo5.GIF',
  ];
  let currentAvatar = 0;

  avatar.addEventListener('click', () => {
    currentAvatar = (currentAvatar + 1) % avatars.length;
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
  initFooterReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
