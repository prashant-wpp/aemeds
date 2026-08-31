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
}
