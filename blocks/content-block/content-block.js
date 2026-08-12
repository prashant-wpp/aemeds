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

function isEmptyCell(cell) {
  return !cell?.textContent?.trim() && !cell?.querySelector('picture, img, a[href]');
}

function getAuthoredLink(container) {
  const link = container?.querySelector?.('a[href]') || (container?.matches?.('a[href]') ? container : null);
  if (!link) return null;
  const href = link.getAttribute('href')?.trim();
  if (!href || href === '#') return null;
  return link;
}

function isCtaCell(cell) {
  const link = getAuthoredLink(cell);
  return !!link
    && !cell.querySelector('picture, img')
    && !getVideoId(link.href);
}

const CTA_TYPES = new Set(['primary', 'secondary']);

function isCtaTypeCell(cell) {
  const text = cell?.textContent?.trim().toLowerCase();
  return !!text && CTA_TYPES.has(text) && !cell.querySelector('a, picture, img, h3, h4, p');
}

function getCtaType(link, contentCells, ctaCellIndex, skippedCells) {
  const typeCell = contentCells.find((cell, index) => index > ctaCellIndex && isCtaTypeCell(cell));
  if (typeCell) {
    skippedCells.add(typeCell);
    return typeCell.textContent.trim().toLowerCase();
  }
  if (link.closest('em')) return 'secondary';
  if (link.closest('strong')) return 'primary';
  return 'primary';
}

function buildCtaWrapper(link, ctaType) {
  const wrapper = document.createElement('p');
  const formattedParent = link.parentElement?.matches?.('strong, em') ? link.parentElement : null;

  if (formattedParent) {
    wrapper.append(formattedParent);
    return wrapper;
  }

  if (ctaType === 'secondary') {
    const em = document.createElement('em');
    em.append(link);
    wrapper.append(em);
  } else if (ctaType === 'primary') {
    const strong = document.createElement('strong');
    strong.append(link);
    wrapper.append(strong);
  } else {
    wrapper.append(link);
  }

  return wrapper;
}

function isButtonElement(el) {
  const link = getAuthoredLink(el);
  if (!link || getVideoId(link.href)) return false;
  return el.querySelector('a strong, strong a, a em, em a')
    || (el.tagName === 'P' && el.querySelector('a') && el.children.length === 1
      && link.textContent === el.textContent.trim());
}

function wrapAsHeading(el, tag) {
  if (!el) return;
  const tagName = tag.toUpperCase();
  if (el.matches('h1, h2, h3, h4, h5, h6')) {
    if (el.tagName !== tagName) {
      const heading = document.createElement(tag);
      heading.innerHTML = el.innerHTML;
      moveInstrumentation(el, heading);
      el.replaceWith(heading);
    }
    return;
  }

  const heading = document.createElement(tag);
  if (el.children.length) {
    while (el.firstElementChild) heading.append(el.firstElementChild);
  } else {
    heading.textContent = el.textContent.trim();
  }
  moveInstrumentation(el, heading);
  el.replaceWith(heading);
}

function wrapAsParagraph(el) {
  if (!el || el.matches('p, h1, h2, h3, h4, h5, h6')) return;

  const paragraph = document.createElement('p');
  if (el.children.length) {
    while (el.firstElementChild) paragraph.append(el.firstElementChild);
  } else {
    paragraph.textContent = el.textContent.trim();
  }
  moveInstrumentation(el, paragraph);
  el.replaceWith(paragraph);
}

function normalizeHeader(header) {
  const children = [...header.children];
  if (!children.length) return;
  wrapAsHeading(children[0], 'h2');
  children.slice(1).forEach((child) => wrapAsParagraph(child));
}

function normalizeCardBody(bodyDiv) {
  wrapAsHeading(bodyDiv.firstElementChild, 'h3');
}

