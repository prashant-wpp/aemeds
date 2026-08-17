import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const VEHICLE_TYPES = new Set([
  'suv', 'car', 'truck', 'bus', 'lcv', 'bike', 'van', 'scooter', 'agricultural', 'industrial', 'earthmover',
]);

function isEmptyCell(cell) {
  return !cell?.textContent?.trim() && !cell?.querySelector('picture, img, a[href]');
}

function isImageCell(cell) {
  return !!cell.querySelector('picture, img');
}

function isVehicleTypeCell(cell) {
  const text = cell.textContent.trim().toLowerCase();
  return VEHICLE_TYPES.has(text) && !isImageCell(cell);
}

function getCellText(cell) {
  return cell?.textContent?.trim() || '';
}

function isSkuCell(cell) {
  const text = getCellText(cell);
  if (/^sku[:\s]/i.test(text) || cell.querySelector('code')) return true;
  if (/^\d{2,8}$/.test(text)) return true;
  const singleParagraph = cell.querySelector(':scope > p, :scope > div > p');
  return !!singleParagraph && /^\d{2,8}$/.test(singleParagraph.textContent.trim());
}

function isBrochureCell(cell) {
  const link = cell.querySelector('a[href]');
  return !!link && /brochure|download/i.test(cell.textContent);
}

function isTitleCell(cell) {
  if (isImageCell(cell) || isVehicleTypeCell(cell) || isSkuCell(cell) || isBrochureCell(cell)) {
    return false;
  }
  if (cell.querySelector('h1, h2, h3, h4, h5, h6')) return true;
  if (cell.querySelector('p, ul, ol') || cell.textContent.trim().length > 100) return false;
  return !!cell.textContent.trim();
}

function isTaglineCell(cell) {
  if (isImageCell(cell) || isVehicleTypeCell(cell) || isSkuCell(cell) || isBrochureCell(cell)) {
    return false;
  }
  if (cell.querySelector('h1, h2, h3, p, ul, ol, blockquote')) return false;
  const text = getCellText(cell);
  if (/^\d+$/.test(text)) return false;
  return text.length > 0 && text.length <= 100;
}

function getAuthoredCells(block) {
  const cells = [];
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      if (!isEmptyCell(cell)) cells.push(cell);
    });
  });
  return cells;
}

function buildSku(text) {
  const sku = document.createElement('p');
  sku.className = 'product-hero-sku';
  sku.textContent = text.replace(/^sku[:\s]*/i, '');
  return sku;
}

/**
 * loads and decorates the product-hero block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cells = getAuthoredCells(block);
  if (!cells.length) return;

  const badges = document.createElement('div');
  badges.className = 'product-hero-badges';

  const vehicleBadge = document.createElement('span');
  vehicleBadge.className = 'product-hero-vehicle';

  const sizeBadge = document.createElement('span');
  sizeBadge.className = 'product-hero-size-count';

  const media = document.createElement('div');
  media.className = 'product-hero-media';

  const content = document.createElement('div');
  content.className = 'product-hero-content';

  const actions = document.createElement('div');
  actions.className = 'product-hero-actions';

  let titleAdded = false;

  cells.forEach((cell) => {
    if (isVehicleTypeCell(cell)) {
      vehicleBadge.textContent = cell.textContent.trim();
      return;
    }

    if (isImageCell(cell)) {
      moveInstrumentation(cell, media);
      while (cell.firstElementChild) media.append(cell.firstElementChild);
      return;
    }

    if (isSkuCell(cell)) {
      const skuText = cell.textContent.trim();
      const sku = buildSku(skuText);
      moveInstrumentation(cell, sku);
      block.dataset.sku = sku.textContent;
      content.append(sku);
      return;
    }

    if (!titleAdded && isTitleCell(cell)) {
      moveInstrumentation(cell, content);
      while (cell.firstElementChild) content.append(cell.firstElementChild);
      titleAdded = true;
      return;
    }

    if (!content.querySelector('.product-hero-tagline') && isTaglineCell(cell)) {
      const tagline = document.createElement('p');
      tagline.className = 'product-hero-tagline';
      tagline.textContent = cell.textContent.trim();
      moveInstrumentation(cell, tagline);
      content.append(tagline);
      return;
    }

    if (isBrochureCell(cell)) {
      const link = cell.querySelector('a[href]');
      if (link) {
        moveInstrumentation(cell, link);
        link.classList.add('button');
        actions.append(link);
      }
      return;
    }

    moveInstrumentation(cell, content);
    while (cell.firstElementChild) content.append(cell.firstElementChild);
  });

  if (vehicleBadge.textContent) badges.append(vehicleBadge);
  badges.append(sizeBadge);

  const children = [media, content];
  if (badges.childElementCount) content.prepend(badges);
  if (actions.childElementCount) content.append(actions);

  block.replaceChildren(...children);

  if (!content.querySelector('.product-hero-tagline')) {
    const candidate = [...content.querySelectorAll('p:not(.product-hero-sku)')].find((p) => {
      const text = p.textContent.trim();
      return text.length > 0 && text.length <= 100;
    });
    if (candidate) candidate.classList.add('product-hero-tagline');
  }

  block.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, true, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
}
