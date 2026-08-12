import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the zoom-panel block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const bg = document.createElement('div');
  bg.className = 'zp-bg';

  const content = document.createElement('div');
  content.className = 'zp-content';

  [...row.children].forEach((cell) => {
    if (cell.querySelector('picture, img')) {
      moveInstrumentation(cell, bg);
      while (cell.firstElementChild) bg.append(cell.firstElementChild);
    } else {
      moveInstrumentation(cell, content);
      while (cell.firstElementChild) content.append(cell.firstElementChild);
    }
  });

  block.replaceChildren(bg, content);

  block.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '1600' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = block.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(Math.max((vh - rect.top) / (vh + rect.height), 0), 1);
      const scale = 1 + progress * 0.15;
      bg.style.transform = `scale(${scale})`;
      ticking = false;
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      } else {
        window.removeEventListener('scroll', onScroll);
      }
    });
  }, { threshold: 0 });

  observer.observe(block);
}
