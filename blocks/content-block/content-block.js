import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function getVideoUrl(url) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0`;

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}

/**
 * loads and decorates the content-block block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const media = document.createElement('div');
  media.className = 'cb-media';

  const text = document.createElement('div');
  text.className = 'cb-text';

  [...row.children].forEach((cell) => {
    if (cell.querySelector('picture, img')) {
      moveInstrumentation(cell, media);
      while (cell.firstElementChild) media.append(cell.firstElementChild);
    } else {
      const link = cell.querySelector('a[href]');
      const embedUrl = link ? getVideoUrl(link.href) : null;

      if (embedUrl && cell.children.length === 1 && cell.querySelector('p')?.children.length === 1) {
        moveInstrumentation(cell, media);
        const wrapper = document.createElement('div');
        wrapper.className = 'cb-video';
        const iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('frameborder', '0');
        iframe.title = link.textContent || 'Video';
        wrapper.append(iframe);
        media.append(wrapper);
      } else {
        moveInstrumentation(cell, text);
        while (cell.firstElementChild) text.append(cell.firstElementChild);
      }
    }
  });

  block.replaceChildren(media, text);

  block.querySelectorAll('.cb-media picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });
}
