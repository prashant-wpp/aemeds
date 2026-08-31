/**
 * @param {string} value
 * @returns {boolean}
 */
function isMediaUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value, window.location.href);
    return /\.(mp4|webm|ogg)(\?|$)/i.test(url.pathname) || url.protocol === 'blob:';
  } catch {
    return false;
  }
}

/**
 * @param {Element} block
 * @returns {Record<string, Element|undefined>}
 */
function readKeyValueCells(block) {
  const cells = {};
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    const key = keyCell?.textContent.trim();
    if (!key) return;
    cells[key] = valueCell;
  });
  return cells;
}

/**
 * loads and decorates the chapter block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cells = readKeyValueCells(block);

  const backgroundPicture = cells.image?.querySelector('picture') || null;
  const thumbnailPicture = cells.thumbnail?.querySelector('picture') || null;
  const headingCell = cells.heading;
  const headingEl = headingCell?.querySelector('h1, h2, h3, h4, h5, h6');
  const headingText = headingCell?.textContent.trim();
  const heading = headingEl
    || (headingText
      ? Object.assign(document.createElement('h1'), { textContent: headingText })
      : null);

  const videoRaw = cells.videoUrl?.querySelector('a')?.href
    || cells.videoUrl?.textContent.trim()
    || '';
  const videoUrl = isMediaUrl(videoRaw) ? videoRaw : '';
  const scrollCueLabel = cells.scrollCueLabel?.textContent.trim() || '';

  let supporting = null;
  if (cells.description?.textContent.trim()) {
    supporting = document.createElement('div');
    supporting.className = 'chapter-supporting';
    supporting.append(...cells.description.childNodes);
  }

  const media = document.createElement('div');
  media.className = 'chapter-media';

  if (videoUrl) {
    const video = document.createElement('video');
    video.className = 'chapter-video';
    video.src = videoUrl;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    const img = backgroundPicture?.querySelector('img');
    if (img?.src) video.poster = img.src;
    media.append(video);
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
    cue.addEventListener('click', () => {
      const section = block.closest('.section');
      const next = section?.nextElementSibling;
      next?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    content.append(cue);
  }

  if (thumbnailPicture) {
    const thumb = document.createElement('div');
    thumb.className = 'chapter-thumbnail';
    thumb.append(thumbnailPicture);
    content.append(thumb);
  }

  block.replaceChildren(media, content);
}
