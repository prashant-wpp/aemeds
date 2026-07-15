import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the product-hero block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'product-hero-media';

  const content = document.createElement('div');
  content.className = 'product-hero-content';

  [...block.children].forEach((row) => {
    moveInstrumentation(row, content);

    [...row.children].forEach((cell) => {
      const text = cell.textContent.trim();

      if (cell.querySelector('picture, img')) {
        media.append(cell);
        return;
      }

      if (!text) {
        cell.remove();
        return;
      }

      // SKU field from UE model / authored content
      if (/^sku[:\s]/i.test(text) || cell.querySelector('code')) {
        const sku = document.createElement('p');
        sku.className = 'product-hero-sku';
        sku.textContent = text.replace(/^sku[:\s]*/i, '');
        block.dataset.sku = sku.textContent;
        content.append(sku);
        return;
      }

      content.append(cell);
    });
  });

  block.replaceChildren(media, content);

  block.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, true, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
}
