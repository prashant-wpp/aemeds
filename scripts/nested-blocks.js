import { decorateBlock, loadBlock } from './aem.js';

/** Block names that may appear as nested children inside container blocks. */
export const NESTED_BLOCK_NAMES = [
  'chapter',
  'command-bar',
  'geo-banner',
  'cards',
  'link-chips',
  'text',
  'title',
];

/**
 * @param {Element} row
 * @param {string[]} [blockNames]
 * @returns {Element|null}
 */
function findBlockInRow(row, blockNames) {
  const names = blockNames || NESTED_BLOCK_NAMES;

  const rowName = [...row.classList].find((cls) => names.includes(cls));
  if (rowName) return row;

  if (row.children.length === 1) {
    const child = row.children[0];
    const childName = [...child.classList].find((cls) => names.includes(cls));
    if (childName) return child;
  }

  return names.reduce((found, name) => found || row.querySelector(`:scope > .${name}`), null);
}

/**
 * @param {Element} row
 * @returns {boolean}
 */
function isKeyValueRow(row) {
  if (row.children.length !== 2) return false;
  const key = row.children[0]?.textContent?.trim();
  return !!key && !findBlockInRow(row);
}

/**
 * Splits direct child rows into nested blocks vs remaining content rows.
 * @param {Element} container
 * @param {string[]} [blockNames] Optional allow-list of nested block names
 * @returns {{ nested: { row: Element, block: Element }[], remaining: Element[] }}
 */
export function extractNestedBlocks(container, blockNames) {
  /** @type {{ row: Element, block: Element }[]} */
  const nested = [];
  /** @type {Element[]} */
  const remaining = [];

  [...container.children].forEach((row) => {
    const blockEl = findBlockInRow(row, blockNames);
    if (blockEl && !isKeyValueRow(row)) {
      nested.push({ row, block: blockEl });
    } else {
      remaining.push(row);
    }
  });

  return { nested, remaining };
}

/**
 * Decorates and loads nested block elements.
 * @param {Element[]} blocks
 */
export async function loadNestedBlocks(blocks) {
  blocks.forEach((blockEl) => decorateBlock(blockEl));
  await Promise.all(blocks.map((blockEl) => loadBlock(blockEl)));
}
