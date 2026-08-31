import {
  dispatchOpenFinder,
  dispatchOpenIntelligence,
  dispatchQuery,
} from '../../scripts/overlay-events.js';
import { decorateIcons } from '../../scripts/aem.js';

/**
 * @param {Element} block
 * @returns {Record<string, string>}
 */
function readKeyValue(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    const key = keyCell?.textContent.trim();
    if (!key) return;
    const link = valueCell?.querySelector('a');
    config[key] = link?.href || valueCell?.textContent.trim() || '';
  });
  return config;
}

/**
 * loads and decorates the command-bar block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const raw = readKeyValue(block);
  const config = {
    placeholder: raw.placeholder || "I'm looking for car tyres",
    leadingIcon: raw.leadingIcon || 'car',
    submitLabel: raw.submitLabel || 'Submit',
    showAttach: /^(true|yes|1)$/i.test(raw.showAttach || ''),
    action: raw.action || 'open-intelligence',
    navigateHref: raw.link || '',
    segmentHint: raw.segmentHint || '',
  };

  const form = document.createElement('form');
  form.className = 'command-bar-form';
  form.setAttribute('role', 'search');

  if (config.leadingIcon && config.leadingIcon !== 'none') {
    const icon = document.createElement('span');
    icon.className = `icon icon-${config.leadingIcon}`;
    form.append(icon);
  }

  if (config.showAttach) {
    const attach = document.createElement('button');
    attach.type = 'button';
    attach.className = 'command-bar-attach';
    attach.setAttribute('aria-label', 'Attach');
    attach.textContent = '+';
    form.append(attach);
  }

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.className = 'command-bar-input';
  input.placeholder = config.placeholder;
  input.autocomplete = 'off';
  form.append(input);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'command-bar-submit';
  submit.setAttribute('aria-label', config.submitLabel);
  submit.innerHTML = '<span aria-hidden="true">→</span>';
  form.append(submit);

  const runAction = (source = 'command-bar') => {
    const query = input.value.trim();
    const detail = {
      query,
      source,
      segment: config.segmentHint || undefined,
    };

    switch (config.action) {
      case 'open-finder':
        dispatchOpenFinder(detail);
        break;
      case 'navigate':
        if (config.navigateHref) window.location.href = config.navigateHref;
        break;
      case 'query':
        dispatchQuery(detail);
        break;
      case 'open-intelligence':
      default:
        dispatchOpenIntelligence(detail);
        break;
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    runAction('command-bar-submit');
  });

  input.addEventListener('focus', () => {
    if (config.action === 'open-intelligence') {
      runAction('command-bar-focus');
    }
  });

  block.replaceChildren(form);
  decorateIcons(block);

  // Optional chip row rendered under the bar. Updated per active chapter.
  const chips = document.createElement('div');
  chips.className = 'command-bar-chips';
  chips.hidden = true;
  block.append(chips);

  /**
   * External surfaces (e.g. Vertical Carousel) can dispatch this event to
   * update the bar for the currently active chapter.
   * @param {CustomEvent} event
   */
  const applySync = (event) => {
    const detail = event.detail || {};
    if (typeof detail.placeholder === 'string' && detail.placeholder) {
      input.placeholder = detail.placeholder;
    }
    if (typeof detail.leadingIcon === 'string' && detail.leadingIcon) {
      const existing = form.querySelector(':scope > .icon');
      if (detail.leadingIcon === 'none') {
        existing?.remove();
      } else {
        const iconEl = existing || document.createElement('span');
        iconEl.className = `icon icon-${detail.leadingIcon}`;
        iconEl.replaceChildren();
        if (!existing) form.prepend(iconEl);
        decorateIcons(form);
      }
    }
    if (typeof detail.segmentHint === 'string') {
      config.segmentHint = detail.segmentHint;
    }
    if (Array.isArray(detail.chips)) {
      chips.replaceChildren(...detail.chips.map((label) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'command-bar-chip';
        chip.textContent = label;
        chip.addEventListener('click', () => {
          input.value = label;
          runAction('command-bar-chip');
        });
        return chip;
      }));
      chips.hidden = detail.chips.length === 0;
    }
    if (detail.chapterId) {
      block.dataset.activeChapter = detail.chapterId;
    }
  };

  window.addEventListener('apollo:command-bar:sync', applySync);
}
