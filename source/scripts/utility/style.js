import { noact } from './noact.js';

/**
 * @param {string} css - string of CSS rules 
 * @returns {Element} an HTML <style> element containing the given rules
 */
export const style = (css = '') => noact({
  tag: 'style',
  className: 'dbplus-style',
  innerText: css
});

/**
 * @param {string} str - space-separated string of one or more class names
 * @returns {string} string of conjoined [data-css~='selector'] selectors
 */
export const s = (str = '') => str.split(' ').map(sel => `[data-css~='${sel}']`).join('');

/**
 * @param {Element} target - element to copy class from
 * @param {string} className - decoded classname to copy
 * @returns {string} encoded classname corresponding to the input classname
 */
export const smartCopy = (target, className) => {
  const position = target.getAttribute('data-css').split(' ').indexOf(className);
  return target.classList.item(position) || '';
}
