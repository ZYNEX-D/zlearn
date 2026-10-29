/**
 * Chemia Framework - High-Performance DOM & Transform Utilities
 */

export const $ = (selector, parent = document) => parent.querySelector(selector);
export const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

/**
 * Apply GPU-composited 3D transforms to avoid DOM layout reflows.
 * Uses translate3d so the browser keeps the element on the compositor thread.
 */
export function setTransform3d(el, x, y, visible = true) {
  if (!visible) {
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    return;
  }
  el.style.opacity = '1';
  el.style.pointerEvents = 'auto';
  el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
}

export function downloadFile(name, text, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
