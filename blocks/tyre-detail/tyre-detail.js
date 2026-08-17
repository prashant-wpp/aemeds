import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';

/**
 * Tyre Detail block
 * Authors provide the path to a Tyre Content Fragment (or a full JSON URL).
 * The block resolves the path to its JSON representation (.infinity.json),
 * fetches it, and renders a product hero with size table.
 *
 * The AEM host for fragment paths can be set site- or page-wide via the
 * "cf-host" metadata property; otherwise paths are fetched same-origin
 * (which works in Universal Editor, where pages render on the author domain).
 */

function getConfig(block) {
  const link = block.querySelector('a[href]');
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const texts = cells.map((c) => c.textContent.trim()).filter(Boolean);

  const source = link?.getAttribute('href')
    || texts.find((t) => /\.json(\?|$)/.test(t) || t.startsWith('/') || t.startsWith('http'))
    || '';
  const variation = texts.find((t) => /^[a-z][a-z0-9-]*$/i.test(t) && !t.includes('/') && t !== source) || 'master';

  return { source: source.trim(), variation };
}

/**
 * Turns a content fragment path into a fetchable JSON URL.
 * - already a .json URL/path: used as-is
 * - a path like /content/dam/aemeds/apterra-ht: .infinity.json is appended
 * - relative paths resolve against the "cf-host" metadata, if configured,
 *   otherwise against the current origin
 */
