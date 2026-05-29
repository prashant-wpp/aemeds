import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the explore-panels block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const grid = document.createElement('div');
  grid.className = 'explore-panels-grid';

  [...block.children].forEach((row) => {
    const card = document.createElement('article');
    card.className = 'explore-panels-card';
    moveInstrumentation(row, card);

    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture, img')) {
        cell.classList.add('explore-panels-image');
      } else {
        cell.classList.add('explore-panels-body');
      }
    });

    while (row.firstElementChild) {
      card.append(row.firstElementChild);
    }

    grid.append(card);
  });

  block.replaceChildren(grid);

  block.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
}
