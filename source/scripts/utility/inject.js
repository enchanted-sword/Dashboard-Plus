/**
 * @param {Function} func - Function to run in the page context
 * @param {Array} [args] - Array of arguments to be run the function with
 * @param {Element} [target] - Element to append script to; appended as the last argument of the injected function
 * @returns {Promise<any>} The return value of the function or caught exception
 */
export const inject = (name, args = [], target = document.documentElement) =>
  new Promise((resolve, reject) => {
    const requestId = String(Math.random());
    const data = { name, args, id: requestId };

    const responseHandler = ({ detail }) => {
      const { id, result, exception } = JSON.parse(detail);
      if (id !== requestId) return;

      target.removeEventListener('dbplus-injection-response', responseHandler);
      exception ? reject(exception) : resolve(result);
    };
    target.addEventListener('dbplus-injection-response', responseHandler);

    target.dispatchEvent(
      new CustomEvent('dbplus-injection-request', { detail: JSON.stringify(data), bubbles: true })
    );
  });
