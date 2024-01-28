import { getStorage } from './jsTools.js';
import { inject } from './inject.js';

const { cssMap, languageData } = await getStorage(['cssMap', 'languageData']);

/**
 * @param {...string} keys - One or more source classnames
 * @returns {string[]} An array of equivalent classnames from the CSS map
 */
export const keyToClasses = (...keys) => keys.flatMap(key => cssMap[key]).filter(Boolean);

/**
 * @param {...string} keys - One or more source classnames
 * @returns {string} A space-separated string of equivalent classnames from the CSS map
 */
export const keyToString = (...keys) => keys.flatMap(key => cssMap[key]).filter(Boolean).join(' ');

/**
 * @param {...string} keys - One or more source classnames
 * @returns {string} - An :is() selector targeting all elements matching any of the given source classnames
 */
export const keyToCss = (...keys) => {
  const classes = keyToClasses(...keys);
  return `:is(${classes.map(className => `.${className}`).join(', ')})`;
};

/**
 * @param {string} string - A string to be translated
 * @returns {string} The localized string
 */
export const translate = (string = '') => `${languageData.translations[string] || string}`;

/**
 * @param {string} string - A string with a replaceable value to be translated
 * @param {string} replaceValue - A string to replace the replacable value 
 * @returns {string} The localized string with the replaced value
 */
export const replaceTranslate = (string = '', replaceValue = '') => translate(string).replace('%1$s', replaceValue);

/**
 * @param {...any} args - Arguments to pass to the API call
 * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#apifetch}
 * @returns {Promise<Response|Error>} Resolves or rejects with result of the API call
 */
export const apiFetch = async (...args) => {
  return inject(
    async (resource, init = {}) => {
      init.headers ??= {};
      init.headers['DBPlus'] = '1';

      if (init.body !== undefined) {
        const objects = [init.body];

        while (objects.length !== 0) {
          const currentObjects = objects.splice(0);

          currentObjects.forEach(obj => {
            Object.keys(obj).forEach(key => {
              const snakeCaseKey = key
                .replace(/^[A-Z]/, match => match.toLowerCase())
                .replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);

              if (snakeCaseKey !== key) {
                obj[snakeCaseKey] = obj[key];
                delete obj[key];
              }
            });
          });

          objects.push(
            ...currentObjects
              .flatMap(Object.values)
              .filter(value => value instanceof Object)
          );
        }
      }

      return window.tumblr.apiFetch(resource, init);
    },
    args
  );
};

/**
 * @param {string} url - Relative URL to navigate to
 */
export const navigate = async url => inject((path) => window.tumblr.navigate(path), [url]);
