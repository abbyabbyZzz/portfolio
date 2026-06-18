/* === Scroll reveal entire rows === */
const revealRows = document.querySelectorAll('.reveal-row');

if (revealRows.length > 0 && 'IntersectionObserver' in window) {
  const rowObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        rowObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2
  });

  revealRows.forEach(row => rowObserver.observe(row));

} else {
  revealRows.forEach(row => row.classList.add('in-view'));
}

// ==== Masonry Layout Function ==== //
function initMasonry() {
  const container = document.querySelector('.masonry-container');
  if (!container) return;

  const items = Array.from(container.querySelectorAll('.masonry-item:not(.d-none)'));
  if (items.length === 0) return;

  // 清除旧的 spacer
  container.querySelectorAll('.masonry-spacer').forEach(el => el.remove());

  // 清除之前的定位
  items.forEach(item => {
    item.style.position = '';
    item.style.top = '';
    item.style.left = '';
  });

  // 获取列数
  let cols = 1;
  if (window.innerWidth >= 992) cols = 3;
  else if (window.innerWidth >= 768) cols = 2;

  const gap = 1.5; // rem
  const gap_px = gap * 16;
  const containerWidth = container.offsetWidth;
  const colWidth = (containerWidth - (gap_px * (cols - 1))) / cols;

  // 跟踪每列的高度和包含的项目
  const colHeights = new Array(cols).fill(0);
  const colItems = Array.from({ length: cols }, () => []);

  // 按顺序排列每个项目
  items.forEach((item, index) => {
    // 找到最短的列
    const shortestCol = colHeights.indexOf(Math.min(...colHeights));

    // 设置位置
    item.style.position = 'absolute';
    item.style.width = colWidth + 'px';
    item.style.left = (shortestCol * (colWidth + gap_px)) + 'px';
    item.style.top = colHeights[shortestCol] + 'px';

    // 更新列高度
    colHeights[shortestCol] += item.offsetHeight + gap_px;
    colItems[shortestCol].push(item);
  });

  // 设置容器高度
  const maxHeight = Math.max(...colHeights);
  container.style.height = maxHeight + 'px';

  // === 底部对齐：给较短的列添加不可见 spacer === //
  colHeights.forEach((height, colIndex) => {
    const diff = maxHeight - height;
    if (diff > gap_px / 2) {
      const spacer = document.createElement('div');
      spacer.className = 'masonry-spacer';
      spacer.style.position = 'absolute';
      spacer.style.width = colWidth + 'px';
      spacer.style.left = (colIndex * (colWidth + gap_px)) + 'px';
      spacer.style.top = height + 'px';
      spacer.style.height = diff + 'px';
      spacer.style.pointerEvents = 'none';
      spacer.style.opacity = '0';
      container.appendChild(spacer);
    }
  });
}

// ==== tags filter ==== //
const buttons = document.querySelectorAll('.tag-btn');
const items = document.querySelectorAll('.project-card');

buttons.forEach(btn => {
  btn.addEventListener('click', () => {

    // button active
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');

    items.forEach(item => {
      const category = item.getAttribute('data-category');
      const masonryItem = item.closest('.masonry-item') || item.parentElement;

      if (!masonryItem) return;

      if (filter === "all" || category === filter) {
        masonryItem.classList.remove('d-none');
      } else {
        masonryItem.classList.add('d-none');
      }
    });

    // 筛选后重新布局
    setTimeout(() => {
      initMasonry();
    }, 50);
  });
});

// 等待图片加载的函数
function waitForImages(callback) {
  const images = document.querySelectorAll('.masonry-item img');
  if (images.length === 0) {
    callback();
    return;
  }

  let loadedCount = 0;
  const totalImages = images.length;

  images.forEach(img => {
    if (img.complete) {
      loadedCount++;
      if (loadedCount === totalImages) callback();
    } else {
      img.addEventListener('load', () => {
        loadedCount++;
        if (loadedCount === totalImages) callback();
      });
      img.addEventListener('error', () => {
        loadedCount++;
        if (loadedCount === totalImages) callback();
      });
    }
  });
}

// 初始化masonry
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    waitForImages(() => {
      setTimeout(initMasonry, 50);
    });
  });
} else {
  waitForImages(() => {
    setTimeout(initMasonry, 100);
  });
}

// 监听DOM变化，自动重新布局
const container = document.querySelector('.masonry-container');
if (container && 'MutationObserver' in window) {
  const observer = new MutationObserver(() => {
    setTimeout(() => {
      waitForImages(() => {
        initMasonry();
      });
    }, 100);
  });

  observer.observe(container, {
    childList: true,
    subtree: true
  });
}

// 窗口大小改变时重新布局
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initMasonry, 250);
});

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
