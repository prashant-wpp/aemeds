import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the dealer-locator block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const header = document.createElement('div');
  header.className = 'dl-header';
  moveInstrumentation(row, header);

  const cell = row.children[0];
  if (cell) {
    while (cell.firstElementChild) header.append(cell.firstElementChild);
  }

  const placeholder = header.querySelector('p')?.textContent.trim() || 'Enter city or pincode';

  const search = document.createElement('div');
  search.className = 'dl-search';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', 'Search location');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Search';

  search.append(input, btn);

  const results = document.createElement('div');
  results.className = 'dl-results';

  const map = document.createElement('div');
  map.className = 'dl-map';
  map.setAttribute('aria-label', 'Map area');
  map.innerHTML = '<p>Map integration coming soon</p>';

  block.replaceChildren(header, search, results, map);
}
