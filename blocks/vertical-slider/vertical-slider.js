import { moveInstrumentation } from '../../scripts/scripts.js';
import { extractNestedBlocks, loadNestedBlocks } from '../../scripts/nested-blocks.js';

/**
 * @param {Element} block
 * @returns {{ showNavigation: boolean, navigationLabel: string, configRows: Set<Element> }}
 */
function readConfig(block) {
  /** @type {{ showNavigation: boolean, navigationLabel: string, configRows: Set<Element> }} */
  const config = {
    showNavigation: true,
    navigationLabel: 'Homepage chapters',
    configRows: new Set(),
  };

  [...block.children].forEach((row) => {
    if (row.children.length !== 2) return;
    const key = row.children[0]?.textContent?.trim();
    const value = row.children[1]?.textContent?.trim() || '';
    if (key === 'showNavigation') {
      config.showNavigation = /^(true|yes|1)$/i.test(value);
      config.configRows.add(row);
    } else if (key === 'navigationLabel') {
      if (value) config.navigationLabel = value;
      config.configRows.add(row);
    }
  });

  return config;
}

/**
 * @param {Element} track
 * @param {string} label
 * @returns {HTMLElement|null}
 */
function buildNavigation(track, label) {
  const slides = [...track.children];
  if (slides.length < 2) return null;

  const nav = document.createElement('nav');
  nav.className = 'vertical-slider-nav';
  nav.setAttribute('aria-label', label);

  slides.forEach((slide, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'vertical-slider-nav-dot';
    button.dataset.slideIndex = String(index);
    button.setAttribute('aria-label', `Go to slide ${index + 1}`);
    button.setAttribute('aria-current', index === 0 ? 'true' : 'false');
    nav.append(button);
  });

  return nav;
}

/**
 * @param {Element} block
 * @param {Element} track
 * @param {HTMLElement|null} nav
 */
function bindNavigation(block, track, nav) {
  const slides = [...track.children];
  const dots = nav ? [...nav.querySelectorAll('.vertical-slider-nav-dot')] : [];
  let activeIndex = 0;

  const setActive = (index) => {
    activeIndex = index;
    dots.forEach((dot, dotIndex) => {
      dot.setAttribute('aria-current', dotIndex === index ? 'true' : 'false');
    });
    block.dataset.activeSlide = String(index);
  };

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = Number(dot.dataset.slideIndex);
      slides[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActive(index);
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.55) return;
      const index = slides.indexOf(entry.target);
      if (index >= 0) setActive(index);
    });
  }, {
    root: block,
    threshold: [0.55, 0.75],
  });

  slides.forEach((slide) => observer.observe(slide));

  block.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault();
      slides[Math.min(activeIndex + 1, slides.length - 1)]
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      slides[Math.max(activeIndex - 1, 0)]
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

/**
 * loads and decorates the vertical-slider block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readConfig(block);
  const { nested, remaining } = extractNestedBlocks(block, ['chapter']);
  const contentRows = remaining.filter((row) => !config.configRows.has(row));

  const track = document.createElement('div');
  track.className = 'vertical-slider-track';

  const chapterBlocks = nested.map(({ block: chapterBlock }) => chapterBlock);
  await loadNestedBlocks(chapterBlocks);

  nested.forEach(({ row, block: chapterBlock }) => {
    const slide = document.createElement('div');
    slide.className = 'vertical-slider-slide';
    moveInstrumentation(row, slide);

    const wrapper = chapterBlock.closest('.chapter-wrapper');
    if (wrapper && row.contains(wrapper)) {
      slide.append(wrapper);
    } else {
      slide.append(chapterBlock);
    }

    track.append(slide);
  });

  contentRows.forEach((row) => {
    if (row.children.length !== 2) {
      const slide = document.createElement('div');
      slide.className = 'vertical-slider-slide';
      moveInstrumentation(row, slide);
      while (row.firstElementChild) slide.append(row.firstElementChild);
      track.append(slide);
    }
  });

  const nav = config.showNavigation ? buildNavigation(track, config.navigationLabel) : null;

  block.replaceChildren(track);
  if (nav) block.append(nav);

  block.tabIndex = 0;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-label', config.navigationLabel);
  bindNavigation(block, track, nav);
}
