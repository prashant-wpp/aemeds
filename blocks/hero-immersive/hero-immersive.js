import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the hero-immersive block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const bg = document.createElement('div');
  bg.className = 'hi-bg';

  const content = document.createElement('div');
  content.className = 'hi-content';

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
    const optimized = createOptimizedPicture(img.src, img.alt, true, [{ width: '1600' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });
}
