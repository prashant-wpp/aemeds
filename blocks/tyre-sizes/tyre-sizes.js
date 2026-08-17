import { moveInstrumentation } from '../../scripts/scripts.js';

const TRUTHY = new Set(['true', 'yes', '1']);

function isEmptyCell(cell) {
  return !cell?.textContent?.trim();
}

function isMostUsedValue(text) {
  return TRUTHY.has(text.trim().toLowerCase());
}

function isSizeRow(cells) {
  const texts = cells.map((c) => c.textContent.trim()).filter(Boolean);
  if (texts.length < 5) return false;
  return /^\d{2,3}$/.test(texts[0]) && /^\d{2,3}$/.test(texts[1]) && /^\d{1,2}$/.test(texts[2]);
}

function parseSizeRow(cells) {
  const values = cells.map((c) => c.textContent.trim()).filter(Boolean);
  const [
    widthMm,
    aspectRatio,
    rimDiameter,
    loadIndex,
    speedRating,
    displaySize,
    isMostUsed,
  ] = values;

  const computedDisplay = displaySize
    || `${widthMm}/${aspectRatio} R${rimDiameter}`;

  return {
    widthMm,
    aspectRatio,
    rimDiameter,
    loadIndex,
    speedRating,
    displaySize: computedDisplay,
    isMostUsed: isMostUsedValue(isMostUsed || ''),
  };
}

function getRows(block) {
  return [...block.children].map((row) => [...row.children].filter((cell) => !isEmptyCell(cell)));
}

function buildTable(variants) {
  const table = document.createElement('table');
  table.className = 'ts-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Width (mm)</th>
        <th scope="col">Aspect Ratio</th>
        <th scope="col">Rim Diameter</th>
        <th scope="col">Load Index</th>
        <th scope="col">Speed Rating</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');
  variants.forEach((variant) => {
    const row = document.createElement('tr');
    row.dataset.displaySize = variant.displaySize;
    row.dataset.mostUsed = variant.isMostUsed ? 'true' : 'false';
    row.innerHTML = `
      <td>${variant.widthMm}</td>
      <td>${variant.aspectRatio}</td>
      <td>${variant.rimDiameter}</td>
      <td>${variant.loadIndex}</td>
      <td>${variant.speedRating}</td>
    `;
    tbody.append(row);
  });

  return table;
}

function buildCards(variants) {
  const list = document.createElement('div');
  list.className = 'ts-cards';
  list.setAttribute('role', 'list');

  variants.forEach((variant) => {
    const card = document.createElement('article');
    card.className = 'ts-card';
    card.dataset.displaySize = variant.displaySize;
    card.dataset.mostUsed = variant.isMostUsed ? 'true' : 'false';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <h3 class="ts-card-size">${variant.displaySize}</h3>
      <dl class="ts-card-specs">
        <div><dt>Width</dt><dd>${variant.widthMm} mm</dd></div>
        <div><dt>Aspect Ratio</dt><dd>${variant.aspectRatio}</dd></div>
        <div><dt>Rim</dt><dd>${variant.rimDiameter}"</dd></div>
        <div><dt>Load Index</dt><dd>${variant.loadIndex}</dd></div>
        <div><dt>Speed Rating</dt><dd>${variant.speedRating}</dd></div>
      </dl>
    `;
    list.append(card);
  });

  return list;
}

function applyFilter(block, filter) {
  const rows = block.querySelectorAll('.ts-table tbody tr, .ts-card');
  rows.forEach((row) => {
    const show = filter === 'all' || row.dataset.mostUsed === 'true';
    row.toggleAttribute('hidden', !show);
  });

  block.querySelectorAll('.ts-filter-btn').forEach((btn) => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function syncHeroSizeCount(block, count) {
  const hero = block.closest('main, body')?.querySelector('.product-hero .product-hero-size-count');
  if (hero) hero.textContent = `${count} Size(s) Available`;
}

/**
 * loads and decorates the tyre-sizes block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = getRows(block);
  if (!rows.length) return;

  const header = document.createElement('div');
  header.className = 'ts-header';

  const variants = [];

  rows.forEach((cells) => {
    if (isSizeRow(cells)) {
      variants.push(parseSizeRow(cells));
      return;
    }

    if (!header.querySelector('h2') && cells.length === 1) {
      const text = cells[0].textContent.trim();
      if (text.length < 80 && !cells[0].querySelector('picture, img, ul, ol')) {
        const heading = document.createElement('h2');
        heading.textContent = text;
        moveInstrumentation(cells[0], heading);
        header.append(heading);
        return;
      }
    }

    if (!header.querySelector('.ts-intro') && cells.some((c) => c.textContent.trim().length > 80)) {
      const intro = document.createElement('div');
      intro.className = 'ts-intro';
      cells.forEach((cell) => {
        moveInstrumentation(cell, intro);
        while (cell.firstElementChild) intro.append(cell.firstElementChild);
      });
      header.append(intro);
    }
  });

  if (!variants.length) return;

  const hasMostUsed = variants.some((v) => v.isMostUsed);
  const filters = document.createElement('div');
  filters.className = 'ts-filters';
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', 'Filter tyre sizes');

  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = 'ts-filter-btn active';
  allBtn.dataset.filter = 'all';
  allBtn.textContent = 'All Sizes';
  allBtn.setAttribute('aria-pressed', 'true');

  filters.append(allBtn);

  if (hasMostUsed) {
    const popularBtn = document.createElement('button');
    popularBtn.type = 'button';
    popularBtn.className = 'ts-filter-btn';
    popularBtn.dataset.filter = 'popular';
    popularBtn.textContent = 'Most used sizes';
    popularBtn.setAttribute('aria-pressed', 'false');
    filters.append(popularBtn);
  }

  const body = document.createElement('div');
  body.className = 'ts-body';
  body.append(buildTable(variants), buildCards(variants));

  const children = [];
  if (header.childElementCount) children.push(header);
  children.push(filters, body);
  block.replaceChildren(...children);

  block.dataset.sizeCount = String(variants.length);
  syncHeroSizeCount(block, variants.length);

  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.ts-filter-btn');
    if (!btn) return;
    applyFilter(block, btn.dataset.filter === 'popular' ? 'popular' : 'all');
  });
}
