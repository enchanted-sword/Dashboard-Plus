/**
 * @param {string} string
 * @returns words in the string
 */
export const words = string => string
  .replace(/\W/g, '_')
  .replace(/([a-z])([A-Z])/g, '$1_$2')
  .replace(/(\D)(\d)/g, '$1_$2')
  .replace(/(\d)(\D)/g, '$1_$2')
  .split('_').filter((w) => w !== '');

/**
 * @param {string} string - String to convert
 * @returns The strin in camelCase
 */
export const camelCase = string => words(string).reduce((result, word, index) => {
  word = word.toLowerCase();
  return result + (index ? upperFirst(word) : word);
}, '');

/**
 * @param {string} string - String to convert
 * @returns The string in snake_case
 */
export const snakeCase = string => words(string).reduce((result, word, index) => result + (index ? '_' : '') + word.toLowerCase(), '');

const deepConvertKeys = (content, caseConverter) => {
  if (content instanceof Array) {
    return content.map((nextLevel) => deepConvertKeys(nextLevel, caseConverter));
  }

  if (typeof content === 'object' && content !== null) {
    return Object.keys(content).reduce((result, key) => {
      const convertedKey = caseConverter(key);
      let value = content[key];

      if (typeof value === 'object') {
        value = deepConvertKeys(value, caseConverter);
      }

      result[convertedKey] = value;

      return result;
    }, {});
  }

  return content;
}

/**
 * Converts an object's keys to camelCase, removing non-alphanumerical characters
 * @param {object} obj - Object to convert
 * @returns The object with non-alphanumeric characters removed, in camelCase
 */
export const keysToCamelCase = obj => deepConvertKeys(obj, camelCase);

/**
 * @param {object} obj - Object to convert
 * @returns The object with non-alphanumeric characters removed, in snake_case
 */
export const keysToSnakeCase = obj => deepConvertKeys(obj, snakeCase);