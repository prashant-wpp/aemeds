const STORAGE_KEY = 'apollo-geo-banner-dismissed';
const MARKET_KEY = 'apollo-market';

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
    config[key] = valueCell?.textContent.trim() || '';
  });
  return config;
}

/**
 * loads and decorates the geo-banner block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const raw = readKeyValue(block);
  const config = {
    message: raw.message
      || 'Choose another country or region to see content specific to your location.',
    continueLabel: raw.continueLabel || 'Continue',
    marketLabel: raw.marketLabel || 'India',
    dismissible: !/^(false|no|0)$/i.test(raw.dismissible || 'true'),
  };

  try {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') {
      block.closest('.section')?.classList.add('geo-banner-hidden');
      block.remove();
      return;
    }
  } catch {
    // sessionStorage may be unavailable
  }

  const banner = document.createElement('div');
  banner.className = 'geo-banner-panel';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Location preference');

  const message = document.createElement('p');
  message.className = 'geo-banner-message';
  message.textContent = config.message;

  const market = document.createElement('button');
  market.type = 'button';
  market.className = 'geo-banner-market';
  market.textContent = config.marketLabel;
  market.setAttribute('aria-label', `Current market: ${config.marketLabel}`);

  const continueBtn = document.createElement('button');
  continueBtn.type = 'button';
  continueBtn.className = 'geo-banner-continue';
  continueBtn.textContent = config.continueLabel;

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
      sessionStorage.setItem(MARKET_KEY, config.marketLabel);
    } catch {
      // ignore
    }
    block.closest('.section')?.classList.add('geo-banner-hidden');
    block.remove();
  };

  continueBtn.addEventListener('click', dismiss);
  market.addEventListener('click', () => {
    // Market selector UI TBD — for now confirm current market
    continueBtn.focus();
  });

  const actions = document.createElement('div');
  actions.className = 'geo-banner-actions';
  actions.append(market, continueBtn);

  if (config.dismissible) {
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'geo-banner-close';
    close.setAttribute('aria-label', 'Dismiss');
    close.textContent = '×';
    close.addEventListener('click', dismiss);
    actions.append(close);
  }

  banner.append(message, actions);
  block.replaceChildren(banner);
}
