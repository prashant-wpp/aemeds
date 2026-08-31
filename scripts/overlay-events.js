/**
 * Overlay / cross-block event helpers for Apollo Tyres flows.
 * Blocks dispatch these; overlay blocks listen. Do not import block modules here.
 */

export const EVENTS = {
  OPEN_INTELLIGENCE: 'apollo:open-intelligence',
  CLOSE_INTELLIGENCE: 'apollo:close-intelligence',
  OPEN_FINDER: 'apollo:open-finder',
  CLOSE_FINDER: 'apollo:close-finder',
  OPEN_NAV: 'apollo:open-nav',
  CLOSE_NAV: 'apollo:close-nav',
  VEHICLE_UPDATED: 'apollo:vehicle-updated',
  OPEN_DEALER: 'apollo:open-dealer',
  QUERY: 'apollo:query',
};

/**
 * @param {string} name
 * @param {object} [detail]
 */
export function dispatchApolloEvent(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

/**
 * @param {object} [detail]
 */
export function dispatchOpenIntelligence(detail = {}) {
  dispatchApolloEvent(EVENTS.OPEN_INTELLIGENCE, detail);
}

/**
 * @param {object} [detail]
 */
export function dispatchCloseIntelligence(detail = {}) {
  dispatchApolloEvent(EVENTS.CLOSE_INTELLIGENCE, detail);
}

/**
 * @param {object} [detail]
 */
export function dispatchOpenFinder(detail = {}) {
  dispatchApolloEvent(EVENTS.OPEN_FINDER, detail);
}

/**
 * @param {object} [detail]
 */
export function dispatchCloseFinder(detail = {}) {
  dispatchApolloEvent(EVENTS.CLOSE_FINDER, detail);
}

/**
 * @param {object} [detail]
 */
export function dispatchOpenDealer(detail = {}) {
  dispatchApolloEvent(EVENTS.OPEN_DEALER, detail);
}

/**
 * @param {object} [detail]
 */
export function dispatchQuery(detail = {}) {
  dispatchApolloEvent(EVENTS.QUERY, detail);
}
