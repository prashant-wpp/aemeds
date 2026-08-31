/*
 * Vertical Carousel — runtime coordinator (no author insertion).
 *
 * The `.vertical-carousel` wrapper (with chapter sections + optional trailing
 * fragment host) is created in `scripts.js`. This module adds scroll-snap
 * behavior, a rail generated from chapter section metadata, a11y, and
 * prompt/icon sync between the active chapter and the hoisted Command Bar.
 */

/**
 * Reads chapter metadata and produces a rail entry.
 * @param {Element} section
 * @param {number} index
 * @returns {{ label: string, thumb: string|null, thumbAlt: string, anchor: string, index: number }}
 */
function chapterMeta(section, index) {
  const data = section.dataset;
  const heading = section.querySelector('h1, h2, h3');
  return {
    label: data.railLabel || heading?.textContent?.trim() || `Chapter ${index + 1}`,
    thumb: data.railThumb || null,
    thumbAlt: data.railAlt || '',
    anchor: section.id || '',
    index,
  };
}

/**
 * Builds the right-rail navigation from chapter metadata.
 * @param {HTMLElement} wrapper
 * @param {Element[]} chapters
 * @returns {HTMLElement}
 */
function buildRail(wrapper, chapters) {
  const rail = document.createElement('nav');
  rail.className = 'vertical-carousel-rail';
  rail.setAttribute('aria-label', 'Chapter navigation');

  chapters.forEach((section, index) => {
    const meta = chapterMeta(section, index);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'vertical-carousel-rail-item';
    button.dataset.slideIndex = String(index);
    button.setAttribute('aria-label', meta.label);
    button.setAttribute('aria-current', index === 0 ? 'true' : 'false');

    if (meta.thumb) {
      const img = document.createElement('img');
      img.src = meta.thumb;
      img.alt = meta.thumbAlt;
      img.loading = 'lazy';
      img.decoding = 'async';
      button.append(img);
    }
    const label = document.createElement('span');
    label.className = 'vertical-carousel-rail-label';
    label.textContent = meta.label;
    button.append(label);

    button.addEventListener('click', () => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    rail.append(button);
  });

  wrapper.append(rail);
  return rail;
}

/**
 * Renders the scroll cue for a chapter, wired to advance to the next section.
 * @param {Element} section
 */
function attachScrollCue(section) {
  const label = section.dataset.commandCue;
  if (!label) return;
  const cue = document.createElement('button');
  cue.type = 'button';
  cue.className = 'vertical-carousel-scroll-cue';
  cue.innerHTML = `<span>${label}</span><span class="vertical-carousel-scroll-cue-arrow" aria-hidden="true">↓</span>`;
  cue.addEventListener('click', () => {
    section.nextElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  section.append(cue);
}

/**
 * Wraps the section's default background image / video in a media layer so
 * chapter content can sit on top.
 * @param {Element} section
 */
function stageChapterMedia(section) {
  const contentWrapper = section.querySelector(':scope > .default-content-wrapper');
  if (!contentWrapper) return;

  const media = document.createElement('div');
  media.className = 'vertical-carousel-media';

  const picture = contentWrapper.querySelector(':scope > p > picture, :scope > picture');
  if (picture) {
    const paragraph = picture.closest('p');
    media.append(picture);
    if (paragraph && !paragraph.textContent.trim() && !paragraph.children.length) {
      paragraph.remove();
    }
  }
  const video = contentWrapper.querySelector(':scope > video, :scope > p > video');
  if (video) {
    media.append(video);
  }

  if (media.children.length) {
    section.prepend(media);
  }
}

/**
 * Syncs the active chapter's prompt/icon/segment/chips onto the shared bar
 * via a public event. Command Bar listens for it.
 * @param {Element} section
 */
function syncCommandBar(section) {
  const data = section.dataset;
  const detail = {
    placeholder: data.commandPrompt || '',
    leadingIcon: data.commandIcon || '',
    segmentHint: data.commandSegment || '',
    chips: (data.commandChips || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    source: 'vertical-carousel',
    chapterId: section.id || '',
  };
  window.dispatchEvent(new CustomEvent('apollo:command-bar:sync', { detail }));
}

/**
 * Observes which chapter is currently in view and syncs bar / rail state.
 * @param {HTMLElement} wrapper
 * @param {Element[]} chapters
 * @param {HTMLElement|null} rail
 */
function observeActiveChapter(wrapper, chapters, rail) {
  const railItems = rail ? [...rail.querySelectorAll('.vertical-carousel-rail-item')] : [];
  let activeIndex = 0;

  const setActive = (index) => {
    if (index === activeIndex && wrapper.dataset.activeSlide !== undefined) return;
    activeIndex = index;
    wrapper.dataset.activeSlide = String(index);
    chapters.forEach((section, sectionIndex) => {
      section.classList.toggle('is-active', sectionIndex === index);
    });
    railItems.forEach((item, itemIndex) => {
      item.setAttribute('aria-current', itemIndex === index ? 'true' : 'false');
    });
    syncCommandBar(chapters[index]);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.55) return;
      const index = chapters.indexOf(entry.target);
      if (index >= 0) setActive(index);
    });
  }, { threshold: [0.55, 0.75] });

  chapters.forEach((section) => observer.observe(section));

  wrapper.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault();
      chapters[Math.min(activeIndex + 1, chapters.length - 1)]
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      chapters[Math.max(activeIndex - 1, 0)]
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  setActive(0);
}

/**
 * Waits for the shared Command Bar (inside a fragment section) to appear and
 * moves it into the persistent chrome layer of the carousel.
 * @param {HTMLElement} wrapper
 */
function hoistCommandBar(wrapper) {
  const chrome = document.createElement('div');
  chrome.className = 'vertical-carousel-command-host';
  wrapper.append(chrome);

  const tryMove = () => {
    const bar = wrapper.querySelector('.command-bar');
    if (!bar) return false;
    chrome.append(bar);
    const fragmentHost = wrapper.querySelector('.vertical-carousel-chrome');
    if (fragmentHost && !fragmentHost.querySelector('.block:not([data-block-name="fragment"])')) {
      fragmentHost.setAttribute('aria-hidden', 'true');
    }
    return true;
  };

  if (tryMove()) return;

  const observer = new MutationObserver(() => {
    if (tryMove()) observer.disconnect();
  });
  observer.observe(wrapper, { childList: true, subtree: true });
}

/**
 * Runtime entry point invoked from scripts.js.
 * @param {HTMLElement} wrapper the `.vertical-carousel` element
 */
export default async function decorate(wrapper) {
  if (!wrapper || !wrapper.classList.contains('vertical-carousel')) return;

  const chapters = [...wrapper.querySelectorAll(':scope > .section[data-chapter="true"]')];
  chapters.forEach((section, index) => {
    section.classList.add('vertical-carousel-chapter');
    section.dataset.slideIndex = String(index);
    stageChapterMedia(section);
    attachScrollCue(section);
  });

  const rail = chapters.length > 1 ? buildRail(wrapper, chapters) : null;
  hoistCommandBar(wrapper);
  observeActiveChapter(wrapper, chapters, rail);
}
