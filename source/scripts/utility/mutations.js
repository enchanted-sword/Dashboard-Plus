import { cellSelector, postSelector } from './document.js';

const root = document.getElementById('root') || document.body; // fallback for some early loads
const addedNodesQueue = [];

let updateQueued = false;
let timerId;

export const mutationManager = Object.freeze({
  listeners: new Map(),

  /**
   * Start a mutation callback
   * @param {string} selector - CSS selector for elements to target
   * @param {Function} func - Callback function for matching elements
   */
  start(selector, func) {
    if (this.listeners.has(func)) this.listeners.delete(func);
    this.listeners.set(func, selector);
    this.trigger(func);
  },

  /**
   * Stop a mutation callback
   * @param {Function} func - Function to remove
   */
  stop(func) {
    if (this.listeners.has(func)) this.listeners.delete(func);
  },

  /**
   * Trigger a mutation callback on all matching elements
   * @param {Function} func - Function to run
   */
  trigger(func) {
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

export const postFunction = Object.freeze({
  functions: new Map(),

  /**
   * Start a mutation callback on new posts
   * @param {string} selector - CSS selector for elements to target
   * @param {Function} func - Callback function for matching elements
   */
  start(func, filter = false) {
    if (this.functions.has(func)) this.functions.delete(func);
    this.functions.set(func, filter);
    if (mutationManager.listeners.has(onNewPosts)) mutationManager.trigger(onNewPosts);
    else (mutationManager.start(postSelector, onNewPosts));
  },

  /**
   * Stop a mutation callback
   * @param {Function} func - Function to remove
   */
  stop(func) {
    this.functions.delete(func)
  }
});
const onNewPosts = posts => {
  for (const [func, filter] of postFunction.functions) {
    filter ? func(posts.filter(post => post.matches(filter))) : func(posts)
  }
}

const funcManager = (funcMap, testNodes) => {
  for (const [func, selector] of funcMap) {
    if (func.length === 0) {
      const shouldRun = testNodes.some(testNode => testNode.matches(selector) || testNode.querySelector(selector) !== null);
      if (shouldRun) {
        try {
          func();
        } catch (e) {
          console.error(e);
        }
      }
      continue;
    }

    const matchingElements = [
      ...testNodes.filter(testNode => testNode.matches(selector)),
      ...testNodes.flatMap(testNode => [...testNode.querySelectorAll(selector)])
    ].filter((value, index, array) => index === array.indexOf(value));

    if (matchingElements.length !== 0) {
      try {
        func(matchingElements);
      } catch (e) {
        console.error(e);
      }
    }
  }
};
const nodeManager = () => {
  updateQueued = false;

  const addedNodes = addedNodesQueue
    .splice(0)
    .filter(addedNode => addedNode.isConnected);

  if (addedNodes.length === 0) return;

  funcManager(mutationManager.listeners, addedNodes);
};

const observer = new MutationObserver(mutations => {
  const addedNodes = mutations
    .flatMap(({ addedNodes }) => [...addedNodes])
    .filter(addedNode => addedNode instanceof Element);

  addedNodesQueue.push(...addedNodes);

  requestAnimationFrame(nodeManager);

  if (addedNodes.some(addedNode => addedNode.parentElement?.matches(cellSelector))) {
    cancelAnimationFrame(timerId);
    nodeManager();
  } else if (updateQueued === false) {
    timerId = requestAnimationFrame(nodeManager);
    updateQueued = true;
  }
});

observer.observe(root, { childList: true, subtree: true });