function appendAuthoredCta(footerDiv, cell, contentCells, skippedCells) {
  const link = getAuthoredLink(cell);
  if (!link) return;

  const cellIndex = contentCells.indexOf(cell);

  if (!link.textContent.trim()) {
    const labelCell = contentCells[cellIndex + 1];
    const label = labelCell?.textContent?.trim();
    if (label && !getAuthoredLink(labelCell) && !isCtaTypeCell(labelCell)
      && !labelCell.querySelector('picture, img, h3, h4, p')) {
      link.textContent = label;
      skippedCells.add(labelCell);
    }
  }

  if (!link.textContent.trim()) return;

  const ctaType = getCtaType(link, contentCells, cellIndex, skippedCells);
  footerDiv.append(buildCtaWrapper(link, ctaType));
}

function appendFooterCta(footerDiv, el, contentCells, skippedCells) {
  const link = getAuthoredLink(el);
  if (!link) return;

  if (el.tagName === 'P' && link.closest('strong, em')) {
    footerDiv.append(el);
    return;
  }

  const cellIndex = contentCells.indexOf(el);
  const ctaType = cellIndex >= 0
    ? getCtaType(link, contentCells, cellIndex, skippedCells)
    : getCtaType(link, [], -1, skippedCells);
  footerDiv.append(buildCtaWrapper(link, ctaType));
}

function appendPlainTextCell(cell, bodyDiv, titleAdded) {
  const text = cell.textContent.trim();
  if (!text) return titleAdded;

  if (!titleAdded && !bodyDiv.querySelector('h3, h4')) {
    const heading = document.createElement('h3');
    heading.textContent = text;
    bodyDiv.append(heading);
    return true;
  }

  const paragraph = document.createElement('p');
  if (cell.children.length) {
    while (cell.firstElementChild) paragraph.append(cell.firstElementChild);
  } else {
    paragraph.textContent = text;
  }
  bodyDiv.append(paragraph);
  return titleAdded;
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
  normalizeHeader(header);

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
    const mediaCell = cells.find((cell) => cell.querySelector('picture, img')) || cells[0];
    const contentCells = cells.filter((cell) => cell !== mediaCell && !isEmptyCell(cell));

    const mediaDiv = document.createElement('div');
    mediaDiv.className = 'cb-media';

    if (mediaCell) {
      const videoCell = contentCells.find((cell) => {
        const videoLink = cell.querySelector('a[href]');
        return videoLink && getVideoId(videoLink.href);
      });
      const link = mediaCell.querySelector('a[href]') || videoCell?.querySelector('a[href]');
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

    const hasStructuredText = contentCells.length === 1
      && contentCells[0].querySelector('h3, h4, p');

    const skippedCells = new Set();

    if (hasStructuredText) {
      [...contentCells[0].children].forEach((el) => {
        if (el.querySelector('a[href]') && !getAuthoredLink(el)) return;
        if (isButtonElement(el)) appendFooterCta(footerDiv, el, contentCells, skippedCells);
        else bodyDiv.append(el);
      });
    } else {
      let titleAdded = false;
      contentCells.forEach((cell) => {
        if (skippedCells.has(cell) || isCtaTypeCell(cell)) return;

        const videoLink = cell.querySelector('a[href]');
        if (videoLink && getVideoId(videoLink.href) && !cell.querySelector('picture, img')) return;

        if (isCtaCell(cell)) {
          appendAuthoredCta(footerDiv, cell, contentCells, skippedCells);
          return;
        }

        if (cell.querySelector('h3, h4, p')) {
          while (cell.firstElementChild) bodyDiv.append(cell.firstElementChild);
          if (bodyDiv.querySelector('h3, h4')) titleAdded = true;
          return;
        }

        const text = cell.textContent.trim();
        if (!text) return;

        if (titleAdded && bodyDiv.querySelector('p') && !cell.querySelector('a')) return;

        titleAdded = appendPlainTextCell(cell, bodyDiv, titleAdded);
      });
    }

    normalizeCardBody(bodyDiv);

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
  new ResizeObserver(() => updateNav(list, prevBtn, nextBtn)).observe(list);
}
