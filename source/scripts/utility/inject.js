import { noact } from './utility/noact.js';

const getNonce = () => {
  const { nonce } = [...document.scripts].find(script => script.nonce) || '';
  if (!nonce) console.error('Empty nonce attribute: injected script may not run');
  return nonce;
};
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

/**
 * @param {Function} func - Function to run in the page context
 * @param {Array} [args] - Array of arguments to be run the function with
 * @param {Element} [target] - Element to append script to; accessible as
 *                             document.currentScript.parentElement in the injected function
 * @returns {Promise<any>} The return value of the function or caught exception
 */
export const inject = async (func, args = [], target = document.documentElement) => {
  const name = `dbplus$${func.name || 'injected'}`;
  const async = func instanceof AsyncFunction;

  const script = noact({
    tag: 'script',
    nonce: getNonce(),
    children: `{
    const { dataset } = document.currentScript;
    const ${name} = ${func.toString()};
    const returnValue = ${name}(...${JSON.stringify(args)});
    ${async
        ? `returnValue
          .then(result => { dataset.result = JSON.stringify(result || null); })
          .catch(exception => { dataset.exception = JSON.stringify({
            message: exception.message,
            name: exception.name,
            stack: exception.stack,
            ...exception
          })})
        `
        : 'dataset.result = JSON.stringify(returnValue || null);'
      }
    }`
  });

  if (async) {
    return new Promise((resolve, reject) => {
      const attributeObserver = new MutationObserver((mutations, observer) => {
        if (mutations.some(({ attributeName }) => attributeName === 'data-result')) {
          observer.disconnect();
          resolve(JSON.parse(script.dataset.result));
        } else if (mutations.some(({ attributeName }) => attributeName === 'data-exception')) {
          observer.disconnect();
          reject(JSON.parse(script.dataset.exception));
        }
      });

      attributeObserver.observe(script, {
        attributes: true,
        attributeFilter: ['data-result', 'data-exception']
      });
      target.append(script);
      script.remove();
    });
  } else {
    target.append(script);
    script.remove();
    return JSON.parse(script.dataset.result);
  }
};
