import { chapterMediaStore } from '../../scripts/chapter-media.js';

/*
 * Vertical Carousel — runtime coordinator (no author insertion).
 *
 * The `.vertical-carousel` wrapper (with chapter sections + optional trailing
 * fragment host) is created in `scripts.js`. This module adds scroll-snap
 * behavior, a rail generated from chapter section metadata, a11y, and
 * prompt/icon sync between the active chapter and the hoisted Command Bar.
 */

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
 * @param {HTMLVideoElement} video
 * @param {string} [poster]
 */
function prepareBackgroundVideo(video, poster) {
  video.classList.add('vertical-carousel-video');
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.setAttribute('tabindex', '-1');
  if (poster) video.poster = poster;
}

/**
 * Builds a background <video> from a URL (section metadata or authored link).
 * @param {string} src
 * @param {string} [poster]
 * @param {{ force?: boolean }} [options] force=true when the URL came from a video DAM field
 * @returns {HTMLVideoElement|null}
 */
function createBackgroundVideo(src, poster, { force = false } = {}) {
  if (!src) return null;
  if (!force && !isVideoUrl(src)) return null;
  const video = document.createElement('video');
  video.src = src;
  prepareBackgroundVideo(video, poster);
  return video;
}

/**
 * Builds a full-bleed <picture> from a DAM image URL stored in section metadata.
 * @param {string} src
 * @param {string} [alt]
 * @returns {HTMLPictureElement|null}
 */
function createBackgroundPicture(src, alt = '') {
  if (!src) return null;
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = 'eager';
  img.fetchPriority = 'high';
  picture.append(img);
  return picture;
}

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
 * Wraps the section's background image / video in a full-bleed media layer.
 *
 * Order of preference:
 * 1. Nodes preserved from section-metadata (DAM picture / video / link)
 * 2. Dataset URLs left by decorateSections
 * 3. Default-content Image / video link in the chapter body
 * @param {Element} section
 */
function stageChapterMedia(section) {
  const contentWrapper = section.querySelector(':scope > .default-content-wrapper');
  const media = document.createElement('div');
  media.className = 'vertical-carousel-media';

  const stash = chapterMediaStore.get(section);
  let picture = null;

  // 1) Preserved DAM picture from section-metadata
  if (stash?.picture) {
    picture = stash.picture;
    media.append(picture);
  } else if (stash?.imageSrc) {
    picture = createBackgroundPicture(stash.imageSrc, stash.imageAlt || '');
    if (picture) media.append(picture);
  } else if (section.dataset.backgroundImage) {
    // 2) URL string from decorateSections
    picture = createBackgroundPicture(
      section.dataset.backgroundImage,
      section.dataset.backgroundAlt || '',
    );
    if (picture) media.append(picture);
  } else if (contentWrapper) {
    // 3) Fallback: Image in chapter body
    picture = contentWrapper.querySelector(':scope > p > picture, :scope > picture');
    if (picture) {
      const paragraph = picture.closest('p');
      media.append(picture);
      if (paragraph && !paragraph.textContent.trim() && !paragraph.children.length) {
        paragraph.remove();
      }
    }
  }

  const posterSrc = picture?.querySelector('img')?.src || '';

  // Video: preserved node → preserved href → dataset → body
  if (stash?.video) {
    prepareBackgroundVideo(stash.video, posterSrc);
    media.append(stash.video);
  } else {
    const videoSrc = stash?.videoHref || section.dataset.backgroundVideo || '';
    if (videoSrc) {
      const video = createBackgroundVideo(videoSrc, posterSrc, { force: true });
      if (video) media.append(video);
    } else if (contentWrapper) {
      const existingVideo = contentWrapper.querySelector(':scope > video, :scope > p > video');
      if (existingVideo) {
        prepareBackgroundVideo(existingVideo, posterSrc);
        media.append(existingVideo);
      } else {
        const videoLink = [...contentWrapper.querySelectorAll('a[href]')]
          .find((a) => isVideoUrl(a.href));
        if (videoLink) {
          const video = createBackgroundVideo(videoLink.href, posterSrc);
          if (video) {
            media.append(video);
            const paragraph = videoLink.closest('p');
            videoLink.remove();
            if (paragraph && !paragraph.textContent.trim() && !paragraph.children.length) {
              paragraph.remove();
            }
          }
        }
      }
    }
  }

  if (media.children.length) {
    section.prepend(media);
  }
}

/**
 * Applies Command Bar vertical alignment on the shared host.
 * @param {HTMLElement|null} host
 * @param {string} align
 */
function applyCommandAlign(host, align) {
  if (!host) return;
  const value = ['top', 'middle', 'bottom'].includes(align) ? align : 'bottom';
  host.dataset.align = value;
}

/**
 * Syncs the active chapter's prompt/icon/segment/chips/align onto the shared bar.
 * @param {Element} section
 * @param {HTMLElement|null} commandHost
 */
function syncCommandBar(section, commandHost) {
  const data = section.dataset;
  applyCommandAlign(commandHost, data.commandAlign || 'bottom');
  const detail = {
    placeholder: data.commandPrompt || '',
    leadingIcon: data.commandIcon || '',
    segmentHint: data.commandSegment || '',
    chips: (data.commandChips || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    align: data.commandAlign || 'bottom',
    source: 'vertical-carousel',
    chapterId: section.id || '',
  };
  window.dispatchEvent(new CustomEvent('apollo:command-bar:sync', { detail }));
}

/**
 * Plays/pauses chapter background videos based on which slide is active.
 * @param {Element[]} chapters
 * @param {number} activeIndex
 */
function syncChapterVideos(chapters, activeIndex) {
  chapters.forEach((section, index) => {
    const video = section.querySelector('.vertical-carousel-media video');
    if (!video) return;
    if (index === activeIndex) {
      video.play?.().catch(() => {});
    } else {
      video.pause?.();
    }
  });
}

/**
 * Observes which chapter is currently in view and syncs bar / rail state.
 * @param {HTMLElement} wrapper
 * @param {Element[]} chapters
 * @param {HTMLElement|null} rail
 * @param {HTMLElement|null} commandHost
 */
function observeActiveChapter(wrapper, chapters, rail, commandHost) {
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
    syncChapterVideos(chapters, index);
    syncCommandBar(chapters[index], commandHost);
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
 * Waits for the shared Command Bar (inside a fragment / first chapter) to
 * appear and moves it into the persistent chrome layer of the carousel.
 * @param {HTMLElement} wrapper
 * @returns {HTMLElement} the command host element
 */
function hoistCommandBar(wrapper) {
  const chrome = document.createElement('div');
  chrome.className = 'vertical-carousel-command-host';
  chrome.dataset.align = 'bottom';
  wrapper.append(chrome);

  const tryMove = () => {
    const bar = wrapper.querySelector('.command-bar');
    if (!bar || chrome.contains(bar)) return Boolean(chrome.querySelector('.command-bar'));
    chrome.append(bar);
    const fragmentHost = wrapper.querySelector('.vertical-carousel-chrome');
    if (fragmentHost && !fragmentHost.querySelector('.block:not([data-block-name="fragment"])')) {
      fragmentHost.setAttribute('aria-hidden', 'true');
    }
    return true;
  };

  if (!tryMove()) {
    const observer = new MutationObserver(() => {
      if (tryMove()) observer.disconnect();
    });
    observer.observe(wrapper, { childList: true, subtree: true });
  }

  return chrome;
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
  const commandHost = hoistCommandBar(wrapper);
  observeActiveChapter(wrapper, chapters, rail, commandHost);
}
