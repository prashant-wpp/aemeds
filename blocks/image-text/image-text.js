import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const IMAGE_POSITIONS = new Set(['left', 'right']);

function isEmptyCell(cell) {
  return !cell?.textContent?.trim() && !cell?.querySelector('picture, img');
}

function isHeadingTypeCell(cell) {
  const text = cell.textContent.trim().toLowerCase();
  return HEADING_TAGS.has(text) && !cell.querySelector('picture, img, a, p, ul, ol');
}

function isImagePositionCell(cell) {
  const text = cell.textContent.trim().toLowerCase();
  return IMAGE_POSITIONS.has(text) && !cell.querySelector('picture, img, a, p, ul, ol, h1, h2, h3, h4, h5, h6');
}

function isImageCell(cell) {
  return !!cell.querySelector('picture, img');
}

function isDescriptionCell(cell) {
  return !!cell.querySelector('p, ul, ol, blockquote') || cell.querySelectorAll('div').length > 1;
}

function isTitleCell(cell) {
  if (isImageCell(cell) || isHeadingTypeCell(cell) || isImagePositionCell(cell)) return false;
  if (cell.querySelector('h1, h2, h3, h4, h5, h6')) return true;
  if (isDescriptionCell(cell)) return false;
  return !!cell.textContent.trim();
}

function normalizeTitle(cell, titleType) {
  const existingHeading = cell.querySelector('h1, h2, h3, h4, h5, h6');
  const tag = titleType || existingHeading?.tagName.toLowerCase() || 'h2';
  const text = existingHeading?.textContent?.trim() || cell.textContent.trim();
  if (!text) return null;

  const heading = document.createElement(tag);
  heading.textContent = text;
  return heading;
}

/**
 * loads and decorates the image-text block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const cells = [...row.children].filter((cell) => !isEmptyCell(cell));
  let titleType = 'h2';
  let imagePosition = 'left';

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
        content.prepend(heading);
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
  block.replaceChildren(body);

  block.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }, { width: '600' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });
}
