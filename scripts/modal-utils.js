/**
 * Shared modal accessibility helpers for overlay blocks.
 */

let scrollLockCount = 0;

/**
 * @param {boolean} lock
 */
export function lockBodyScroll(lock) {
  if (lock) {
    scrollLockCount += 1;
    if (scrollLockCount === 1) {
      document.body.style.overflow = 'hidden';
    }
    return;
  }
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = '';
  }
}

/**
 * @param {Element} container
 * @returns {() => void}
 */
export function trapFocus(container) {
  const focusable = () => [...container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((el) => el.offsetParent !== null);

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  return () => container.removeEventListener('keydown', handleKeyDown);
}

/**
 * @param {Element} dialog
 * @param {Element|null} opener
 */
export function focusFirstElement(dialog, opener = null) {
  const preferred = dialog.querySelector('[data-hub-focus]')
    || dialog.querySelector('.intelligence-hub-close')
    || dialog.querySelector('button, a, input');
  (preferred || dialog).focus({ preventScroll: true });
  if (opener) dialog.dataset.openerId = opener.id || '';
}

/**
 * @param {Element} dialog
 * @returns {Element|null}
 */
export function restoreOpenerFocus(dialog) {
  const id = dialog.dataset.openerId;
  if (id) {
    const el = document.getElementById(id);
    if (el) {
      el.focus({ preventScroll: true });
      delete dialog.dataset.openerId;
      return el;
    }
  }
  const active = document.activeElement;
  if (active instanceof HTMLElement && dialog.contains(active)) {
    active.blur();
  }
  return null;
}
