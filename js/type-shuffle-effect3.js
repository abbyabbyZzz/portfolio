/**
 * Effect 3 timing reference (Codrops TypeShuffleAnimation, MIT):
 * https://github.com/codrops/TypeShuffleAnimation/blob/main/src/js/typeShuffle.js
 * 0.8s panel entrance: random starts (0–320ms), seven iterations at 60ms.
 * The panel's 120ms maximum stagger completes the overall sequence.
 * A shared canvas renderer keeps the site's proportional fonts and text layout.
 */
(function () {
  'use strict';

  const SYMBOLS = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>0123456789.');
  const STEP = 60;
  const START_SPREAD = 320;
  const ITERATIONS = 7;
  const palettes = new Map();
  const pools = new Map();
  const jobs = new Set();
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  let layer = null;
  let frame = 0;
  let lastPaint = -Infinity;

  function restore(job) {
    if (job.done) return;
    job.done = true;
    jobs.delete(job);
    job.canvas.remove();
    job.masks.forEach(({ mask, node }) => {
      if (mask.parentNode) mask.replaceWith(node);
    });
    job.resolve?.();
  }

  function tidy() {
    if (jobs.size) return;
    cancelAnimationFrame(frame);
    frame = 0;
    layer?.remove();
    layer = null;
  }

  function finishRunning() {
    Array.from(jobs).forEach(restore);
    tidy();
  }

  function checkFonts() {
    palettes.clear();
    pools.clear();
    jobs.forEach((job) => {
      for (const [font, previous] of job.fonts) {
        job.context.font = font;
        const metrics = job.context.measureText('Mg');
        if (Math.abs(metrics.width - previous.width) > 0.1 ||
          Math.abs((metrics.fontBoundingBoxAscent || 0) - previous.ascent) > 0.1) {
          restore(job);
          break;
        }
      }
    });
    tidy();
  }

  function fittedPool(context, font, width) {
    if (!palettes.has(font)) {
      context.font = font;
      palettes.set(font, SYMBOLS.map((char) => ({ char, width: context.measureText(char).width })));
    }
    const key = font + ':' + Math.round(width * 4);
    if (!pools.has(key)) {
      const palette = palettes.get(font);
      let fitting = palette.filter((glyph) => glyph.width <= width + 1 && glyph.width >= width * 0.55);
      if (!fitting.length) fitting = palette.filter((glyph) => glyph.width <= width + 1);
      if (!fitting.length) fitting = [palette.reduce((a, b) => a.width < b.width ? a : b)];
      pools.set(key, fitting);
    }
    return pools.get(key);
  }

  function segments(text) {
    if (segmenter) return Array.from(segmenter.segment(text));
    let index = 0;
    return Array.from(text, (segment) => {
      const item = { segment, index };
      index += segment.length;
      return item;
    });
  }

  function displayedChar(char, text, index, transform) {
    if (transform === 'uppercase') return char.toLocaleUpperCase();
    if (transform === 'lowercase') return char.toLocaleLowerCase();
    if (transform === 'capitalize' && (index === 0 || /\s/.test(text[index - 1]))) {
      return char.toLocaleUpperCase();
    }
    return char;
  }

  function prepare(target) {
    const rect = target.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context || rect.width <= 0 || rect.height <= 0) throw new Error('Text canvas unavailable');
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const padding = Math.ceil(parseFloat(getComputedStyle(target).fontSize) || 16);
    canvas.className = 'work-shuffle-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.width = Math.ceil((rect.width + padding * 2) * ratio);
    canvas.height = Math.ceil((rect.height + padding * 2) * ratio);
    Object.assign(canvas.style, {
      width: rect.width + padding * 2 + 'px', height: rect.height + padding * 2 + 'px',
    });
    context.scale(ratio, ratio);
    context.translate(padding, padding);
    context.textBaseline = 'alphabetic';
    context.textAlign = 'left';

    const job = { target, rect, padding, canvas, context, cells: [], masks: [], fonts: new Map(), done: false };
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.data.trim() && !node.parentElement.closest(
          'script, style, svg, canvas, [aria-hidden="true"]'
        ) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const range = document.createRange();

    // Measure before masking. Original text nodes, links and emphasis stay intact.
    nodes.forEach((node) => {
      const style = getComputedStyle(node.parentElement);
      const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.font = font;
      const metrics = context.measureText('Mg');
      const ascent = metrics.fontBoundingBoxAscent || parseFloat(style.fontSize) * 0.8;
      job.fonts.set(font, { width: metrics.width, ascent: metrics.fontBoundingBoxAscent || 0 });
      segments(node.data).forEach(({ segment, index }) => {
        if (/^\s+$/u.test(segment)) return;
        range.setStart(node, index);
        range.setEnd(node, index + segment.length);
        const cellRect = range.getBoundingClientRect();
        if (cellRect.width <= 0 || cellRect.height <= 0) return;
        job.cells.push({
          x: cellRect.left - rect.left,
          y: cellRect.top - rect.top + ascent,
          width: cellRect.width,
          font,
          color: style.color,
          original: displayedChar(segment, node.data, index, style.textTransform),
          pool: fittedPool(context, font, cellRect.width),
          delay: Math.random() * START_SPREAD,
          iteration: -1,
          value: '',
          offset: 0,
        });
      });
    });

    try {
      nodes.forEach((node) => {
        const mask = document.createElement('span');
        mask.className = 'work-shuffle-mask';
        node.replaceWith(mask);
        mask.appendChild(node);
        job.masks.push({ mask, node });
      });
      if (!layer) {
        layer = document.createElement('div');
        layer.className = 'work-shuffle-layer';
        layer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(layer);
      }
      layer.appendChild(canvas);
      return job;
    } catch (error) {
      restore(job);
      tidy();
      throw error;
    }
  }

  function paint(job, elapsed) {
    const { context, rect, padding } = job;
    context.clearRect(-padding, -padding, rect.width + padding * 2, rect.height + padding * 2);
    let completed = 0;
    if (job.endTime !== null) {
      elapsed *= job.sequenceDuration / Math.max(1, job.endTime - job.start);
    }
    job.cells.forEach((cell) => {
      const iteration = Math.floor((elapsed - cell.delay) / STEP);
      if (iteration < 0) return;
      if (iteration >= ITERATIONS - 1) {
        cell.value = cell.original;
        cell.offset = 0;
        completed++;
      } else if (iteration !== cell.iteration) {
        const glyph = cell.pool[Math.floor(Math.random() * cell.pool.length)];
        cell.value = glyph.char;
        cell.offset = (cell.width - glyph.width) / 2;
      }
      cell.iteration = iteration;
      context.font = cell.font;
      context.fillStyle = cell.color;
      // Draw natural glyph shapes; pool selection handles fit without scaling.
      context.fillText(cell.value, cell.x + cell.offset, cell.y);
    });
    if (completed === job.cells.length && !job.holdAtEnd) restore(job);
  }

  function tick(now) {
    frame = 0;
    try {
      // Read positions together so sticky information panels follow native scroll.
      const positions = Array.from(jobs, (job) => ({ job, rect: job.target.getBoundingClientRect() }));
      const repaint = now - lastPaint >= STEP;
      if (repaint) lastPaint = now;
      positions.forEach(({ job, rect }) => {
        if (Math.abs(rect.width - job.rect.width) > 1 || Math.abs(rect.height - job.rect.height) > 1) {
          restore(job);
          return;
        }
        job.canvas.style.left = rect.left - job.padding + 'px';
        job.canvas.style.top = rect.top - job.padding + 'px';
        if (job.endTime !== null && now >= job.endTime && !job.holdAtEnd) {
          restore(job);
          return;
        }
        if (repaint) paint(job, now - job.start);
      });
    } catch (error) {
      finishRunning();
    }
    if (jobs.size) frame = requestAnimationFrame(tick);
    else tidy();
  }

  window.WorkTypeShuffle = {
    play(target, { delay = 0, endTime = null, holdAtEnd = false } = {}) {
      const job = prepare(target);
      job.start = performance.now() + delay;
      job.endTime = Number.isFinite(endTime) ? endTime : null;
      // The cover controller releases synchronized jobs on its actual finish.
      job.holdAtEnd = holdAtEnd && job.endTime !== null;
      job.sequenceDuration = job.cells.reduce((max, cell) => Math.max(max, cell.delay), 0) +
        STEP * (ITERATIONS - 1);
      const finished = new Promise((resolve) => { job.resolve = resolve; });
      jobs.add(job);
      if (!job.cells.length) { restore(job); tidy(); }
      else if (!frame) { lastPaint = -Infinity; frame = requestAnimationFrame(tick); }
      return { finished, cancel() { restore(job); tidy(); } };
    },
  };
  window.addEventListener('resize', finishRunning, { passive: true });
  document.fonts?.addEventListener('loadingdone', checkFonts);
  window.addEventListener('pagehide', finishRunning);
})();
