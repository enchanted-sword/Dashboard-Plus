/**
 * Creates an HTML element from a string
 * @param {String} str - Valid HTML string
 * @return {Element|HTMLCollection} Parsed form of the string
 */
export const elemFromString = str => {
  const template = document.createElement('template');
  template.innerHTML = str;
  return template.content.children;
}

/**
 * Creates an HTML element with optional data
 * @param {string} tag - Element type
 * @param {object} [attributes] - Key-value pairs of HTML attributes ({ active: 'false' })
 * @param {object} [events] - Key-value pairs of events and callbacks (e.g. { input: () => {} })
 * @param {(Node[]|string[]|string)} [children] - Element children
 * @returns {Element} HTML Element
 */
export const elem = (tag, attributes = {}, events = {}, children) => {
  const element = attributes?.xmlns
    ? document.createElementNS(attributes.xmlns, tag)
    : document.createElement(tag);

  if (attributes) Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  if (events) Object.entries(events).forEach(([type, listener]) => element.addEventListener(type, listener));
  if (children) {
    if (typeof children === 'string') {
      element.replaceChildren(...elemFromString(children));
    } else {
      element.replaceChildren(...children);
      element.normalize();
    }
  } 

  return element;
};

/**
 * Fetches items from the extension's local storage
 * @param {string} keys - Array of strings corresponding to storage keys to fetch
 * @returns {object} Object of key-value pairs ({ version: 'X' })
 */ 
export const getStorage = async (keys = []) => {
  const storage = await browser.storage.local.get();
  const returnObj = {};
  for (const key of keys) {
    returnObj[key] = storage[key];
  }
  return returnObj;
};

/**
 * Fetches feature preferences
 * @param {string} feature - Feature name
 * @returns {object} Preferences object
 */
export const getPreferences = async (feature = '') => {
  const { preferences } = await getStorage(['preferences']);

  return preferences[feature].preferences;
};