import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const IMAGE_POSITIONS = new Set(['left', 'right']);

function isEmptyCell(cell) {
  return !cell?.textContent?.trim() && !cell?.querySelector('picture, img');
}

function isImageCell(cell) {
  return !!cell.querySelector('picture, img');
}

function isHeadingTypeCell(cell) {
  const text = cell.textContent.trim().toLowerCase();
  return HEADING_TAGS.has(text) && !isImageCell(cell);
}

function isImagePositionCell(cell) {
  const text = cell.textContent.trim().toLowerCase();
  return IMAGE_POSITIONS.has(text) && !isImageCell(cell);
}

function isDescriptionCell(cell) {
  if (cell.querySelector('p, ul, ol, blockquote')) return true;
  if (cell.querySelector('br')) return true;
  return cell.textContent.trim().length > 120;
}

function isTitleCell(cell) {
  if (isImageCell(cell) || isHeadingTypeCell(cell) || isImagePositionCell(cell)) return false;
  if (isDescriptionCell(cell)) return false;
  if (cell.querySelector('h1, h2, h3, h4, h5, h6')) return true;
  return !!cell.textContent.trim();
}

function normalizeTitle(cell, titleType) {
  const existingHeading = cell.querySelector('h1, h2, h3, h4, h5, h6');
  const tag = titleType || existingHeading?.tagName.toLowerCase() || 'h2';
  const text = existingHeading?.textContent?.trim() || cell.textContent.trim();
  if (!text) return null;

  const heading = document.createElement(tag);
  heading.textContent = text;
  if (existingHeading?.id) heading.id = existingHeading.id;
  return heading;
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

/**
 * loads and decorates the image-text block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cells = getAuthoredCells(block);
  if (!cells.length) return;

  let titleType = 'h2';
  let imagePosition = 'left';

  const header = document.createElement('div');
  header.className = 'it-header';

  const body = document.createElement('div');
  body.className = 'it-body';

  const media = document.createElement('div');
  media.className = 'it-media';

  const content = document.createElement('div');
  content.className = 'it-content';

  cells.forEach((cell) => {
    if (isHeadingTypeCell(cell)) {
      titleType = cell.textContent.trim().toLowerCase();
      return;
    }

    if (isImagePositionCell(cell)) {
      imagePosition = cell.textContent.trim().toLowerCase();
      return;
    }

    if (isImageCell(cell)) {
      moveInstrumentation(cell, media);
      while (cell.firstElementChild) media.append(cell.firstElementChild);
      return;
    }

    if (isTitleCell(cell)) {
      const heading = normalizeTitle(cell, titleType);
      if (heading) {
        moveInstrumentation(cell, heading);
        header.append(heading);
      }
      return;
    }

    moveInstrumentation(cell, content);
    while (cell.firstElementChild) content.append(cell.firstElementChild);
  });

  if (imagePosition === 'right') {
    body.classList.add('image-text-reverse');
  }

  body.append(media, content);

  const children = [];
  if (header.childElementCount) children.push(header);
  children.push(body);
  block.replaceChildren(...children);

  block.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }, { width: '600' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });
}
