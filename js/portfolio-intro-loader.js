/**
 * Homepage-only, session-scoped portfolio intro.
 * Set window.PORTFOLIO_ALWAYS_SHOW_INTRO = true in index.html while testing.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'portfolioIntroPlayed';
  const ALWAYS_SHOW_INTRO = window.PORTFOLIO_ALWAYS_SHOW_INTRO === true;
  const root = document.documentElement;

  function hasPlayed() {
    if (ALWAYS_SHOW_INTRO) return false;
    try { return sessionStorage.getItem(STORAGE_KEY) === 'true'; }
    catch (error) { return false; }
  }

  function rememberPlayed() {
    try { sessionStorage.setItem(STORAGE_KEY, 'true'); }
    catch (error) { /* The intro still works when storage is unavailable. */ }
  }

  function markHomepageContent(isLocked) {
    Array.from(document.body.children).forEach((element) => {
      if (element.classList.contains('portfolio-intro') || element.tagName === 'SCRIPT') return;
      element.classList.toggle('intro-home-content', isLocked);
      if (isLocked) {
        element.setAttribute('inert', '');
        element.setAttribute('aria-hidden', 'true');
      } else {
        element.removeAttribute('inert');
        element.removeAttribute('aria-hidden');
      }
    });
  }

  function createIntro(pageLabel) {
    const loadingText = `LOADING ${pageLabel}...`;
    const intro = document.createElement('div');
    intro.className = 'portfolio-intro';
    intro.setAttribute('role', 'status');
    intro.setAttribute('aria-live', 'polite');
    intro.setAttribute('aria-label', `Loading ${pageLabel.toLowerCase()}`);
    intro.innerHTML = `
      <canvas class="portfolio-intro__shader" aria-hidden="true"></canvas>
      <div class="portfolio-intro__grid" aria-hidden="true"></div>
      <div class="portfolio-intro__center" aria-hidden="true">
        <span class="portfolio-intro__label">${loadingText}</span>
        <span class="portfolio-intro__center-percent">00%</span>
      </div>
      <div class="portfolio-intro__bottom" aria-hidden="true">
        <span class="portfolio-intro__meta">ABIGAIL HAN</span>
        <div class="portfolio-intro__progress-wrap">
          <div class="portfolio-intro__track"><span class="portfolio-intro__fill"></span></div>
          <span class="portfolio-intro__status">${loadingText} — 000%</span>
        </div>
        <span class="portfolio-intro__meta">PORTFOLIO / 2026</span>
      </div>`;
    return intro;
  }

  function startDither(canvas, reducedMotion) {
    const context = canvas.getContext('2d');
    if (!context) {
      return {
        stop: function () {},
        dissolve: function (duration, onComplete) { onComplete(); },
      };
    }

    let frame = 0;
    let animationFrame = 0;
    let dissolveFrame = 0;
    let lastDraw = 0;
    let running = true;
    const halftoneSize = 3;
    const halftoneThresholds = [
      0.78, 0.46, 0.82,
      0.4, 0.04, 0.5,
      0.86, 0.56, 0.94,
    ];
    let pixels = null;
    let verticalWarp = null;
    let horizontalWarp = null;
    let grainColumns = 1;
    let grainRows = 1;

    function resize() {
      const grainSize = window.innerWidth > 700 ? 7 : 6;
      grainColumns = Math.max(1, Math.ceil(window.innerWidth / grainSize));
      grainRows = Math.max(1, Math.ceil(window.innerHeight / grainSize));
      canvas.width = grainColumns * halftoneSize;
      canvas.height = grainRows * halftoneSize;
      context.imageSmoothingEnabled = false;
      pixels = context.createImageData(canvas.width, canvas.height);
      verticalWarp = new Float32Array(grainColumns);
      horizontalWarp = new Float32Array(grainRows);
    }

    function draw(now) {
      if (!running) return;
      if (now - lastDraw < 32) {
        animationFrame = requestAnimationFrame(draw);
        return;
      }
      lastDraw = now;
      const width = canvas.width;
      const time = reducedMotion ? 0 : frame * 0.026;
      const data = pixels.data;

      for (let x = 0; x < grainColumns; x += 1) {
        const nx = x / grainColumns;
        verticalWarp[x] = Math.sin(nx * 4.8 + time * 0.42) * 0.035 + Math.sin(nx * 11.6 - time * 0.18) * 0.012 + Math.sin(nx * 21.2 + time * 0.12) * 0.004;
      }

      for (let y = 0; y < grainRows; y += 1) {
        const ny = y / grainRows;
        horizontalWarp[y] = Math.cos(ny * 4.3 - time * 0.34) * 0.04 + Math.sin(ny * 10.2 + time * 0.17) * 0.014 + Math.cos(ny * 18.4 - time * 0.11) * 0.005;
      }

      for (let y = 0; y < grainRows; y += 1) {
        const ny = y / grainRows;
        for (let x = 0; x < grainColumns; x += 1) {
          const nx = x / grainColumns;
          const warpedX = nx + horizontalWarp[y];
          const warpedY = ny + verticalWarp[x];
          const cloudA = Math.sin(warpedX * 6.2 + warpedY * 2.1 + time * 0.31);
          const cloudB = Math.cos(warpedY * 6.8 - warpedX * 1.8 - time * 0.25);
          const cloudC = Math.sin((warpedX + warpedY) * 4.8 + time * 0.17);
          const detail = Math.sin(warpedX * 6.8 - warpedY * 2.2 + time * 0.37);
          const rawField = 0.5 + cloudA * 0.26 + cloudB * 0.23 + cloudC * 0.18 + detail * 0.055;
          let field = Math.max(0, Math.min(1, (rawField - 0.18) / 0.64));
          field = field * field * (3 - 2 * field);

          for (let dotY = 0; dotY < halftoneSize; dotY += 1) {
            for (let dotX = 0; dotX < halftoneSize; dotX += 1) {
              const threshold = halftoneThresholds[dotY * halftoneSize + dotX];
              const shade = field > threshold ? 96 : 10;
              const pixelX = x * halftoneSize + dotX;
              const pixelY = y * halftoneSize + dotY;
              const index = (pixelY * width + pixelX) * 4;
              data[index] = shade;
              data[index + 1] = shade;
              data[index + 2] = shade;
              data[index + 3] = 255;
            }
          }
        }
      }
      context.putImageData(pixels, 0, 0);
      frame += 1;
      if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    draw(performance.now());
    function stop() {
      running = false;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    }

    function dissolve(duration, onComplete) {
      stop();
      if (!pixels) {
        onComplete();
        return;
      }

      const source = new Uint8ClampedArray(pixels.data);
      const totalPixels = canvas.width * canvas.height;
      const dissolveOrder = new Uint8Array(totalPixels);
      let startTime = 0;

      for (let index = 0; index < totalPixels; index += 1) {
        const x = index % canvas.width;
        const y = Math.floor(index / canvas.width);
        const randomOrder = ((x * 73 ^ y * 151) & 255) / 255;
        const spatialDrift = (x / canvas.width + y / canvas.height) * 0.08;
        dissolveOrder[index] = Math.min(255, Math.round((randomOrder + spatialDrift) * 255));
      }

      function erase(now) {
        if (!startTime) startTime = now;
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = progress * progress * (3 - 2 * progress);
        const fadeWindow = 0.28;

        for (let index = 0; index < totalPixels; index += 1) {
          const order = dissolveOrder[index] / 255;
          const remaining = progress >= 1
            ? 0
            : Math.max(0, Math.min(1, (order + fadeWindow - eased) / fadeWindow));
          pixels.data[index * 4 + 3] = Math.round(source[index * 4 + 3] * remaining);
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.putImageData(pixels, 0, 0);

        if (progress < 1) dissolveFrame = requestAnimationFrame(erase);
        else onComplete();
      }

      dissolveFrame = requestAnimationFrame(erase);
    }

    return {
      stop,
      dissolve,
      cancelDissolve: function () { cancelAnimationFrame(dissolveFrame); },
    };
  }

  function progressAt(time) {
    const points = [[0, 0], [0.2, 28], [0.5, 68], [0.72, 84], [0.9, 96], [1, 100]];
    for (let index = 1; index < points.length; index += 1) {
      if (time <= points[index][0]) {
        const previous = points[index - 1];
        const next = points[index];
        const local = (time - previous[0]) / (next[0] - previous[0]);
        const eased = local * local * (3 - 2 * local);
        return previous[1] + (next[1] - previous[1]) * eased;
      }
    }
    return 100;
  }

  function play(options = {}) {
    const pageLabel = String(options.label || 'PAGE').toUpperCase();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reducedMotion ? 220 : (options.duration || 3200);
    const hold = reducedMotion ? 50 : (options.hold ?? 220);
    const exitDuration = reducedMotion ? 240 : (options.exitDuration || 1100);
    const coverOnly = options.coverOnly === true;
    const revealOnly = options.revealOnly === true;
    const rememberSession = options.rememberSession !== false;
    const intro = createIntro(pageLabel);
    const fill = intro.querySelector('.portfolio-intro__fill');
    const percent = intro.querySelector('.portfolio-intro__center-percent');
    const status = intro.querySelector('.portfolio-intro__status');
    let progressFrame = 0;
    let lastValue = -1;
    let startTime = 0;
    let finished = false;

    document.body.prepend(intro);
    markHomepageContent(true);
    root.classList.remove('intro-pending');
    root.classList.add('intro-active');
    document.body.setAttribute('aria-busy', 'true');
    const dither = startDither(intro.querySelector('canvas'), reducedMotion);

    function cleanUp() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(progressFrame);
      dither.stop();
      if (dither.cancelDissolve) dither.cancelDissolve();
      intro.remove();
      markHomepageContent(false);
      root.classList.remove('intro-active', 'intro-revealing');
      document.body.removeAttribute('aria-busy');
      if (typeof options.onComplete === 'function') options.onComplete();
      window.dispatchEvent(new CustomEvent('portfolio:intro-complete'));
    }

    function exit() {
      if (rememberSession) rememberPlayed();
      dither.stop();
      intro.classList.add('is-complete');
      intro.setAttribute('aria-label', `${pageLabel.toLowerCase()} loaded`);
      if (coverOnly) {
        window.setTimeout(() => {
          if (typeof options.onCovered === 'function') options.onCovered();
        }, hold);
        return;
      }
      window.setTimeout(() => {
        root.classList.add('intro-revealing');
        if (reducedMotion) {
          intro.classList.add('is-exiting');
          intro.addEventListener('transitionend', (event) => {
            if (event.target === intro) cleanUp();
          });
        } else {
          intro.classList.add('is-dissolving');
          dither.dissolve(exitDuration, cleanUp);
        }
        window.setTimeout(cleanUp, exitDuration + 120);
      }, hold);
    }

    function update(now) {
      if (!startTime) startTime = now;
      const time = Math.min(1, (now - startTime) / duration);
      const value = Math.min(100, Math.floor(progressAt(time)));
      if (value !== lastValue) {
        lastValue = value;
        fill.style.transform = `scaleX(${value / 100})`;
        percent.textContent = `${String(value).padStart(2, '0')}%`;
        status.textContent = `LOADING ${pageLabel}... — ${String(value).padStart(3, '0')}%`;
      }
      if (time < 1) progressFrame = requestAnimationFrame(update);
      else exit();
    }

    if (revealOnly) {
      fill.style.transform = 'scaleX(1)';
      percent.textContent = '100%';
      status.textContent = `LOADING ${pageLabel}... — 100%`;
      requestAnimationFrame(() => requestAnimationFrame(exit));
    } else {
      progressFrame = requestAnimationFrame(update);
    }

    return intro;
  }

  window.PortfolioIntroLoader = { play };

  if (!root.classList.contains('intro-pending')) return;

  if (root.classList.contains('is-page-arriving')) {
    root.classList.remove('intro-pending');
    return;
  }

  if (hasPlayed()) {
    root.classList.remove('intro-pending');
    window.dispatchEvent(new CustomEvent('portfolio:intro-skipped'));
    return;
  }
  if (document.body) play();
  else document.addEventListener('DOMContentLoaded', play, { once: true });
})();
