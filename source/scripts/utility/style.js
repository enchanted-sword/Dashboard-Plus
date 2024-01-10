import { elem } from './jsTools.js';

/**
 * @param {string} css - string of CSS rules 
 * @returns {Element} an HTML <style> element containing the given rules
 */
export const style = (css = '') => elem('style', { class: 'dbplus-style' }, null, [css]);

/**
 * @param {string} str - space-separated string of one or more class names
 * @returns {string} string of space-separated [data-css~='selector'] selectors
 */
export const s = (str = '') => str.split(' ').map(sel => `[data-css~='${sel}']`).join('');
