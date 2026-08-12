import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function getVideoId(url) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (ytMatch) return { platform: 'youtube', id: ytMatch[1] };

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { platform: 'vimeo', id: vimeoMatch[1] };

  return null;
}

function getEmbedUrl(video) {
  if (video.platform === 'youtube') return `https://www.youtube-nocookie.com/embed/${video.id}?rel=0&autoplay=1`;
  if (video.platform === 'vimeo') return `https://player.vimeo.com/video/${video.id}?autoplay=1`;
  return null;
}

function buildPlayButton(thumbnail, videoUrl) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Play video');
  btn.className = 'cb-play';
  btn.append(thumbnail);

  btn.addEventListener('click', () => {
    const wrapper = btn.closest('.cb-media');
    const iframe = document.createElement('iframe');
    iframe.src = getEmbedUrl(videoUrl);
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('allow', 'autoplay; encrypted-media');
    iframe.title = 'Video';
    wrapper.replaceChildren(iframe);
    wrapper.classList.add('cb-playing');
  });

  return btn;
}

function updateNav(list, prevBtn, nextBtn) {
  prevBtn.disabled = list.scrollLeft <= 0;
  nextBtn.disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 1;
}

/**
 * loads and decorates the content-block block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const header = document.createElement('div');
  header.className = 'cb-header';

  while (rows.length && rows[0].children.length === 1) {
    const headerRow = rows.shift();
    moveInstrumentation(headerRow, header);
    const headerCell = headerRow.children[0];
    while (headerCell?.firstElementChild) {
      header.append(headerCell.firstElementChild);
    }
  }

  const slider = document.createElement('div');
  slider.className = 'cb-slider';

  const nav = document.createElement('div');
  nav.className = 'cb-nav';
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.setAttribute('aria-label', 'Previous');
  prevBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.setAttribute('aria-label', 'Next');
  nextBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  nav.append(prevBtn, nextBtn);

  const list = document.createElement('ul');
  list.className = 'cb-list';

  rows.forEach((row) => {
    const card = document.createElement('li');
    card.className = 'cb-card';
    moveInstrumentation(row, card);

    const cells = [...row.children];
    const mediaCell = cells[0];
    const textCell = cells[1];

    const mediaDiv = document.createElement('div');
    mediaDiv.className = 'cb-media';

    if (mediaCell) {
      const link = mediaCell.querySelector('a[href]');
      const videoInfo = link ? getVideoId(link.href) : null;

      if (videoInfo && mediaCell.querySelector('picture, img')) {
        mediaDiv.classList.add('cb-video');
        const pic = mediaCell.querySelector('picture') || mediaCell.querySelector('img');
        const playBtn = buildPlayButton(pic, videoInfo);
        mediaDiv.append(playBtn);
      } else if (videoInfo) {
        mediaDiv.classList.add('cb-video');
        const placeholder = document.createElement('div');
        placeholder.className = 'cb-video-placeholder';
        const playBtn = buildPlayButton(placeholder, videoInfo);
        mediaDiv.append(playBtn);
      } else {
        while (mediaCell.firstElementChild) mediaDiv.append(mediaCell.firstElementChild);
      }
    }

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'cb-body';

    const footerDiv = document.createElement('div');
    footerDiv.className = 'cb-footer';

    if (textCell) {
      [...textCell.children].forEach((el) => {
        const isButton = el.querySelector('a strong, strong a, a em, em a');
        if (isButton || (el.tagName === 'P' && el.querySelector('a') && el.children.length === 1 && el.querySelector('a')?.textContent === el.textContent.trim())) {
          footerDiv.append(el);
        } else {
          bodyDiv.append(el);
        }
      });
    }

    card.append(mediaDiv, bodyDiv);
    if (footerDiv.children.length) card.append(footerDiv);
    list.append(card);
  });

  slider.append(nav, list);
  block.replaceChildren(header, slider);

  block.querySelectorAll('.cb-media picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  prevBtn.addEventListener('click', () => {
    const cardWidth = list.querySelector('.cb-card')?.offsetWidth || 300;
    list.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', () => {
    const cardWidth = list.querySelector('.cb-card')?.offsetWidth || 300;
    list.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
  });

  list.addEventListener('scroll', () => updateNav(list, prevBtn, nextBtn));
  updateNav(list, prevBtn, nextBtn);
}
