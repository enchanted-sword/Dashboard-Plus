import { cellSelector } from './document.js';

const root = document.getElementById('root');
const addedNodesPool = [];

let repaintQueued = false;
let timerId;

export const mutationManager = Object.freeze({
  listeners: new Map(),

  /**
   * Start a mutation callback
   * @param {string} selector - CSS selector for elements to target
   * @param {Function} func - Callback function for matching elements
   */
  start (selector, func) {
    if (this.listeners.has(func)) this.listeners.delete(func);
    this.listeners.set(func, selector);
    this.trigger(func);
  },

  /**
   * Stop a mutation callback
   * @param {Function} func - Function to remove
   */
  stop (func) {
    if (this.listeners.has(func)) this.listeners.delete(func);
  },

  /**
   * Trigger a mutation callback on all matching elements
   * @param {Function} func - Function to run
   */
  trigger (func) {
    const selector = this.listeners.get(func);
    if (!selector) return;

    if (func.length === 0) {
      const shouldRun = root.querySelector(selector) !== null;
      if (shouldRun) func();
      return;
    }

    const matchingElements = [...root.querySelectorAll(selector)];
    if (matchingElements.length !== 0) {
      func(matchingElements);
    }
  }
});

const onBeforeRepaint = () => {
  repaintQueued = false;

  const addedNodes = addedNodesPool
    .splice(0)
    .filter(addedNode => addedNode.isConnected);

  if (addedNodes.length === 0) return;

  for (const [func, selector] of mutationManager.listeners) {
    if (func.length === 0) {
      const shouldRun = addedNodes.some(addedNode => addedNode.matches(selector) || addedNode.querySelector(selector) !== null);
      if (shouldRun) func();
      continue;
    }

    const matchingElements = [
      ...addedNodes.filter(addedNode => addedNode.matches(selector)),
      ...addedNodes.flatMap(addedNode => [...addedNode.querySelectorAll(selector)])
    ].filter((value, index, array) => index === array.indexOf(value));

    if (matchingElements.length !== 0) {
      func(matchingElements);
    }
  }
};

const observer = new MutationObserver(mutations => {
  const addedNodes = mutations
    .flatMap(({ addedNodes }) => [...addedNodes])
    .filter(addedNode => addedNode instanceof Element);

  addedNodesPool.push(...addedNodes);

  if (addedNodes.some(addedNode => addedNode.parentElement?.matches(cellSelector))) {
    cancelAnimationFrame(timerId);
    onBeforeRepaint();
  } else if (repaintQueued === false) {
    timerId = requestAnimationFrame(onBeforeRepaint);
    repaintQueued = true;
  }
});

observer.observe(root, { childList: true, subtree: true });
