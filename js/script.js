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
  let lastSlideCooldown = false;

  function showSlide(index) {
    index = Math.max(0, Math.min(total - 1, index));
    if (index === currentIndex || isTransitioning) return;
    isTransitioning = true;

    if (index !== total - 1) {
      lastSlideScrollCount = 0;
    }

    if (!overlay || window.innerWidth < 768) {
      // Mobile or no overlay: switch directly
      currentIndex = index;
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });

      if (progressFill) {
        progressFill.style.width = `${(index / (total - 1)) * 100}%`;
      }

      setTimeout(() => {
        isTransitioning = false;
      }, 400);
      return;
    }

    // Desktop: black cover transition
    overlay.classList.add('cover');

    setTimeout(() => {
      // Swap content while screen is fully covered
      currentIndex = index;
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });

      if (progressFill) {
        progressFill.style.width = `${(index / (total - 1)) * 100}%`;
      }

      overlay.classList.add('no-transition');
      overlay.classList.remove('cover');
      overlay.style.transform = 'scaleY(1)';
      overlay.style.transformOrigin = 'bottom';
      overlay.offsetHeight; // force reflow

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

  // Arrow buttons
  const stickyEl = section.querySelector('.works-sticky');
  if (stickyEl) {
    const arrowLeft = document.createElement('button');
    arrowLeft.className = 'works-arrow works-arrow--left';
    arrowLeft.innerHTML = '←';
    arrowLeft.setAttribute('aria-label', 'Previous work');
    arrowLeft.addEventListener('click', () => {
      if (currentIndex > 0) showSlide(currentIndex - 1);
    });

    const arrowRight = document.createElement('button');
    arrowRight.className = 'works-arrow works-arrow--right';
    arrowRight.innerHTML = '→';
    arrowRight.setAttribute('aria-label', 'Next work');
    arrowRight.addEventListener('click', () => {
      if (currentIndex < total - 1) showSlide(currentIndex + 1);
    });

    const viewMoreBtn = document.createElement('a');
    viewMoreBtn.className = 'works-view-more';
    viewMoreBtn.href = 'gallery/index.html';
    viewMoreBtn.textContent = 'View More Works →';

    stickyEl.appendChild(arrowLeft);
    stickyEl.appendChild(arrowRight);
    stickyEl.appendChild(viewMoreBtn);
  }

  function onWheel(e) {
    if (window.innerWidth < 768) return;
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

    // At last slide scrolling down
    if (direction === 1 && currentIndex === total - 1) {
      if (window.innerWidth < 768) {
        // Mobile: allow normal scroll to footer
        return;
      }
      // Desktop: reveal footer after 2 scrolls
      e.preventDefault();
      if (lastSlideCooldown) return;
      lastSlideCooldown = true;
      setTimeout(() => { lastSlideCooldown = false; }, throttleMs);
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
  const stickyElObs = section.querySelector('.works-sticky');
  const exitOverlay = section.querySelector('.works-exit-overlay');
  if (stickyElObs && exitOverlay) {
    const exitObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const ratio = entry.intersectionRatio;
        const reveal = Math.max(0, Math.min(1, 1 - ratio));
        exitOverlay.style.setProperty('--exit-reveal', reveal.toFixed(3));
      });
    }, {
      threshold: Array.from({ length: 101 }, (_, i) => i / 100)
    });
    exitObserver.observe(stickyElObs);
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

/* ================================================================n   Project Detail — Previous / Next navigation
   ================================================================ */
function initProjectNav() {
  const detailLeft = document.querySelector('.detail-left');
  if (!detailLeft) return;

  const projects = [
    { name: 'Gallery Beyond', slug: 'gallery-beyond' },
    { name: 'Subscription Trap', slug: 'subscription-trap' },
    { name: 'Henc', slug: 'henc' },
    { name: 'Code: Escape', slug: 'code-escape' },
    { name: 'SSENSE IA Redesign', slug: 'ssense' },
    { name: 'Flare', slug: 'flare' },
    { name: 'The Cursed Gallery', slug: 'the-cursed-gallery' },
    { name: '2024 Portfolio Website Prototype', slug: '2024-portfolio' },
    { name: 'The Swallow', slug: 'the-swallow' },
    { name: 'Weaving Dreams', slug: 'weaving-dreams' },
  ];

  const pathParts = window.location.pathname.split('/');
  const currentSlug = pathParts[pathParts.length - 2];
  const currentIndex = projects.findIndex(p => p.slug === currentSlug);

  if (currentIndex === -1) return;

  const prev = projects[(currentIndex - 1 + projects.length) % projects.length];
  const next = projects[(currentIndex + 1) % projects.length];

  const nav = document.createElement('nav');
  nav.className = 'project-nav-footer';
  nav.innerHTML = `
    <a href="../${prev.slug}/index.html" class="project-nav-prev">← ${prev.name}</a>
    <a href="../${next.slug}/index.html" class="project-nav-next">${next.name} →</a>
  `;

  detailLeft.appendChild(nav);
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
  initProjectNav();
  initHamburgerMenu();
  initDetailPanelMobile();
}

/* ================================================================
   Project Detail — Collapsable mobile panel
   ================================================================ */
function initDetailPanelMobile() {
  const panel = document.querySelector('.detail-panel');
  if (!panel) return;
  if (panel.querySelector('.detail-toggle')) return;

  const meta = panel.querySelector('.detail-meta');
  const body = panel.querySelector('.detail-body');
  if (!meta && !body) return;

  // Create collapsable wrapper
  const collapsable = document.createElement('div');
  collapsable.className = 'detail-collapsable is-open';

  // Move meta and body into collapsable
  if (meta) collapsable.appendChild(meta);
  if (body) collapsable.appendChild(body);

  // Create toggle bar
  const toggle = document.createElement('button');
  toggle.className = 'detail-toggle';
  toggle.textContent = 'Work Info';
  toggle.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('type', 'button');

  toggle.addEventListener('click', () => {
    const isOpen = collapsable.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Insert after subtitle (or title)
  const subtitle = panel.querySelector('.detail-subtitle');
  if (subtitle) {
    subtitle.after(toggle);
    toggle.after(collapsable);
  } else {
    const title = panel.querySelector('.detail-title');
    if (title) {
      title.after(toggle);
      toggle.after(collapsable);
    } else {
      panel.appendChild(toggle);
      panel.appendChild(collapsable);
    }
  }
}

/* ================================================================
   Hamburger Menu — inject toggle on mobile
   ================================================================ */
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
    toggle.classList.toggle('is-open');
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle.classList.remove('is-open');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
