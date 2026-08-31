import {
  dispatchCloseIntelligence,
  dispatchOpenDealer,
  dispatchOpenFinder,
  dispatchQuery,
  EVENTS,
} from '../../scripts/overlay-events.js';
import {
  lockBodyScroll,
  restoreOpenerFocus,
  trapFocus,
} from '../../scripts/modal-utils.js';
import { decorateIcons } from '../../scripts/aem.js';

const CONFIG_KEYS = new Set(['title', 'assistPlaceholder']);

/**
 * @param {Element} row
 * @returns {boolean}
 */
function isConfigRow(row) {
  const [keyCell] = row.children;
  const key = keyCell?.textContent.trim();
  return CONFIG_KEYS.has(key);
}

/**
 * @param {Element} row
 * @returns {{ title: string, image?: Element, action: string, link: string }}
 */
function parseCardRow(row) {
  const cells = [...row.children];
  const picture = row.querySelector('picture');
  let cardTitle = '';
  let action = 'navigate';
  let link = '';

  cells.forEach((cell) => {
    if (cell.querySelector('picture')) return;
    const anchor = cell.querySelector('a');
    const text = cell.textContent.trim();
    if (!text) return;

    if (anchor && !link) {
      link = anchor.href;
      return;
    }

    if ([
      'open-finder', 'navigate', 'open-dealer',
      'segment-personal', 'segment-commercial', 'segment-agriculture', 'support',
    ].includes(text)) {
      action = text;
      return;
    }

    if (!cardTitle) cardTitle = text;
  });

  return {
    title: cardTitle,
    image: picture || undefined,
    action,
    link,
  };
}

/**
 * @param {object} card
 * @param {object} [context]
 */
function runCardAction(card, context = {}) {
  const detail = { source: 'intelligence-hub', ...context };

  switch (card.action) {
    case 'open-finder':
      dispatchOpenFinder(detail);
      break;
    case 'open-dealer':
      dispatchOpenDealer(detail);
      break;
    case 'segment-personal':
      dispatchOpenFinder({ ...detail, segment: 'personal' });
      break;
    case 'segment-commercial':
      dispatchOpenFinder({ ...detail, segment: 'commercial' });
      break;
    case 'segment-agriculture':
      dispatchOpenFinder({ ...detail, segment: 'agriculture' });
      break;
    case 'support':
    case 'navigate':
      if (card.link) window.location.href = card.link;
      break;
    default:
      break;
  }
}

/**
 * @param {Element} block
 * @param {object} config
 * @returns {Element}
 */
function buildAssistBar(config) {
  const form = document.createElement('form');
  form.className = 'intelligence-hub-assist';
  form.setAttribute('role', 'search');

  const icon = document.createElement('span');
  icon.className = 'icon icon-search';
  form.append(icon);

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'intelligence-hub-assist-input';
  input.placeholder = config.assistPlaceholder;
  input.autocomplete = 'off';
  input.name = 'q';
  form.append(input);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'intelligence-hub-assist-submit';
  submit.setAttribute('aria-label', 'Submit');
  submit.innerHTML = '<span aria-hidden="true">→</span>';
  form.append(submit);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query) {
      dispatchQuery({ query, source: 'intelligence-hub-assist' });
    }
  });

  return form;
}

/**
 * loads and decorates the intelligence-hub block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const config = {
    title: 'Welcome to Apollo Intelligence',
    assistPlaceholder: 'How may we assist you?',
  };
  const cards = [];

  [...block.children].forEach((row) => {
    if (isConfigRow(row)) {
      const [keyCell, valueCell] = row.children;
      const key = keyCell.textContent.trim();
      config[key] = valueCell.textContent.trim();
      return;
    }

    const isCard = row.querySelector('picture')
      || row.children.length > 2
      || ['open-finder', 'navigate', 'open-dealer', 'segment-personal',
        'segment-commercial', 'segment-agriculture', 'support'].some(
        (token) => row.textContent.includes(token),
      );

    if (isCard) {
      cards.push(parseCardRow(row));
    }
  });

  const overlay = document.createElement('div');
  overlay.className = 'intelligence-hub-overlay';
  overlay.hidden = true;

  const dialog = document.createElement('div');
  dialog.className = 'intelligence-hub-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', config.title);
  dialog.tabIndex = -1;

  const header = document.createElement('div');
  header.className = 'intelligence-hub-header';

  const title = document.createElement('h2');
  title.className = 'intelligence-hub-title';
  title.textContent = config.title;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'intelligence-hub-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.dataset.hubFocus = 'true';
  closeBtn.textContent = '×';

  header.append(title, closeBtn);

  const grid = document.createElement('div');
  grid.className = 'intelligence-hub-grid';

  const footer = document.createElement('div');
  footer.className = 'intelligence-hub-footer';
  footer.append(buildAssistBar(config));

  dialog.append(header, grid, footer);
  overlay.append(dialog);
  block.replaceChildren(overlay);

  let releaseFocusTrap = () => {};

  function close() {
    overlay.hidden = true;
    block.classList.remove('open');
    lockBodyScroll(false);
    releaseFocusTrap();
    releaseFocusTrap = () => {};
    dispatchCloseIntelligence({ source: 'intelligence-hub' });
    restoreOpenerFocus(dialog);
  }

  function open(detail = {}) {
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      if (!active.id) {
        active.id = `hub-opener-${Math.random().toString(36).slice(2, 9)}`;
      }
      dialog.dataset.openerId = active.id;
    }

    overlay.hidden = false;
    block.classList.add('open');
    lockBodyScroll(true);
    releaseFocusTrap = trapFocus(dialog);

    if (detail.query) {
      const input = dialog.querySelector('.intelligence-hub-assist-input');
      if (input) input.value = detail.query;
    }

    closeBtn.focus({ preventScroll: true });
  }

  cards.forEach((card, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'intelligence-hub-card';
    if (index === 0 || card.action === 'open-finder') {
      btn.classList.add('large');
    }

    if (card.image) {
      const media = document.createElement('div');
      media.className = 'intelligence-hub-card-media';
      media.append(card.image);
      btn.append(media);
    }

    const cardLabel = document.createElement('span');
    cardLabel.className = 'intelligence-hub-card-title';
    cardLabel.textContent = card.title;
    btn.append(cardLabel);

    btn.addEventListener('click', () => {
      runCardAction(card);
      close();
    });

    grid.append(btn);
  });

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  const onKeyDown = (e) => {
    if (e.key === 'Escape' && block.classList.contains('open')) {
      e.preventDefault();
      close();
    }
  };

  document.addEventListener('keydown', onKeyDown);

  window.addEventListener(EVENTS.OPEN_INTELLIGENCE, (e) => {
    open(e.detail || {});
  });

  window.addEventListener(EVENTS.CLOSE_INTELLIGENCE, () => {
    if (block.classList.contains('open')) close();
  });

  // Stub listener until tyre-finder block ships (Phase 3)
  window.addEventListener(EVENTS.OPEN_FINDER, () => {
    if (block.classList.contains('open')) close();
  });

  decorateIcons(block);
}
