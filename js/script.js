const revealBlocks = document.querySelectorAll('.reveal-block');

  if (revealBlocks.length > 0 && 'IntersectionObserver' in window) {
    const blockObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          blockObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2
    });

    revealBlocks.forEach(block => blockObserver.observe(block));

  } else {
    revealBlocks.forEach(block => block.classList.add('in-view'));
  }
  
function initSiteInteractions() {
  console.log("JS loaded");

  /* === Hover autoplay for ALL project carousels === */
  const projectCarousels = document.querySelectorAll('.project-carousel');

  if (typeof bootstrap !== 'undefined' && projectCarousels.length > 0) {
    projectCarousels.forEach((el) => {
      const carousel = new bootstrap.Carousel(el, {
        interval: 2000,
        ride: false,
        pause: false,
        wrap: true
      });

      el.addEventListener('mouseenter', () => carousel.cycle());
      el.addEventListener('mouseleave', () => carousel.pause());
    });
  }

  /* === Avatar 换装 + tooltip === */
  const avatar  = document.getElementById('avatarImage');
  const tooltip = document.getElementById('cursor-tooltip');

  if (avatar && tooltip) {
    const placeTooltipNearAvatar = () => {
      const rect = avatar.getBoundingClientRect();
      tooltip.style.left = rect.width / 2 + "px";
      tooltip.style.top  = rect.height + 12 + "px";
    };

    placeTooltipNearAvatar();
    tooltip.style.opacity = 1;

    // 换装图片路径（确认和 img 里的文件名一致）
    const avatars = [
      "img/logo1.png",
      "img/logo2.png",
      "img/logo3.png",
      "img/logo4.png",
      "img/logo5.png"
    ];

    let currentAvatar = 0;

    // 点击换装
    avatar.addEventListener("click", function () {
      currentAvatar = (currentAvatar + 1) % avatars.length;
      avatar.src = avatars[currentAvatar];
    });

    // 鼠标移动时，让 tooltip 跟着走
    avatar.addEventListener("mousemove", function (e) {
      const rect = avatar.getBoundingClientRect();
      tooltip.style.opacity = 1;
      tooltip.style.left = (e.clientX - rect.left) + "px";
      tooltip.style.top  = (e.clientY - rect.top + 24) + "px";
    });

    avatar.addEventListener("mouseleave", function () {
      tooltip.style.opacity = 0;
    });

    window.addEventListener("resize", placeTooltipNearAvatar);
  }

  /* === Gallery 标签筛选 === */
  const filterButtons = document.querySelectorAll('.tag-btn');
  const projectCards  = document.querySelectorAll('.project-card');

  if (filterButtons.length > 0 && projectCards.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        // 激活状态切换
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 显示/隐藏卡片
        projectCards.forEach(card => {
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSiteInteractions);
} else {
  initSiteInteractions();
}
