/**
 * Site-wide inverse cursor.
 * Keeps the original 32px corner-bracket shape and uses difference blending
 * so its stroke automatically inverts against text, images, and backgrounds.
 */
(function () {
  'use strict';

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let cursor = null;
  let frame = 0;
  let pointerX = -32;
  let pointerY = -32;

  function draw() {
    frame = 0;
    if (!cursor) return;

    // The original cursor hotspot was at 6,6 inside the 32px SVG.
    cursor.style.transform = `translate3d(${pointerX - 6}px, ${pointerY - 6}px, 0)`;
  }

  function showAt(event) {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;

    pointerX = event.clientX;
    pointerY = event.clientY;
    cursor.classList.add('is-visible');

    if (!frame) frame = window.requestAnimationFrame(draw);
  }

  function hide() {
    if (cursor) cursor.classList.remove('is-visible');
  }

  function mount() {
    if (!finePointer.matches || cursor || !document.body) return;

    cursor = document.createElement('div');
    cursor.className = 'inverse-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = [
      '<svg viewBox="0 0 32 32" focusable="false" aria-hidden="true">',
      '<path d="M20 20 L6 6 M6 6 L20 6 M6 6 L6 20" ',
      'stroke="#fff" stroke-width="3" stroke-linecap="square" ',
      'stroke-linejoin="miter" fill="none"/>',
      '</svg>',
    ].join('');

    document.body.appendChild(cursor);
    document.documentElement.classList.add('has-inverse-cursor');
    window.addEventListener('pointermove', showAt, { passive: true });
    document.addEventListener('mouseleave', hide);
    window.addEventListener('blur', hide);
  }

  function unmount() {
    document.documentElement.classList.remove('has-inverse-cursor');
    window.removeEventListener('pointermove', showAt);
    document.removeEventListener('mouseleave', hide);
    window.removeEventListener('blur', hide);
    if (frame) window.cancelAnimationFrame(frame);
    if (cursor) cursor.remove();
    frame = 0;
    cursor = null;
  }

  function syncPointerMode() {
    if (finePointer.matches) mount();
    else unmount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncPointerMode, { once: true });
  } else {
    syncPointerMode();
  }

  if (typeof finePointer.addEventListener === 'function') {
    finePointer.addEventListener('change', syncPointerMode);
  } else {
    finePointer.addListener(syncPointerMode);
  }
})();