function resolveSourceUrl(source) {
  let url = source.replace(/\/$/, '');
  if (!/\.json(\?|$)/.test(url)) url = `${url}.infinity.json`;

  if (/^https?:\/\//.test(url)) return url;

  const host = getMetadata('cf-host');
  if (host) {
    try {
      return new URL(url, host).href;
    } catch {
      return url;
    }
  }
  return url;
}

/**
 * Extracts the flat CF payload from several possible JSON shapes:
 * - dam:Asset infinity.json: { "jcr:content": { data: { master: {...} } } }
 * - direct data node: { data: { master: {...} } }
 * - already-flat JSON: { tyreName: ..., sku: ... }
 */
function extractFragmentData(json, variation) {
  const data = json?.['jcr:content']?.data || json?.data;
  if (data) return data[variation] || data.master || null;
  if (json && typeof json === 'object') return json;
  return null;
}

function pick(data, ...keys) {
  const found = keys.find((k) => data[k] !== undefined && data[k] !== null && data[k] !== '');
  return found ? data[found] : '';
}

function toAbsoluteUrl(path, sourceUrl) {
  if (!path) return '';
  try {
    return new URL(path, sourceUrl).href;
  } catch {
    return path;
  }
}

function mapTyre(data, sourceUrl) {
  return {
    name: pick(data, 'tyreName', 'productName', 'title', 'name'),
    sku: pick(data, 'productId', 'sku', 'id'),
    vehicleType: pick(data, 'vehicleType', 'segment', 'category'),
    tagline: pick(data, 'tagline', 'subheading', 'subtitle'),
    description: pick(data, 'shortDescription', 'description', 'bodyCopy'),
    image: toAbsoluteUrl(pick(data, 'heroImage', 'image', 'productImage'), sourceUrl),
    imageAlt: pick(data, 'imageAlt', 'altText') || pick(data, 'tyreName', 'title', 'name'),
    sizeVariants: pick(data, 'sizeVariants', 'sizes', 'variants') || [],
  };
}

function mapSizeVariant(data) {
  return {
    widthMm: pick(data, 'widthMm', 'width'),
    aspectRatio: pick(data, 'aspectRatio', 'aspect'),
    rimDiameter: pick(data, 'rimDiameter', 'rim'),
    loadIndex: pick(data, 'loadIndex', 'load'),
    speedRating: pick(data, 'speedRating', 'speed'),
    displaySize: pick(data, 'displaySize', 'size'),
  };
}

async function fetchJson(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
  return resp.json();
}

/**
 * Size variants can be either inline objects or references (paths) to
 * other content fragments. Referenced fragments are fetched individually.
 */
async function resolveSizeVariants(variants, sourceUrl, variation) {
  const list = Array.isArray(variants) ? variants : [variants].filter(Boolean);

  const resolved = await Promise.all(list.map(async (variant) => {
    if (typeof variant === 'object') return mapSizeVariant(variant);

    if (typeof variant === 'string') {
      try {
        const url = toAbsoluteUrl(`${variant.replace(/\.infinity\.json$/, '')}.infinity.json`, sourceUrl);
        const json = await fetchJson(url);
        const data = extractFragmentData(json, variation);
        return data ? mapSizeVariant(data) : null;
      } catch {
        return null;
      }
    }
    return null;
  }));

  return resolved
    .filter((v) => v && (v.widthMm || v.displaySize))
    .map((v) => ({
      ...v,
      displaySize: v.displaySize || `${v.widthMm}/${v.aspectRatio} R${v.rimDiameter}`,
    }));
}

function renderHero(tyre) {
  const hero = document.createElement('div');
  hero.className = 'td-hero';

  const media = document.createElement('div');
  media.className = 'td-media';
  if (tyre.image) {
    const picture = createOptimizedPicture(tyre.image, tyre.imageAlt, true, [{ width: '750' }]);
    media.append(picture);
  }

  const content = document.createElement('div');
  content.className = 'td-content';

  if (tyre.vehicleType) {
    const badge = document.createElement('span');
    badge.className = 'td-badge';
    badge.textContent = tyre.vehicleType;
    content.append(badge);
  }

  if (tyre.name) {
    const heading = document.createElement('h1');
    heading.textContent = tyre.name;
    content.append(heading);
  }

  if (tyre.sku) {
    const sku = document.createElement('p');
    sku.className = 'td-sku';
    sku.textContent = tyre.sku;
    content.append(sku);
  }

  if (tyre.tagline) {
    const tagline = document.createElement('p');
    tagline.className = 'td-tagline';
    tagline.textContent = tyre.tagline;
    content.append(tagline);
  }

  if (tyre.description) {
    const desc = document.createElement('p');
    desc.className = 'td-description';
    desc.textContent = tyre.description;
    content.append(desc);
  }

  hero.append(media, content);
  return hero;
}

function renderSizes(variants) {
  const section = document.createElement('div');
  section.className = 'td-sizes';

  const heading = document.createElement('h2');
  heading.textContent = 'Find your right tyre size';
  section.append(heading);

  const table = document.createElement('table');
  table.className = 'td-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Width (mm)</th>
        <th scope="col">Aspect Ratio</th>
        <th scope="col">Rim Diameter</th>
        <th scope="col">Load Index</th>
        <th scope="col">Speed Rating</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  const cards = document.createElement('div');
  cards.className = 'td-cards';

  variants.forEach((v) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${v.widthMm}</td><td>${v.aspectRatio}</td><td>${v.rimDiameter}</td><td>${v.loadIndex}</td><td>${v.speedRating}</td>`;
    tbody.append(tr);

    const card = document.createElement('article');
    card.className = 'td-card';
    card.innerHTML = `
      <h3>${v.displaySize}</h3>
      <dl>
        <div><dt>Width</dt><dd>${v.widthMm} mm</dd></div>
        <div><dt>Aspect Ratio</dt><dd>${v.aspectRatio}</dd></div>
        <div><dt>Rim</dt><dd>${v.rimDiameter}"</dd></div>
        <div><dt>Load Index</dt><dd>${v.loadIndex}</dd></div>
        <div><dt>Speed Rating</dt><dd>${v.speedRating}</dd></div>
      </dl>
    `;
    cards.append(card);
  });

  section.append(table, cards);
  return section;
}

function renderError(block, source) {
  const error = document.createElement('p');
  error.className = 'td-error';
  error.textContent = source
    ? 'Tyre information is currently unavailable.'
    : 'No tyre fragment URL configured.';
  block.replaceChildren(error);
}

/**
 * loads and decorates the tyre-detail block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const { source, variation } = getConfig(block);

  if (!source) {
    renderError(block, source);
    return;
  }

  block.classList.add('td-loading');
  const sourceUrl = resolveSourceUrl(source);

  try {
    const json = await fetchJson(sourceUrl);
    const data = extractFragmentData(json, variation);
    if (!data) throw new Error('Unrecognized fragment JSON structure');

    const tyre = mapTyre(data, sourceUrl);
    const children = [renderHero(tyre)];

    const variants = await resolveSizeVariants(tyre.sizeVariants, sourceUrl, variation);
    if (variants.length) {
      children.push(renderSizes(variants));
      const badge = document.createElement('span');
      badge.className = 'td-size-count';
      badge.textContent = `${variants.length} Size(s) Available`;
      children[0].querySelector('.td-badge')?.after(badge);
    }

    block.replaceChildren(...children);
    if (tyre.sku) block.dataset.sku = tyre.sku;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('tyre-detail: failed to load fragment', sourceUrl, e);
    renderError(block, source);
  } finally {
    block.classList.remove('td-loading');
  }
}
