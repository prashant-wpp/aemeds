import { extractNestedBlocks, loadNestedBlocks } from '../../scripts/nested-blocks.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * @param {string} value
 * @returns {boolean}
 */
function isVideoUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value, window.location.href);
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url.pathname) || url.protocol === 'blob:';
  } catch {
    return false;
  }
}

/**
 * @param {Element[]} rows
 * @returns {Record<string, Element|undefined>}
 */
function readKeyValueCells(rows) {
  const cells = {};
  rows.forEach((row) => {
    const [keyCell, valueCell] = row.children;
    const key = keyCell?.textContent.trim();
    if (!key) return;
    cells[key] = valueCell;
  });
  return cells;
}

/**
 * @param {HTMLVideoElement} video
 */
function prepareBackgroundVideo(video) {
  video.classList.add('chapter-video');
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.setAttribute('tabindex', '-1');
}

/**
 * Resolves a background video from a DAM reference cell (link, video, or source).
 * @param {Element|undefined} cell
 * @returns {HTMLVideoElement|null}
 */
function resolveVideoFromCell(cell) {
  if (!cell) return null;

  const existing = cell.querySelector('video');
  if (existing) {
    const video = existing.cloneNode(true);
    prepareBackgroundVideo(video);
    return video;
  }

  const source = cell.querySelector('source[src]');
  const link = cell.querySelector('a[href]');
  const src = source?.getAttribute('src')
    || (link?.href && isVideoUrl(link.href) ? link.href : '')
    || (isVideoUrl(cell.textContent.trim()) ? cell.textContent.trim() : '');

  if (!src) return null;

  const video = document.createElement('video');
  video.src = src;
  prepareBackgroundVideo(video);
  return video;
}

/**
 * @param {Element} block
 */
function scrollToNextView(block) {
  const slider = block.closest('.vertical-slider');
  if (slider) {
    const slide = block.closest('.vertical-slider-slide');
    slide?.nextElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  const section = block.closest('.section');
  section?.nextElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * loads and decorates the chapter block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const { nested, remaining } = extractNestedBlocks(block, [
    'command-bar',
    'geo-banner',
    'cards',
    'text',
    'title',
  ]);

  const cells = readKeyValueCells(remaining);

  const backgroundPicture = cells.image?.querySelector('picture') || null;
  const thumbnailPicture = cells.thumbnail?.querySelector('picture') || null;
  const headingCell = cells.heading;
  const headingEl = headingCell?.querySelector('h1, h2, h3, h4, h5, h6');
  const headingText = headingCell?.textContent.trim();
  const heading = headingEl
    || (headingText
      ? Object.assign(document.createElement('h1'), { textContent: headingText })
      : null);

  const backgroundVideo = resolveVideoFromCell(cells.video);
  const scrollCueLabel = cells.scrollCueLabel?.textContent.trim() || '';

  let supporting = null;
  if (cells.description?.textContent.trim()) {
    supporting = document.createElement('div');
    supporting.className = 'chapter-supporting';
    supporting.append(...cells.description.childNodes);
  }

  const media = document.createElement('div');
  media.className = 'chapter-media';

  if (backgroundVideo) {
    const img = backgroundPicture?.querySelector('img');
    if (img?.src) backgroundVideo.poster = img.src;
    media.append(backgroundVideo);
  } else if (backgroundPicture) {
    backgroundPicture.classList.add('chapter-background');
    media.append(backgroundPicture);
  }

  const content = document.createElement('div');
  content.className = 'chapter-content';

  if (heading) content.append(heading);
  if (supporting) content.append(supporting);

  if (scrollCueLabel) {
    const cue = document.createElement('p');
    cue.className = 'chapter-scroll-cue';
    const label = document.createElement('span');
    label.textContent = scrollCueLabel;
    cue.append(label);
    cue.addEventListener('click', () => scrollToNextView(block));
    content.append(cue);
  }

  if (thumbnailPicture) {
    const thumb = document.createElement('div');
    thumb.className = 'chapter-thumbnail';
    thumb.append(thumbnailPicture);
    content.append(thumb);
  }

  const children = document.createElement('div');
  children.className = 'chapter-children';

  nested.forEach(({ row, block: nestedBlock }) => {
    moveInstrumentation(row, nestedBlock);
    children.append(nestedBlock);
  });

  block.replaceChildren(media, content);
  if (nested.length) block.append(children);

  await loadNestedBlocks(nested.map(({ block: nestedBlock }) => nestedBlock));
}
