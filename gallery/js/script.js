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
  const containerWidth = container.offsetWidth;
  const colWidth = (containerWidth - (gap * 16 * (cols - 1))) / cols;

  // 初始化列高度数组
  const colHeights = new Array(cols).fill(0);

  // 按顺序排列每个项目
  items.forEach((item, index) => {
    // 找到最短的列
    const shortestCol = colHeights.indexOf(Math.min(...colHeights));
    
    // 设置位置
    item.style.position = 'absolute';
    item.style.width = colWidth + 'px';
    item.style.left = (shortestCol * (colWidth + gap * 16)) + 'px';
    item.style.top = colHeights[shortestCol] + 'px';
    
    // 更新列高度
    colHeights[shortestCol] += item.offsetHeight + gap * 16;
  });

  // 设置容器高度
  container.style.height = Math.max(...colHeights) + 'px';
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
  // 如果DOM已经加载完成
  waitForImages(() => {
    setTimeout(initMasonry, 100);
  });
}

// 监听DOM变化，自动重新布局（支持动态添加作品）
const container = document.querySelector('.masonry-container');
if (container && 'MutationObserver' in window) {
  const observer = new MutationObserver(() => {
    // 延迟执行，确保新元素已完全插入
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
