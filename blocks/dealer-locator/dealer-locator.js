import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_PLACEHOLDER = 'City, suburb, town or zip';

/**
 * loads and decorates the dealer-locator block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const widget = document.createElement('section');
  widget.className = 'dl-widget';

  const bg = document.createElement('div');
  bg.className = 'dl-bg';

  const inner = document.createElement('div');
  inner.className = 'dl-inner';

  const heading = document.createElement('div');
  heading.className = 'dl-heading';

  let placeholder = DEFAULT_PLACEHOLDER;

  rows.forEach((row) => {
    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture, img')) {
        moveInstrumentation(cell, bg);
        while (cell.firstElementChild) bg.append(cell.firstElementChild);
        return;
      }

      const text = cell.textContent.trim();
      if (cell.querySelector('h2, h3, p')) {
        moveInstrumentation(cell, heading);
        while (cell.firstElementChild) heading.append(cell.firstElementChild);
      } else if (text) {
        placeholder = text;
      }
    });
  });

  const search = document.createElement('div');
  search.className = 'dl-search';

  const searchField = document.createElement('div');
  searchField.className = 'dl-search-field';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'dl-search-input';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);

  const searchBtn = document.createElement('button');
  searchBtn.type = 'button';
  searchBtn.className = 'dl-search-btn';
  searchBtn.setAttribute('aria-label', 'Search');

  const iconSpan = document.createElement('span');
  iconSpan.className = 'icon icon-search';
  searchBtn.append(iconSpan);

  searchField.append(input, searchBtn);
  search.append(searchField);
  inner.append(heading, search);
  widget.append(bg, inner);
  block.replaceChildren(widget);

  bg.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '1600' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  decorateIcons(block);
}
