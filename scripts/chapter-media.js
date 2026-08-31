/**
 * Chapter media helpers — capture DAM image/video from section-metadata
 * before `decorateSections` removes that block.
 */

/** @type {WeakMap<Element, {
 *   picture: Element|null,
 *   imageSrc: string,
 *   imageAlt: string,
 *   video: Element|null,
 *   videoHref: string,
 * }>} */
export const chapterMediaStore = new WeakMap();

/**
 * @param {string} name
 * @returns {string}
 */
function toClassName(name) {
  return typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : '';
}

/**
 * Walks raw main sections, clones background image/video out of
 * `.section-metadata` rows, and stashes them for the carousel decorator.
 * @param {Element} main
 */
export function preserveChapterMedia(main) {
  if (!main) return;

  main.querySelectorAll(':scope > div').forEach((section) => {
    const meta = section.querySelector(':scope > .section-metadata');
    if (!meta) return;

    const stash = {
      picture: null,
      imageSrc: '',
      imageAlt: '',
      video: null,
      videoHref: '',
    };

    [...meta.children].forEach((row) => {
      const key = toClassName(row.children[0]?.textContent || '');
      const cell = row.children[1];
      if (!cell) return;

      if (key === 'background-image') {
        const picture = cell.querySelector('picture');
        const img = cell.querySelector('img');
        if (picture) {
          stash.picture = picture.cloneNode(true);
        } else if (img) {
          stash.imageSrc = img.src || img.getAttribute('src') || '';
          stash.imageAlt = img.alt || '';
        } else {
          const link = cell.querySelector('a[href]');
          stash.imageSrc = link?.href || cell.textContent.trim();
        }
      }

      if (key === 'background-video') {
        const video = cell.querySelector('video');
        const link = cell.querySelector('a[href]');
        if (video) {
          stash.video = video.cloneNode(true);
        } else if (link) {
          stash.videoHref = link.href;
        } else {
          const text = cell.textContent.trim();
          if (text) stash.videoHref = text;
        }
      }
    });

    if (stash.picture || stash.imageSrc || stash.video || stash.videoHref) {
      chapterMediaStore.set(section, stash);
    }
  });
}
